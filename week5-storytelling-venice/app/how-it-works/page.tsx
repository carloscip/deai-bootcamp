"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Wallet, Zap, Code, Key } from "lucide-react";
import { AuthGuard } from "../components/AuthGuard";
import { CONTRACTS } from "@/config/contracts";

export default function HowItWorksPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">How It Works</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Our blockchain-powered AI joke generator utilizes smart contracts to
            provide a secure and transparent experience.
          </p>

          <div className="grid gap-8 mb-12">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Wallet className="h-6 w-6" />
                  <CardTitle>Mippy Token System</CardTitle>
                </div>
                <CardDescription>Our token economy explained</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <h3 className="font-semibold text-lg">
                  Step 1: Connect Your Wallet
                </h3>
                <p className="text-muted-foreground">
                  Connect your Sepolia testnet wallet using the button in the
                  navigation bar. This allows you to interact with our smart
                  contracts.
                </p>

                <h3 className="font-semibold text-lg">
                  Step 2: Deposit ETH for Mippy Tokens
                </h3>
                <p className="text-muted-foreground">
                  Click on the Mippy balance button in the navigation bar to
                  deposit Sepolia ETH. Your ETH is converted to Mippy tokens at
                  a fixed rate.
                </p>

                <h3 className="font-semibold text-lg">
                  Step 3: Generate Jokes with Tokens
                </h3>
                <p className="text-muted-foreground">
                  Each joke generation costs Mippy tokens based on the
                  complexity of your request. More complex jokes (longer format,
                  higher creativity settings) cost more tokens.
                </p>

                <h3 className="font-semibold text-lg">
                  Smart Contract Integration
                </h3>
                <p className="text-muted-foreground">
                  When you generate a joke, you'll need to:
                </p>
                <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                  <li>
                    First approve the AIModelQueryTool contract to spend your
                    Mippy tokens
                  </li>
                  <li>
                    Then call the contract to deduct the tokens for your joke
                    request
                  </li>
                  <li>
                    Only after the blockchain transaction is confirmed will your
                    joke be generated
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Code className="h-6 w-6" />
                  <CardTitle>Smart Contracts</CardTitle>
                </div>
                <CardDescription>Our blockchain infrastructure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">DepositManager</h3>
                  <p className="text-sm text-muted-foreground">
                    Handles deposits of Sepolia ETH and mints Mippy tokens to
                    your wallet.
                  </p>
                  <code className="text-xs bg-muted p-2 rounded block">
                    {CONTRACTS.DEPOSIT_MANAGER}
                  </code>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">MippyToken</h3>
                  <p className="text-sm text-muted-foreground">
                    ERC20 token used for payments within our system.
                  </p>
                  <code className="text-xs bg-muted p-2 rounded block">
                    {CONTRACTS.MIPPY_TOKEN}
                  </code>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">AIModelQueryTool</h3>
                  <p className="text-sm text-muted-foreground">
                    Handles the token payments for AI model queries.
                  </p>
                  <code className="text-xs bg-muted p-2 rounded block">
                    {CONTRACTS.AI_MODEL_QUERY}
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
