"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2, AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { toast } from "@/hooks/use-toast";

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
  const {
    queryAI,
    approveAIQuery,
    hasEnoughAllowance,
    refetchAllowance,
    isLoading: isQueryLoading,
    isApproving,
    approvalSuccess,
    querySuccess,
    wasCancelled,
  } = useAIModelQueryTool();
  const {
    balance,
    formatWithDecimals,
    wasCancelled: tokenWasCancelled,
  } = useMippyToken();
  const { isConnected } = useAccount();

  const form = useForm<JokeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "general",
      tone: "witty",
      type: "short",
      temperature: 0.1,
      modelId: DEFAULT_MODEL_ID,
    },
  });

  // Keep track of contract query lifecycle
  const [contractQueryInProgress, setContractQueryInProgress] = useState(false);
  const [queryCost, setQueryCost] = useState(1);
  const [needsApproval, setNeedsApproval] = useState(false);

  // Add state for transaction status
  const [transactionStatus, setTransactionStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");

  // Update the effect to handle async cost calculation and check approval status
  useEffect(() => {
    const subscription = form.watch(async (value) => {
      if (value.type && value.temperature) {
        try {
          const formValues = form.getValues();
          const cost = await calculateQueryCost(formValues);
          setQueryCost(cost);

          // Check if we need approval
          const hasAllowance = hasEnoughAllowance(cost);
          setNeedsApproval(!hasAllowance);
        } catch (error) {
          console.error("Error calculating cost:", error);
          toast({
            title: "Error",
            description: "Failed to calculate token cost.",
            variant: "destructive",
          });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, hasEnoughAllowance]);

  // Refresh allowance check when approval status changes
  useEffect(() => {
    if (approvalSuccess) {
      refetchAllowance();
      const checkAllowance = async () => {
        const formValues = form.getValues();
        const cost = await calculateQueryCost(formValues);
        const hasAllowance = hasEnoughAllowance(cost);
        setNeedsApproval(!hasAllowance);
      };
      checkAllowance();
    }
  }, [approvalSuccess, form, hasEnoughAllowance, refetchAllowance]);

  // Update to handle cancellations in approval or query process
  useEffect(() => {
    if (
      (wasCancelled || tokenWasCancelled) &&
      transactionStatus === "pending"
    ) {
      setTransactionStatus("error");
      setIsGenerating(false);
      setContractQueryInProgress(false);

      toast({
        title: "Transaction Cancelled",
        description: "You cancelled the transaction in your wallet.",
        variant: "destructive",
      });
    }
  }, [wasCancelled, tokenWasCancelled, transactionStatus]);

  // Process query once contract call is successful
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
            toast({
              title: "API Error",
              description:
                "Failed to generate joke. Please check your API key configuration.",
              variant: "destructive",
            });
          }
          setJoke(result);
        } catch (error) {
          console.error("Failed to generate joke:", error);
          toast({
            title: "Error",
            description:
              "An error occurred while generating the joke. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsGenerating(false);
        }
      }
    };

    processQuery();
  }, [querySuccess, contractQueryInProgress, form]);

  // Handle token approval
  const handleApproval = async () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect your wallet to generate jokes.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Calculate cost based on parameters
      const formValues = form.getValues();
      const cost = await calculateQueryCost(formValues);

      // Check if user has enough tokens
      if (balance < formatWithDecimals(cost)) {
        toast({
          title: "Insufficient Balance",
          description:
            "You don't have enough Mippy tokens. Click the wallet icon in the navbar to deposit ETH and get more tokens.",
          variant: "destructive",
        });
        return;
      }

      // Trigger approval
      setTransactionStatus("pending");
      await approveAIQuery(cost);
    } catch (error) {
      console.error("Failed to approve tokens:", error);
      toast({
        title: "Approval Error",
        description: "Failed to approve tokens. Please try again.",
        variant: "destructive",
      });
      setTransactionStatus("error");
    }
  };

  // Handle joke generation after approval
  const handleGenerateJoke = async () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect your wallet to generate jokes.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setTransactionStatus("idle");

    try {
      // Calculate cost based on parameters
      const formValues = form.getValues();
      const cost = await calculateQueryCost(formValues);

      // First call the smart contract
      setContractQueryInProgress(true);
      setTransactionStatus("pending");
      const success = await queryAI(cost);

      // If the contract call fails immediately, stop here
      if (success === false && !isQueryLoading) {
        setContractQueryInProgress(false);
        setIsGenerating(false);
        setTransactionStatus("error");
        toast({
          title: "Contract Error",
          description: "Failed to process token payment. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to query AI contract:", error);
      toast({
        title: "Contract Error",
        description: "Failed to process token payment. Please try again.",
        variant: "destructive",
      });
      setIsGenerating(false);
      setContractQueryInProgress(false);
      setTransactionStatus("error");
    }
  };

  // When form is submitted, handle either approval or joke generation
  const onSubmit = async (data: JokeFormValues) => {
    if (needsApproval) {
      handleApproval();
    } else {
      handleGenerateJoke();
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="md:col-span-2">
          <TransactionStatus
            status={transactionStatus}
            title={
              transactionStatus === "pending" && needsApproval
                ? "Approving token spending..."
                : transactionStatus === "pending"
                ? "Processing token payment..."
                : transactionStatus === "success" && needsApproval
                ? "Token approval successful"
                : transactionStatus === "success"
                ? "Token payment successful"
                : transactionStatus === "error" &&
                  (wasCancelled || tokenWasCancelled)
                ? "Transaction cancelled"
                : transactionStatus === "error" && needsApproval
                ? "Token approval failed"
                : transactionStatus === "error"
                ? "Token payment failed"
                : undefined
            }
            description={
              transactionStatus === "pending" && needsApproval
                ? "The blockchain is processing your token approval."
                : transactionStatus === "pending"
                ? "The blockchain is processing your MIPPY token payment."
                : transactionStatus === "success" && needsApproval
                ? "Your MIPPY tokens have been approved. You can now generate the joke."
                : transactionStatus === "success"
                ? "Your MIPPY tokens have been used to pay for the joke generation."
                : transactionStatus === "error" &&
                  (wasCancelled || tokenWasCancelled)
                ? "You cancelled the transaction in your wallet. Please try again if you want to proceed."
                : transactionStatus === "error" && needsApproval
                ? "There was an error approving your tokens. Please try again."
                : transactionStatus === "error"
                ? "There was an error processing your token payment. Please try again."
                : undefined
            }
          />
        </div>

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

                {/* Two-step process: first approve, then generate */}
                <div className="space-y-4">
                  {needsApproval ? (
                    <Button
                      type="submit"
                      className="w-full bg-amber-500 hover:bg-amber-600"
                      disabled={
                        isApproving ||
                        !isConnected ||
                        transactionStatus === "pending"
                      }
                    >
                      {isApproving && !wasCancelled && !tokenWasCancelled ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Approving Tokens...
                        </>
                      ) : (
                        <>Approve {queryCost} MIPPY</>
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={
                        isGenerating ||
                        !isConnected ||
                        transactionStatus === "pending"
                      }
                    >
                      {isGenerating && !wasCancelled && !tokenWasCancelled ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isQueryLoading && !wasCancelled
                            ? "Processing Payment..."
                            : "Generating Joke..."}
                        </>
                      ) : approvalSuccess ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Generate Joke
                        </>
                      ) : (
                        "Generate Joke"
                      )}
                    </Button>
                  )}

                  {needsApproval && (
                    <div className="text-xs text-muted-foreground text-center">
                      You need to approve spending MIPPY tokens first, then
                      generate the joke
                    </div>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <JokeDisplay
          joke={joke}
          isLoading={isGenerating && !wasCancelled && !tokenWasCancelled}
        />
      </div>
    </div>
  );
}
