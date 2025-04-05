"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { JokeDisplay } from "@/components/joke-display";
import { ModelSelector } from "@/components/model-selector";
import { generateJoke, calculateQueryCost } from "@/actions/joke-actions";
import { topics, tones, jokeTypes } from "@/lib/joke-options";
import type { JokeFormValues, JokeResult } from "@/types/joke-types";
import { DEFAULT_MODEL_ID } from "@/lib/available-models";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAIModelQueryTool } from "@/hooks/use-ai-query-tool";
import { useMippyToken } from "@/hooks/use-mippy-token";
import { useAccount } from "wagmi";
import { TransactionStatus } from "@/components/transaction-status";

// Create a zod schema for form validation
const formSchema = z.object({
  topic: z.string(),
  tone: z.string(),
  type: z.string(),
  temperature: z.number().min(0.1).max(1),
  modelId: z.string(),
});

export function JokeGenerator() {
  const [joke, setJoke] = useState<JokeResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    queryAI,
    isLoading: isQueryLoading,
    querySuccess,
  } = useAIModelQueryTool();
  const { balance } = useMippyToken();
  const { isConnected } = useAccount();

  const form = useForm<JokeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "general",
      tone: "witty",
      type: "short",
      temperature: 0.7,
      modelId: DEFAULT_MODEL_ID,
    },
  });

  // Keep track of contract query lifecycle
  const [contractQueryInProgress, setContractQueryInProgress] = useState(false);
  const [queryCost, setQueryCost] = useState(1);

  // Update the effect to handle async cost calculation
  useEffect(() => {
    const subscription = form.watch(async (value) => {
      if (value.type && value.temperature) {
        try {
          const formValues = form.getValues();
          const cost = await calculateQueryCost(formValues);
          setQueryCost(cost);
        } catch (error) {
          console.error("Error calculating cost:", error);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Add state for transaction status
  const [transactionStatus, setTransactionStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");

  // Update the effect that checks for querySuccess to handle transaction status
  useEffect(() => {
    const processQuery = async () => {
      if (contractQueryInProgress && querySuccess) {
        setContractQueryInProgress(false);
        setTransactionStatus("success");

        // Now call the API since the contract call was successful
        const formValues = form.getValues();
        try {
          const result = await generateJoke(formValues);
          if (
            result.content.includes("Failed to generate joke") ||
            result.evaluation.feedback.includes("An error occurred")
          ) {
            setError(
              "Failed to generate joke. Please check your API key configuration."
            );
          }
          setJoke(result);
        } catch (error) {
          console.error("Failed to generate joke:", error);
          setError(
            "An error occurred while generating the joke. Please try again."
          );
        } finally {
          setIsGenerating(false);
        }
      }
    };

    processQuery();
  }, [querySuccess, contractQueryInProgress, form]);

  // Update the onSubmit function to handle async cost calculation
  async function onSubmit(data: JokeFormValues) {
    if (!isConnected) {
      setError("Please connect your wallet to generate jokes.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setTransactionStatus("idle");

    // Calculate cost based on parameters
    try {
      const cost = await calculateQueryCost(data);

      // Check if user has enough tokens
      if (balance < BigInt(cost * 10 ** 18)) {
        setError(
          "You don't have enough Mippy tokens. Click the wallet icon in the navbar to deposit ETH and get more tokens."
        );
        setIsGenerating(false);
        return;
      }

      // First call the smart contract
      setContractQueryInProgress(true);
      setTransactionStatus("pending");
      const success = await queryAI(cost);

      // If the contract call fails immediately, stop here
      if (success === false && !isQueryLoading) {
        setContractQueryInProgress(false);
        setIsGenerating(false);
        setTransactionStatus("error");
        setError("Failed to process token payment. Please try again.");
      }
    } catch (error) {
      console.error("Failed to query AI contract:", error);
      setError("Failed to process token payment. Please try again.");
      setIsGenerating(false);
      setContractQueryInProgress(false);
      setTransactionStatus("error");
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Generate a Joke</h2>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="modelId"
                  render={({ field }) => (
                    <ModelSelector
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />

                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a topic" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {topics.map((topic) => (
                            <SelectItem key={topic.value} value={topic.value}>
                              {topic.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose what the joke should be about
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tone</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a tone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tones.map((tone) => (
                            <SelectItem key={tone.value} value={tone.value}>
                              {tone.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Set the mood and style of the joke
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Joke Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a joke type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {jokeTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the structure of your joke
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Creativity Level: {field.value.toFixed(1)}
                      </FormLabel>
                      <FormControl>
                        <Slider
                          min={0.1}
                          max={1.0}
                          step={0.1}
                          value={[field.value]}
                          onValueChange={(values) => field.onChange(values[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Higher values make jokes more creative but potentially
                        less coherent
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <div className="p-3 bg-muted rounded-md mb-4">
                  <p className="text-sm font-medium">Cost: {queryCost} MIPPY</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    The cost is based on joke complexity and creativity settings
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isQueryLoading
                        ? "Processing Payment..."
                        : "Generating Joke..."}
                    </>
                  ) : (
                    "Generate Joke"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <TransactionStatus
            status={transactionStatus}
            title={
              transactionStatus === "pending"
                ? "Processing token payment..."
                : transactionStatus === "success"
                ? "Token payment successful"
                : transactionStatus === "error"
                ? "Token payment failed"
                : undefined
            }
            description={
              transactionStatus === "pending"
                ? "The blockchain is processing your MIPPY token payment."
                : transactionStatus === "success"
                ? "Your MIPPY tokens have been used to pay for the joke generation."
                : transactionStatus === "error"
                ? "There was an error processing your token payment. Please try again."
                : undefined
            }
          />
        </div>

        <JokeDisplay joke={joke} isLoading={isGenerating} />
      </div>
    </div>
  );
}
