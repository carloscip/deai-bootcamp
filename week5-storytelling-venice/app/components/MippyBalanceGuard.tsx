"use client";

import { useEffect, useState } from "react";
import { useMippyToken } from "@/hooks/use-mippy-token";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Coins } from "lucide-react";
import Link from "next/link";

interface MippyBalanceGuardProps {
  children: React.ReactNode;
}

export function MippyBalanceGuard({ children }: MippyBalanceGuardProps) {
  const { balance, formatDisplayBalance } = useMippyToken();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Handle hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything during SSR
  if (!mounted) return null;

  // Check if user has any Mippy tokens
  const hasTokens = balance > BigInt(0);

  // If no tokens, show redirect to get some
  if (!hasTokens) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              No Mippy Tokens
            </CardTitle>
            <CardDescription>
              You need Mippy tokens to generate jokes with our AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Before you can generate jokes, you need to have some Mippy tokens
              in your wallet. Head over to the home page to deposit ETH and
              receive Mippy tokens.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/" passHref>
              <Button>Get Mippy Tokens</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If user has tokens, show the joke generator
  return <>{children}</>;
}
