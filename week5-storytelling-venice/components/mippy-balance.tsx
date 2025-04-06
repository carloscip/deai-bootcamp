"use client";

import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { useMippyToken } from "@/hooks/use-mippy-token";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function MippyBalance() {
  const { isConnected } = useAccount();
  const { balance } = useMippyToken();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-base font-medium">
          <Wallet className="mr-2 h-4 w-4" />
          Mippy Token Balance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div>
            <div className="text-2xl font-bold">
              {formatEther(balance)} MIPPY
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tokens are used for AI queries. 1 MIPPY ≈ 0.01 Sepolia ETH
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your wallet to see your balance
            </p>
            <ConnectButton />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
