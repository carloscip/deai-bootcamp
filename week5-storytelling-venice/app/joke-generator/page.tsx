"use client";

import { JokeGenerator } from "@/components/joke-generator";
import { AuthGuard } from "../components/AuthGuard";
import { MippyBalanceGuard } from "../components/MippyBalanceGuard";

export default function JokeGeneratorPage() {
  return (
    <AuthGuard>
      <MippyBalanceGuard>
        <div className="container mx-auto py-10 px-4">
          <h1 className="text-4xl font-bold mb-2">Generate Joke</h1>

          <JokeGenerator />
        </div>
      </MippyBalanceGuard>
    </AuthGuard>
  );
}
