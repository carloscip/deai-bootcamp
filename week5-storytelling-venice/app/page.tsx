"use client"; // Required for ConnectButton

import { JokeGenerator } from "@/components/joke-generator";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AuthGuard } from "./components/AuthGuard";

export default function Home() {
  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen">
        {/* Navbar */}
        <header className="border-b bg-background sticky top-0">
          <div className="container mx-auto py-4 px-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">AI Joke Generator</h2>
              <ConnectButton />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 container mx-auto py-10 px-4">
          <h1 className="text-4xl font-bold text-center mb-8">
            VENICE AI Joke Generator
          </h1>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
            Customize your joke parameters and let AI create a personalized joke
            just for you. Our AI will also evaluate the joke's humor,
            appropriateness, and more!
          </p>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
            Your joke is, and will always be private! This is because the app
            uses Venice AI
          </p>
          <JokeGenerator />
        </main>
      </div>
    </AuthGuard>
  );
}
