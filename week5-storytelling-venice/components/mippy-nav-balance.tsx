"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { Wallet } from "lucide-react";
import { useMippyToken } from "@/hooks/use-mippy-token";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DepositMippy } from "@/components/deposit-mippy";

export function MippyNavBalance() {
  const { isConnected } = useAccount();
  const { balance } = useMippyToken();
  const [open, setOpen] = useState(false);

  if (!isConnected) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Wallet className="h-4 w-4" />
          <span>{parseInt(formatEther(balance))} MIPPY</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Deposit ETH for Mippy Tokens</DialogTitle>
          <DialogDescription>
            Get Mippy tokens to use for querying the AI joke generator
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <DepositMippy onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
