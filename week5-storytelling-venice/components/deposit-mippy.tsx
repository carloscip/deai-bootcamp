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

interface DepositMippyProps {
  onSuccess?: () => void;
}

export function DepositMippy({ onSuccess }: DepositMippyProps) {
  const { address, isConnected } = useAccount();
  const { balance } = useMippyToken();
  const { depositEth, isLoading } = useDepositManager();
  const [amount, setAmount] = useState("");

  // Call onSuccess when deposit is confirmed
  const { isSuccess: isConfirmed } = useDepositManager();

  useEffect(() => {
    if (isConfirmed && onSuccess) {
      onSuccess();
    }
  }, [isConfirmed, onSuccess]);

  const handleDeposit = () => {
    const ethAmount = parseFloat(amount);
    if (isNaN(ethAmount) || ethAmount <= 0) return;
    depositEth(ethAmount);
  };

  return (
    <Card className="w-full shadow-none border-0">
      <CardContent>
        {isConnected ? (
          <>
            <div className="mb-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Your Mippy Balance</p>
              <p className="text-xl font-bold">{formatEther(balance)} MIPPY</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">ETH Amount</Label>
                <Input
                  id="amount"
                  placeholder="0.05"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  step="0.01"
                  min="0.01"
                />
              </div>
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
      </CardContent>
    </Card>
  );
}
