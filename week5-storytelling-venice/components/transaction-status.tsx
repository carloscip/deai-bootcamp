"use client";

import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TransactionStatusProps {
  status: "pending" | "success" | "error" | "idle";
  title?: string;
  description?: string;
}

export function TransactionStatus({
  status,
  title,
  description,
}: TransactionStatusProps) {
  if (status === "idle") return null;

  const defaultMessages = {
    pending: {
      title: "Processing transaction",
      description: "Please wait while your transaction is being processed...",
    },
    success: {
      title: "Transaction successful",
      description: "Your transaction has been confirmed on the blockchain.",
    },
    error: {
      title: "Transaction failed",
      description:
        "There was an error processing your transaction. Please try again.",
    },
  };

  const displayTitle = title || defaultMessages[status].title;
  const displayDescription = description || defaultMessages[status].description;

  return (
    <Alert
      variant={status === "error" ? "destructive" : "default"}
      className="mt-4"
    >
      {status === "pending" && <Loader2 className="h-4 w-4 animate-spin" />}
      {status === "success" && (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      )}
      {status === "error" && <XCircle className="h-4 w-4" />}
      <AlertTitle>{displayTitle}</AlertTitle>
      <AlertDescription>{displayDescription}</AlertDescription>
    </Alert>
  );
}
