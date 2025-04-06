"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDepositManager } from "@/hooks/use-deposit-manager";
import { useMippyToken } from "@/hooks/use-mippy-token";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  ArrowRight,
  AlertTriangle,
  HelpCircle,
  Info,
  CheckCircle2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface DepositMippyProps {
  onSuccess?: () => void;
}

export function DepositMippy({ onSuccess }: DepositMippyProps) {
  const { address, isConnected } = useAccount();
  const { balance, formatDisplayBalance, refetchBalance } = useMippyToken();
  const {
    depositEth,
    isLoading,
    isSuccess,
    wasCancelled,
    updateTokenEstimate,
    estimatedTokens,
    conversionRate,
    txHash,
  } = useDepositManager();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [depositedAmount, setDepositedAmount] = useState<string | null>(null);

  // Call onSuccess and show notification when deposit is confirmed
  useEffect(() => {
    if (isSuccess && depositedAmount) {
      // Refetch the balance to update navbar
      refetchBalance();

      // Show success toast with Sonner
      toast.success(`Deposit successful!`, {
        description: `You've received approximately ${estimatedTokens} MIPPY tokens.`,
        duration: 5000,
        action: {
          label: "View Transaction",
          onClick: () => {
            if (txHash) {
              window.open(
                `https://sepolia.etherscan.io/tx/${txHash}`,
                "_blank"
              );
            }
          },
        },
      });

      // Show transaction status in the UI
      setTimeout(() => {
        // Reset deposit amount
        setDepositedAmount(null);
        // Call the onSuccess callback if provided
        if (onSuccess) onSuccess();
      }, 5000);
    }
  }, [
    isSuccess,
    onSuccess,
    estimatedTokens,
    refetchBalance,
    txHash,
    depositedAmount,
  ]);

  // Initialize token estimate on component mount if we have a conversion rate
  useEffect(() => {
    console.log("Current conversion rate:", conversionRate);

    // Only update if we have a valid amount and conversion rate has changed
    if (amount && parseFloat(amount) > 0) {
      // Use a timeout to break potential update cycles
      const timeoutId = setTimeout(() => {
        updateTokenEstimate(parseFloat(amount));
      }, 100);

      // Cleanup to prevent memory leaks
      return () => clearTimeout(timeoutId);
    }
  }, [conversionRate, updateTokenEstimate]);

  // Handle amount changes separately
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      updateTokenEstimate(parseFloat(amount));
    }
  }, [amount, updateTokenEstimate]);

  // Handle amount changes
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    setAmount(newAmount);

    // Clear previous errors
    setError(null);

    // Update token estimate
    if (newAmount && !isNaN(parseFloat(newAmount))) {
      updateTokenEstimate(parseFloat(newAmount));
    } else {
      updateTokenEstimate(0);
    }
  };

  const handleDeposit = () => {
    setError(null);

    const ethAmount = parseFloat(amount);
    if (isNaN(ethAmount) || ethAmount <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    if (ethAmount < 0.01) {
      setError("Minimum deposit amount is 0.01 ETH");
      return;
    }

    try {
      // Store the amount being deposited for success message
      setDepositedAmount(amount);
      depositEth(ethAmount);
    } catch (err) {
      console.error("Failed to deposit ETH:", err);
      setError("Transaction failed. Please try again.");
    }
  };

  return (
    <Card className="w-full shadow-none border-0">
      <CardContent>
        {isConnected ? (
          <>
            <div className="mb-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Your Mippy Balance</p>
              <p className="text-xl font-bold">
                {formatDisplayBalance(balance)} MIPPY
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Current rate: 1 ETH ={" "}
                {conversionRate ? conversionRate.toFixed(2) : "1787.31"} MIPPY
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 rounded-md flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {isSuccess && (
              <div className="mb-4 p-3 bg-green-100 rounded-md flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Deposit successful!
                  </p>
                  <p className="text-xs text-green-700">
                    You've received approximately {estimatedTokens} MIPPY
                    tokens.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="amount">ETH Amount</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[200px] text-xs">
                          Deposit Sepolia ETH to receive MIPPY tokens. We
                          recommend using at least 0.01 ETH to ensure the
                          transaction has enough gas and value.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="amount"
                  placeholder="0.05"
                  value={amount}
                  onChange={handleAmountChange}
                  type="number"
                  step="0.01"
                  min="0.01"
                />
                <p className="text-xs text-muted-foreground">
                  Recommended minimum: 0.01 ETH
                </p>
              </div>

              {/* Token estimate display */}
              {parseFloat(amount) > 0 && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div className="text-sm">
                    <p className="font-medium">
                      You will receive approximately:
                    </p>
                  </div>
                  <div className="flex items-center">
                    <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
                    <p className="font-bold">{estimatedTokens} MIPPY</p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <p className="text-center text-muted-foreground">
              Connect your wallet to deposit ETH and receive Mippy tokens.
            </p>
          </div>
        )}

        {isConnected ? (
          <Button
            onClick={handleDeposit}
            disabled={isLoading || !amount || parseFloat(amount) <= 0}
            className="w-full mt-4"
          >
            {isLoading ? "Processing..." : "Deposit ETH"}
          </Button>
        ) : (
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <Button onClick={openConnectModal} className="w-full mt-4">
                Connect Wallet
              </Button>
            )}
          </ConnectButton.Custom>
        )}

        <p className="text-xs text-muted-foreground mt-2 text-center">
          Deposits may take a moment to process on the Sepolia testnet
        </p>
      </CardContent>
    </Card>
  );
}
