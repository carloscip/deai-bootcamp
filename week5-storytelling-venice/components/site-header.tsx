"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { MippyNavBalance } from "@/components/mippy-nav-balance";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Info } from "lucide-react";

export function SiteHeader() {
  return (
    // <header className="border-b bg-background sticky top-0">
    //   <div className="container mx-auto py-4 px-4">
    //     <div className="flex justify-between items-center">
    //       <h2 className="text-xl font-bold">AI Joke Generator</h2>
    //       <ConnectButton />
    //     </div>
    //   </div>
    // </header>
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-xl">
            AI Joke Generator
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Home
            </Link>
            <Link
              href="/joke-generator"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Generate Jokes
            </Link>
            <Link
              href="/how-it-works"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              How It Works
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <MippyNavBalance />
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
