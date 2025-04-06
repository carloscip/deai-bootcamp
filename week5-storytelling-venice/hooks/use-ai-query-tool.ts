"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseEther, parseUnits } from "viem"
import { toast } from "./use-toast"
import { CONTRACTS } from "@/config/contracts"
import { useMippyToken } from "./use-mippy-token"

export function useAIModelQueryTool() {
  const { address } = useAccount()
  const { approveTokens, tokenDecimals, formatWithDecimals } = useMippyToken()
  const [isLoading, setIsLoading] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isMippyConfirmed, setIsMippyConfirmed] = useState(false)
  const [currentRequiredCost, setCurrentRequiredCost] = useState<number>(0)
  const [lastProcessedTx, setLastProcessedTx] = useState<string | null>(null)
  const { writeContract, isPending, data: txHash, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash })
  const [contractData, setContractData] = useState<{abi: any[]} | null>(null)
  const [mippyTokenAbi, setMippyTokenAbi] = useState<any[] | null>(null)
  const [wasCancelled, setWasCancelled] = useState(false)
  
  // Refs to prevent infinite loops
  const isUpdatingRef = useRef(false);
  const processingTxRef = useRef<string | null>(null);
  const allowanceUpdatedRef = useRef(false);

  // Check MIPPY token allowance using the loaded ABI
  const { data: allowanceData, refetch: refetchAllowanceData } = useReadContract({
    address: CONTRACTS.MIPPY_TOKEN,
    abi: mippyTokenAbi || [],
    functionName: "allowance",
    args: address && CONTRACTS.AI_MODEL_QUERY ? [address, CONTRACTS.AI_MODEL_QUERY] : undefined,
    query: {
      enabled: !!address && !!mippyTokenAbi,
    },
  })

  // Load AIModelQueryTool contract data
  useEffect(() => {
    async function loadContractData() {
      try {
        const aiQueryArtifact = await import("@/public/artifacts/AIModelQueryTool.json")
        console.log("Loaded AI Query contract ABI:", aiQueryArtifact.default.abi)
        setContractData({
          abi: aiQueryArtifact.default.abi,
        })
      } catch (error) {
        console.error("Error loading AIModelQueryTool contract data:", error)
      }
    }
    
    loadContractData()
  }, [])

  // Load MippyToken contract data
  useEffect(() => {
    async function loadMippyTokenData() {
      try {
        const tokenArtifact = await import("@/public/artifacts/MippyToken.json")
        console.log("Loaded MIPPY token contract ABI for allowance check")
        setMippyTokenAbi(tokenArtifact.default.abi)
      } catch (error) {
        console.error("Error loading MippyToken contract data:", error)
      }
    }
    
    loadMippyTokenData()
  }, [])

  // Set the current required cost
  const setRequiredCost = useCallback((cost: number) => {
    if (cost !== currentRequiredCost) {
      setCurrentRequiredCost(cost);
    }
  }, [currentRequiredCost]);

  // Handle transaction errors (including user rejection)
  useEffect(() => {
    if (writeError) {
      const errorMessage = writeError.message || "Transaction failed"
      console.error("AI query error:", errorMessage)
      
      // Check for user rejection patterns
      if (errorMessage.includes("rejected") || 
          errorMessage.includes("denied") || 
          errorMessage.includes("cancelled") ||
          errorMessage.includes("canceled") ||
          errorMessage.includes("user denied")) {
        // For user cancellations, don't show error toast
        // Just update internal state
        console.log("User cancelled transaction");
        setWasCancelled(true);
        
        // Show neutral notification instead of error
        toast({
          title: "Transaction Cancelled",
          description: "You cancelled the transaction in your wallet.",
        });
      } else {
        // Only show error toast for actual errors, not user cancellations
        toast({
          title: "Transaction Error",
          description: `Transaction failed: ${errorMessage}`,
          variant: "destructive",
        });
      }
      
      // Reset states
      processingTxRef.current = null;
      isUpdatingRef.current = false;
      setIsLoading(false);
      setIsApproving(false);
      
      // Always check allowance after any transaction outcome
      setTimeout(() => {
        refetchAllowanceData();
      }, 100);
    }
  }, [writeError, refetchAllowanceData]);

  // Reset cancelled state when starting a new transaction
  useEffect(() => {
    if (isPending) {
      setWasCancelled(false)
    }
  }, [isPending])

  // Query AI model
  const queryAI = async (cost: number | string): Promise<boolean> => {
    if (!address) {
      toast({
        title: "Connection Error",
        description: "Please connect your wallet first.",
        variant: "destructive",
      })
      return false
    }
    
    if (!contractData?.abi) {
      console.error("Contract ABI not loaded yet");
      toast({
        title: "Application Error",
        description: "Contract data is not loaded yet. Please try again in a moment.",
        variant: "destructive",
      })
      return false
    }
    
    // Check if we're already processing a transaction
    if (processingTxRef.current || isUpdatingRef.current) {
      console.log("Already processing a transaction, skipping query");
      return false;
    }
    
    // Reset states before starting a new query
    setIsLoading(true)
    setWasCancelled(false)
    
    try {
      // Convert cost to BigInt with proper decimals
      let queryCostWithDecimals: bigint;
      
      if (formatWithDecimals) {
        queryCostWithDecimals = formatWithDecimals(Number(cost));
      } else {
        const decimalsFactor = 10 ** (tokenDecimals || 18);
        queryCostWithDecimals = BigInt(Math.floor(Number(cost) * decimalsFactor));
      }
      
      console.log(`Querying AI at contract ${CONTRACTS.AI_MODEL_QUERY} with cost: ${cost} MIPPY tokens (${queryCostWithDecimals} raw units)`)
      
      await writeContract({
        address: CONTRACTS.AI_MODEL_QUERY,
        abi: contractData.abi,
        functionName: "queryAI",
        args: [queryCostWithDecimals],
        gas: BigInt(300000),
      })
      
      console.log("AI query transaction initiated successfully")
      return true
    } catch (error) {
      console.error("Error querying AI:", error)
      setIsLoading(false)
      return false
    }
  }

  // Simple approval function that avoids state updates during the process
  const approveAIQueryContract = async (amount: number): Promise<boolean> => {
    if (!address) {
      toast({
        title: "Connection Error",
        description: "Please connect your wallet first.",
        variant: "destructive",
      })
      return false
    }
    
    // Set approving flag
    setIsApproving(true)
    allowanceUpdatedRef.current = false;
    
    try {
      // Just call the approval function and return its result
      // The approval process is handled in the useMippyToken hook
      const success = await approveTokens(CONTRACTS.AI_MODEL_QUERY, amount);
      
      if (success) {
        // Update the cost after approval
        if (amount !== currentRequiredCost) {
          setCurrentRequiredCost(amount);
        }
        return true;
      } else {
        setIsApproving(false);
        return false;
      }
    } catch (error) {
      console.error("Error approving tokens:", error);
      setIsApproving(false);
      return false;
    }
  }

  // Update MIPPY confirmation status when allowance changes or required cost changes
  useEffect(() => {
    // Skip if already updating
    if (isUpdatingRef.current) return;
    
    if (allowanceData !== undefined && tokenDecimals !== undefined) {
      try {
        isUpdatingRef.current = true;
        
        const rawAllowance = BigInt(allowanceData.toString());
        const rawRequiredCost = formatWithDecimals(currentRequiredCost);
        
        const hasEnoughAllowance = rawAllowance >= rawRequiredCost && currentRequiredCost > 0;
        
        if (isMippyConfirmed !== hasEnoughAllowance) {
          allowanceUpdatedRef.current = true;
          setIsMippyConfirmed(hasEnoughAllowance);
        }
      } catch (error) {
        console.error("Error checking allowance:", error);
      } finally {
        isUpdatingRef.current = false;
      }
    }
  }, [
    allowanceData, 
    currentRequiredCost, 
    tokenDecimals, 
    formatWithDecimals, 
    isMippyConfirmed
  ]);

  // Handle successful transactions in a minimal way
  useEffect(() => {
    if (isConfirmed && txHash) {
      const currentTxHash = txHash.toString();
      
      // Skip if already processed
      if (processingTxRef.current === currentTxHash) return;
      
      // Mark as being processed
      processingTxRef.current = currentTxHash;
      console.log("Transaction confirmed:", currentTxHash);
      
      // Add a slight delay to ensure state consistency
      setTimeout(() => {
        if (isApproving) {
          // For approvals, reset state and show toast
          setIsApproving(false);
          
          toast({
            title: "Approval Successful",
            description: "You can now generate jokes with MIPPY tokens.",
          });
          
          // Always refresh allowance data after approval
          console.log("Refreshing allowance after transaction completion");
          refetchAllowanceData();
        } 
        
        if (isLoading) {
          // For queries, reset loading and show toast
          setIsLoading(false);
          
          toast({
            title: "Success!",
            description: "Transaction confirmed.",
          });
          
          // Also recheck allowance after a successful query
          console.log("Rechecking allowance after successful query");
          refetchAllowanceData();
        }
        
        // Clear the processing reference after completion
        setTimeout(() => {
          processingTxRef.current = null;
        }, 300);
      }, 100);
    }
  }, [isConfirmed, txHash, isApproving, isLoading, refetchAllowanceData]);

  // Added for direct transaction monitoring
  useEffect(() => {
    // This effect runs whenever isConfirmed changes to true
    if (isConfirmed && txHash) {
      const currentTxHash = txHash.toString();
      console.log("Direct confirmation handler - transaction confirmed:", currentTxHash);
      
      // Always reset states regardless of what we think the current state is
      if (isApproving) {
        console.log("Approval confirmed, forcing state reset");
        // Immediately reset approval state
        setIsApproving(false);
        
        // Show toast once
        toast({
          title: "Approval Successful",
          description: "You can now generate jokes with MIPPY tokens.",
        });
      }
      
      if (isLoading) {
        console.log("Query confirmed, forcing loading state reset");
        setIsLoading(false);
      }
      
      // Force allowance refresh regardless of transaction type
      console.log("Forcing allowance check after confirmed transaction");
      
      // Clear any processing flags
      processingTxRef.current = null;
      
      // Do a series of allowance checks with increasing delays for reliability
      refetchAllowanceData();
      
      // Secondary check after a short delay
      setTimeout(() => {
        refetchAllowanceData();
      }, 250);
      
      // Third check after a longer delay
      setTimeout(() => {
        refetchAllowanceData();
      }, 1000);
    }
  }, [isConfirmed, txHash, refetchAllowanceData]);

  // Simple reset function with improved allowance checking
  const resetHookState = useCallback(() => {
    console.log("Resetting hook state and rechecking allowance");
    processingTxRef.current = null;
    allowanceUpdatedRef.current = false;
    isUpdatingRef.current = false;
    
    setIsLoading(false);
    setIsApproving(false);
    
    // Always recheck allowance when resetting state
    refetchAllowanceData();
  }, [refetchAllowanceData]);

  // Simple allowance refetch
  const refetchAllowance = useCallback(() => {
    if (!isUpdatingRef.current) {
      console.log("Manual allowance refetch");
      refetchAllowanceData();
    }
  }, [refetchAllowanceData]);

  // A computed property to determine if any loading is happening
  const isAnyLoading = isLoading || isPending || isConfirming;

  // Reset loading if user cancelled
  useEffect(() => {
    if (wasCancelled && (isLoading || isApproving)) {
      processingTxRef.current = null;
      setIsLoading(false);
      setIsApproving(false);
    }
  }, [wasCancelled, isLoading, isApproving]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      processingTxRef.current = null;
      allowanceUpdatedRef.current = false;
      isUpdatingRef.current = false;
    };
  }, []);

  return { 
    queryAI,
    approveAIQueryContract,
    isLoading: isAnyLoading,
    isApproving,
    isConfirmed,
    wasCancelled,
    isMippyConfirmed,
    contractAddress: CONTRACTS.AI_MODEL_QUERY,
    refetchAllowance,
    setRequiredCost,
    resetHookState,
    currentRequiredCost
  }
} 