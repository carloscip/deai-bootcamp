"use client";

import { useState, useEffect, useRef } from "react";
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
import { useAccount, usePublicClient } from "wagmi";
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
    approveAIQueryContract,
    isMippyConfirmed,
    refetchAllowance,
    isLoading: isQueryLoading,
    isApproving,
    wasCancelled,
    isConfirmed: queryConfirmed,
    setRequiredCost,
    resetHookState,
    currentRequiredCost,
    txHash,
    forceCheckAllowance,
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
      temperature: 0.6,
      modelId: DEFAULT_MODEL_ID,
    },
  });

  // Keep track of contract query lifecycle
  const [contractQueryInProgress, setContractQueryInProgress] = useState(false);
  const [queryCost, setQueryCost] = useState(3);

  // Add refs to track state and prevent loops
  const processingQueryRef = useRef(false);
  const lastTransactionStatusRef = useRef<string>("idle");
  const updatingRef = useRef(false);

  // Add state for transaction status
  const [transactionStatus, setTransactionStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");

  // Calculate initial cost on component mount
  useEffect(() => {
    const calculateInitialCost = async () => {
      try {
        const formValues = form.getValues();
        const cost = await calculateQueryCost(formValues);
        console.log(`Initial calculated query cost: ${cost} MIPPY tokens`);
        setQueryCost(cost);
        setRequiredCost(cost);
      } catch (error) {
        console.error("Error calculating initial cost:", error);
      }
    };

    calculateInitialCost();
  }, [form, setRequiredCost]);

  // Check after form changes
  useEffect(() => {
    const subscription = form.watch(async (value) => {
      if (value.type || value.temperature) {
        try {
          const formValues = form.getValues();
          const cost = await calculateQueryCost(formValues);
          console.log(`Calculated query cost: ${cost} MIPPY tokens`);
          setQueryCost(cost);
          setRequiredCost(cost);
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
  }, [form, setRequiredCost]);

  // Process query once contract call is successful
  useEffect(() => {
    // Prevent executing this effect multiple times for the same state
    if (processingQueryRef.current) return;

    const processQuery = async () => {
      if (contractQueryInProgress && queryConfirmed) {
        console.log("[JokeGenerator] Query confirmed, calling API now");

        // Set ref to prevent concurrent processing
        processingQueryRef.current = true;

        // Set UI states
        setContractQueryInProgress(false);
        updateTransactionStatus("success");

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
          console.error("[JokeGenerator] Failed to generate joke:", error);
          toast({
            title: "Error",
            description:
              "An error occurred while generating the joke. Please try again.",
            variant: "destructive",
          });
        } finally {
          // Reset all states after successful completion
          console.log("[JokeGenerator] Resetting states after API call");
          setIsGenerating(false);

          // Properly reset hook state first
          resetHookState();

          // Force an immediate allowance check to update the button state
          refetchAllowance();

          // Wait a bit before allowing new queries to ensure proper state refresh
          setTimeout(() => {
            // Update transaction status last
            updateTransactionStatus("idle");

            // Run one final allowance check to ensure button state is correct
            refetchAllowance();

            // Finally allow new queries
            processingQueryRef.current = false;
            console.log("[JokeGenerator] Ready for new queries");
          }, 500);
        }
      }
    };

    // Only run when needed and avoid duplicate processing
    if (
      contractQueryInProgress &&
      queryConfirmed &&
      !processingQueryRef.current
    ) {
      console.log("[JokeGenerator] Starting query processing");
      processQuery();
    }
  }, [
    queryConfirmed,
    contractQueryInProgress,
    form,
    resetHookState,
    refetchAllowance,
  ]);

  // Add effect to ensure transaction status is updated when token approval state changes
  useEffect(() => {
    // Skip if we're in the middle of processing
    if (processingQueryRef.current || updatingRef.current) return;

    // If transaction was confirmed but UI wasn't updated, fix it
    if (queryConfirmed && transactionStatus === "pending") {
      console.log(
        "[JokeGenerator] Fixing transaction status after confirmation"
      );

      // Update UI state
      updateTransactionStatus("success");

      // Always reset loading states after confirmation
      setIsGenerating(false);

      // Force an allowance check to ensure button state is correct
      refetchAllowance();

      // Schedule a transition to idle state
      const timeoutId = setTimeout(() => {
        // Get the current transaction status when timeout executes
        if (lastTransactionStatusRef.current === "success") {
          updateTransactionStatus("idle");
          // Check allowance again after transition
          refetchAllowance();
        }
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [queryConfirmed, transactionStatus, refetchAllowance]);

  // Add effect to handle isMippyConfirmed changes and update UI accordingly
  useEffect(() => {
    // Log for debugging
    console.log(
      `[JokeGenerator] MIPPY approval status: ${
        isMippyConfirmed ? "Approved" : "Not approved"
      }`
    );

    // If we just finished a transaction and need to update the button state
    if (queryConfirmed && transactionStatus === "success") {
      // Simply update the transaction status to idle after a delay
      const timeoutId = setTimeout(() => {
        if (transactionStatus === "success") {
          updateTransactionStatus("idle");
        }
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [isMippyConfirmed, queryConfirmed, transactionStatus]);

  // Add effect to handle cancellations in approval or query process
  useEffect(() => {
    // Skip if we're already updating
    if (updatingRef.current) return;

    if (
      (wasCancelled || tokenWasCancelled) &&
      transactionStatus === "pending"
    ) {
      // Prevent concurrent updates
      updatingRef.current = true;

      console.log(
        "[JokeGenerator] Transaction cancelled by user, resetting state"
      );

      // Just reset UI states without showing error
      setIsGenerating(false);
      setContractQueryInProgress(false);

      // Use idle state instead of error for user cancellations
      updateTransactionStatus("idle");

      // No need for error toast on user cancellation
      // Instead show a neutral notification
      toast({
        title: "Transaction Cancelled",
        description: "You cancelled the transaction in your wallet.",
      });

      // Force an allowance check to ensure button state is correct
      refetchAllowance();

      // Allow updates again after a delay
      setTimeout(() => {
        updatingRef.current = false;
      }, 100);
    }
  }, [wasCancelled, tokenWasCancelled, transactionStatus, refetchAllowance]);

  // Simple wrapper to update transaction status safely
  const updateTransactionStatus = (
    status: "idle" | "pending" | "success" | "error"
  ) => {
    if (lastTransactionStatusRef.current !== status) {
      console.log(
        `[JokeGenerator] Updating transaction status: ${lastTransactionStatusRef.current} -> ${status}`
      );
      lastTransactionStatusRef.current = status;
      setTransactionStatus(status);
    }
  };

  // Handle approval with safe state updates
  const handleApproval = async () => {
    // Skip if already processing
    if (processingQueryRef.current || updatingRef.current) {
      console.log("[JokeGenerator] Already processing, skipping approval");
      return;
    }

    // Set processing flag and update UI immediately
    updatingRef.current = true;
    updateTransactionStatus("pending");
    setIsGenerating(true); // This will force the button to show loading state

    try {
      if (!isConnected) {
        toast({
          title: "Not Connected",
          description: "Please connect your wallet to generate jokes.",
          variant: "destructive",
        });
        updatingRef.current = false;
        setIsGenerating(false);
        updateTransactionStatus("idle");
        return;
      }

      // Calculate cost based on parameters
      const formValues = form.getValues();
      const cost = await calculateQueryCost(formValues);
      console.log(`[JokeGenerator] Approval needed for ${cost} MIPPY tokens`);

      // Check if user has enough tokens
      if (balance < formatWithDecimals(cost)) {
        toast({
          title: "Insufficient Balance",
          description:
            "You don't have enough Mippy tokens. Click the wallet icon in the navbar to deposit ETH and get more tokens.",
          variant: "destructive",
        });
        updatingRef.current = false;
        setIsGenerating(false);
        updateTransactionStatus("idle");
        return;
      }

      // Trigger approval - no state updates during this
      const success = await approveAIQueryContract(cost);

      if (!success) {
        updateTransactionStatus("error");
        setIsGenerating(false);
        toast({
          title: "Approval Failed",
          description: "Failed to approve tokens. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[JokeGenerator] Failed to approve tokens:", error);
      toast({
        title: "Approval Error",
        description: "Failed to approve tokens. Please try again.",
        variant: "destructive",
      });
      updateTransactionStatus("error");
      setIsGenerating(false);
    } finally {
      // Always clear processing flag but don't reset loading state here
      // (that happens after transaction confirms or fails)
      updatingRef.current = false;
    }
  };

  // Handle joke generation after approval with safe updates
  const handleGenerateJoke = async () => {
    // Skip if already processing
    if (processingQueryRef.current || updatingRef.current) {
      console.log("[JokeGenerator] Already processing, skipping generation");
      return;
    }

    // Set processing flag
    updatingRef.current = true;

    try {
      if (!isConnected) {
        toast({
          title: "Not Connected",
          description: "Please connect your wallet to generate jokes.",
          variant: "destructive",
        });
        updatingRef.current = false;
        return;
      }

      if (!isMippyConfirmed) {
        toast({
          title: "Approval Required",
          description: "Please approve MIPPY tokens first.",
          variant: "destructive",
        });
        updatingRef.current = false;
        return;
      }

      setIsGenerating(true);
      updateTransactionStatus("idle");

      // Prepare prompt from form values
      const formValues = form.getValues();
      const prompt = `Generate a ${formValues.type} ${formValues.tone} joke about ${formValues.topic}`;
      console.log(
        `[JokeGenerator] Prepared prompt: "${prompt}" (Will be used after blockchain transaction)`
      );

      // Call the smart contract with the queryCost, not the prompt
      setContractQueryInProgress(true);
      updateTransactionStatus("pending");
      const success = await queryAI(queryCost.toString());

      if (!success) {
        updateTransactionStatus("error");
        setIsGenerating(false);
        setContractQueryInProgress(false);
        toast({
          title: "Transaction Failed",
          description: "Failed to send query to the blockchain.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[JokeGenerator] Failed to generate joke:", error);
      toast({
        title: "Transaction Error",
        description: "Failed to send query. Please try again.",
        variant: "destructive",
      });
      updateTransactionStatus("error");
      setIsGenerating(false);
      setContractQueryInProgress(false);
    } finally {
      // Always clear processing flag
      updatingRef.current = false;
    }
  };

  const onSubmit = async (data: JokeFormValues) => {
    // Skip if already processing
    if (processingQueryRef.current || updatingRef.current) {
      console.log("[JokeGenerator] Already processing, skipping submission");
      return;
    }

    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect your wallet to generate jokes.",
        variant: "destructive",
      });
      return;
    }

    // Force direct allowance check before proceeding
    const hasAllowance = await forceCheckAllowance();
    console.log(
      `[JokeGenerator] Direct allowance check before submission: ${hasAllowance}`
    );

    // Small delay to ensure allowance data is refreshed
    setTimeout(() => {
      // Call the appropriate handler
      if (!hasAllowance) {
        handleApproval();
      } else {
        handleGenerateJoke();
      }
    }, 300);
  };

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      console.log("[JokeGenerator] Component unmounting, cleaning up");
      // Reset all refs to prevent lingering effects
      processingQueryRef.current = false;
      updatingRef.current = false;

      // Reset all states
      setIsGenerating(false);
      setContractQueryInProgress(false);
      updateTransactionStatus("idle");
      resetHookState();
    };
  }, [resetHookState]);

  // Update the button text and state based on transaction status and approval state
  const getButtonState = () => {
    // First check if we're in any kind of loading/processing state
    if (
      isGenerating ||
      isQueryLoading ||
      isApproving ||
      transactionStatus === "pending" ||
      updatingRef.current ||
      processingQueryRef.current
    ) {
      return {
        text: isApproving
          ? "Approving..."
          : isGenerating
          ? "Waiting for confirmation..."
          : "Processing...",
        icon: <Loader2 className="w-4 h-4 mr-2 animate-spin" />,
        disabled: true,
      };
    }

    // If we're in a success state, show that
    if (transactionStatus === "success") {
      return {
        text: "Transaction Confirmed",
        icon: <Check className="w-4 h-4 mr-2" />,
        disabled: true,
      };
    }

    // Next check approval status
    if (!isMippyConfirmed) {
      return {
        text: `Approve ${queryCost} MIPPY`,
        icon: null,
        disabled: false,
      };
    }

    // Default state: approved and ready to generate
    return {
      text: "Generate Joke",
      icon: <Check className="w-4 h-4 mr-2" />,
      disabled: false,
    };
  };

  // Add a new effect to check allowance after any relevant state changes
  useEffect(() => {
    // Skip if we're in the middle of processing something
    if (processingQueryRef.current || updatingRef.current) return;

    // If we're no longer in a loading state, recheck our allowance
    if (
      !isGenerating &&
      !isQueryLoading &&
      !isApproving &&
      transactionStatus === "idle"
    ) {
      console.log("[JokeGenerator] Idle state detected, checking allowance");
      refetchAllowance();
    }
  }, [
    isGenerating,
    isQueryLoading,
    isApproving,
    transactionStatus,
    refetchAllowance,
  ]);

  // Add effect to directly monitor transaction hash confirmation
  useEffect(() => {
    // Skip if no transaction hash or already processing
    if (!queryConfirmed || !transactionStatus) return;

    console.log(
      "[JokeGenerator] Transaction confirmation detected, forcing UI update"
    );

    // Delay slightly to ensure all blockchain state is updated
    setTimeout(() => {
      // Force update UI regardless of previous state
      if (transactionStatus === "pending") {
        // Update transaction status
        console.log("[JokeGenerator] Forcing pending → success transition");
        updateTransactionStatus("success");

        // Reset loading state
        setIsGenerating(false);

        // Force allowance check
        refetchAllowance();

        // Schedule transition to idle
        setTimeout(() => {
          updateTransactionStatus("idle");
          // One final allowance check
          refetchAllowance();
        }, 2000);
      }
    }, 100);
  }, [queryConfirmed]); // Only depend on confirmation status

  // Add a backup mechanism to check allowance whenever transaction status changes
  useEffect(() => {
    // Wait a moment to ensure all blockchain states are updated
    const timeoutId = setTimeout(() => {
      console.log(
        `[JokeGenerator] Transaction status changed to: ${transactionStatus}, checking allowance`
      );
      refetchAllowance();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [transactionStatus, refetchAllowance]);

  // Add a last-resort transaction reset effect
  useEffect(() => {
    // This effect handles any changes in query confirmation status
    if (!queryConfirmed && (isGenerating || transactionStatus === "pending")) {
      console.log(
        "[JokeGenerator] Transaction completed or failed, ensuring UI is updated"
      );

      // Force UI reset after a delay to ensure all state has settled
      const timeoutId = setTimeout(() => {
        // Reset all UI states
        setIsGenerating(false);
        updateTransactionStatus("idle");

        // Force allowance check to ensure button shows correct state
        refetchAllowance();

        console.log(
          "[JokeGenerator] UI forcibly reset after transaction outcome"
        );
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [queryConfirmed, isGenerating, transactionStatus, refetchAllowance]);

  // Add a periodic allowance checker while in loading state
  useEffect(() => {
    // If in a loading state, periodically check allowance
    if (isGenerating || transactionStatus === "pending") {
      console.log(
        "[JokeGenerator] In loading state, setting up periodic allowance check"
      );

      // Check allowance every 3 seconds while in loading state
      const intervalId = setInterval(() => {
        console.log("[JokeGenerator] Periodic allowance check while loading");
        refetchAllowance();
      }, 3000);

      return () => {
        clearInterval(intervalId);
        console.log("[JokeGenerator] Cleared periodic allowance check");
      };
    }
  }, [isGenerating, transactionStatus, refetchAllowance]);

  // Add direct isConfirmed monitoring
  useEffect(() => {
    // Skip if already processing
    if (processingQueryRef.current) return;

    // When query is confirmed, immediately update UI regardless of previous state
    if (queryConfirmed) {
      console.log(
        "[JokeGenerator] DIRECT CONFIRMATION DETECTED - Force updating UI"
      );

      // Force update UI to "success" state
      updateTransactionStatus("success");

      // Reset loading states
      setIsGenerating(false);

      // Check allowance
      refetchAllowance();

      // If this was a contract query, process it
      if (contractQueryInProgress) {
        // This will trigger the processQuery function
        console.log(
          "[JokeGenerator] Contract query was in progress, triggering processing"
        );
      } else {
        // If just an approval, schedule a transition to idle after a delay
        setTimeout(() => {
          updateTransactionStatus("idle");
          refetchAllowance(); // Final allowance check
        }, 2000);
      }
    }
  }, [queryConfirmed, contractQueryInProgress, refetchAllowance]);

  // Use an interval to check for stuck UI states
  useEffect(() => {
    // If we're in a pending state for more than 15 seconds, force a reset
    if (transactionStatus === "pending") {
      console.log(
        "[JokeGenerator] Setting up safety timeout for pending transaction"
      );

      const timeoutId = setTimeout(() => {
        console.log(
          "[JokeGenerator] 🔴 Transaction appears stuck in pending state, forcing reset"
        );
        setIsGenerating(false);
        updateTransactionStatus("idle");
        refetchAllowance();
      }, 15000); // 15 second timeout

      return () => clearTimeout(timeoutId);
    }
  }, [transactionStatus, refetchAllowance]);

  // Add robust direct transaction monitoring
  useEffect(() => {
    // Skip if no transaction hash or already processing
    if (!txHash || processingQueryRef.current) return;

    const publicClient = usePublicClient();

    // Create function to check transaction receipt directly
    const checkTransactionStatus = async () => {
      if (!publicClient) {
        console.log(
          "[JokeGenerator] No provider available for direct transaction check"
        );
        return;
      }

      try {
        const receipt = await publicClient.getTransactionReceipt({
          hash: txHash as `0x${string}`,
        });

        // If transaction is confirmed
        if (receipt && receipt.status === "success") {
          console.log(
            `[JokeGenerator] 🔍 Transaction ${txHash} confirmed directly!`
          );

          // Directly check allowance without relying on state
          const hasAllowance = await forceCheckAllowance();
          console.log(
            `[JokeGenerator] Direct allowance check result: ${hasAllowance}`
          );

          // Update transaction status to success
          updateTransactionStatus("success");

          // Reset loading state
          setIsGenerating(false);

          // Force allowance check
          refetchAllowance();

          // Add slight delay before resetting transaction status
          setTimeout(() => {
            // Update transaction status to idle
            updateTransactionStatus("idle");
            // Final allowance check
            refetchAllowance();
          }, 2000);

          return true;
        }
        return false;
      } catch (error) {
        console.error("[JokeGenerator] Error checking transaction:", error);
        return false;
      }
    };

    // Check transaction status immediately
    checkTransactionStatus();

    // Check transaction status every 3 seconds
    const intervalId = setInterval(async () => {
      const confirmed = await checkTransactionStatus();
      if (confirmed) {
        clearInterval(intervalId);
      }
    }, 3000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [txHash, forceCheckAllowance, refetchAllowance]);

  // Create component for the approval alert
  const ApprovalAlert = () => {
    if (!isMippyConfirmed && isConnected) {
      return (
        <div className="mb-6 p-4 border border-yellow-200 bg-yellow-50 rounded-md">
          <h3 className="text-yellow-800 font-medium flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4" />
            Token Approval Required
          </h3>
          <p className="text-yellow-700 text-sm mb-3">
            Before generating jokes, you need to approve the AI Query Contract
            to use your Mippy tokens. This is a one-time approval that allows
            the contract to deduct tokens for your joke requests.
          </p>
          <p className="text-yellow-700 text-sm">
            Current cost for this joke: <strong>{queryCost} MIPPY</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  // Continuous allowance checker to ensure UI stays in sync with blockchain
  useEffect(() => {
    if (!isConnected) return;

    console.log("[JokeGenerator] Setting up continuous allowance checker");

    // Check allowance every 5 seconds while the component is mounted
    const intervalId = setInterval(async () => {
      // Skip if we're in the middle of a transaction
      if (isGenerating || transactionStatus !== "idle") return;

      // Do a direct blockchain check
      await forceCheckAllowance();
    }, 5000);

    // Clean up
    return () => {
      clearInterval(intervalId);
      console.log("[JokeGenerator] Cleaned up continuous allowance checker");
    };
  }, [isConnected, isGenerating, transactionStatus, forceCheckAllowance]);

  return (
    <div className="space-y-6">
      {/* Transaction Status */}
      {transactionStatus !== "idle" && (
        <TransactionStatus status={transactionStatus} className="mb-6" />
      )}

      <ApprovalAlert />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            <SelectValue placeholder="Select topic" />
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
                        What should the joke be about?
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
                            <SelectValue placeholder="Select tone" />
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
                        How should the joke feel?
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
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
                        What kind of joke do you want?
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Creativity: {field.value.toFixed(1)}</FormLabel>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        min={0.1}
                        max={1}
                        step={0.1}
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                    </FormControl>
                    <FormDescription>
                      Higher values = more creative but less predictable
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AI Model</FormLabel>
                    <ModelSelector
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormItem>
                )}
              />

              <div className="flex justify-between items-center pt-2">
                <div className="text-sm text-muted-foreground">
                  Cost: {queryCost} MIPPY tokens
                </div>
                <div>
                  <Button
                    type="submit"
                    disabled={getButtonState().disabled}
                    variant={!isMippyConfirmed ? "secondary" : "default"}
                    className={`relative ${
                      !isMippyConfirmed
                        ? "bg-amber-500 hover:bg-amber-600 text-white"
                        : ""
                    }`}
                  >
                    {getButtonState().icon}
                    {getButtonState().text}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      {joke && <JokeDisplay joke={joke} className="mt-8" />}
    </div>
  );
}
