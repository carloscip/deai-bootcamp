"use client";

import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  // Handle hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything during SSR
  if (!mounted) return null;

  // If wallet is not connected, show login screen
  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md p-8 space-y-8 rounded-xl shadow-lg bg-card">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Please connect your wallet to access the AI Joke Generator
            </p>
          </div>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  // If connected, show the app content
  return <>{children}</>;
}
