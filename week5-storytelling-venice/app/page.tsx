"use client"; // Required for ConnectButton

import { JokeGenerator } from "@/components/joke-generator";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AuthGuard } from "./components/AuthGuard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DepositMippy } from "@/components/deposit-mippy";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen">
        {/* Main Content */}
        <main className="flex-1 container mx-auto py-10 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-center mb-8">
              VENICE AI Joke Generator
            </h1>
            <p className="text-center text-muted-foreground mb-6 max-w-2xl mx-auto">
              Customize your joke parameters and let AI create a personalized
              joke just for you. Our AI will also evaluate the joke's humor,
              appropriateness, and more!
            </p>
            <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
              Your joke is, and will always be private! This is because the app
              uses Venice AI
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <Card>
                <CardHeader>
                  <CardTitle>Generate Jokes</CardTitle>
                  <CardDescription>
                    Create AI-generated jokes customized to your preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-2">
                    Choose from multiple joke styles and topics
                  </p>
                  <p className="text-muted-foreground mb-2">
                    AI evaluates humor, appropriateness & originality
                  </p>
                  <p className="text-muted-foreground">
                    Get detailed joke evaluations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Blockchain-Powered AI</CardTitle>
                  <CardDescription>
                    Secured by smart contracts on Sepolia
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Private & Secure</h3>
                    <p className="text-sm text-muted-foreground">
                      Your jokes are never stored or shared
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Venice AI Integration</h3>
                    <p className="text-sm text-muted-foreground">
                      Powered by advanced AI models for creative results
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Token Economy</h3>
                    <p className="text-sm text-muted-foreground">
                      Pay-per-use model with transparent pricing
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Button asChild className="w-full">
              <Link href="/joke-generator">Start Generating</Link>
            </Button>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
