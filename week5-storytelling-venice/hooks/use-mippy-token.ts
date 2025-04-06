"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseEther, parseUnits } from "viem"
import { toast } from "./use-toast"
import { CONTRACTS } from "@/config/contracts"

// Utility function outside the hook to avoid re-renders
function formatTokensWithDecimals(amount: number, decimals: number = 18): bigint {
  if (isNaN(amount) || amount < 0) return BigInt(0);
  const decimalsFactor = 10 ** decimals;
  return BigInt(Math.floor(amount * decimalsFactor));
}

export function useMippyToken() {
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [contractData, setContractData] = useState<{abi: any[]} | null>(null)
  const [wasCancelled, setWasCancelled] = useState(false)
  const [tokenDecimals, setTokenDecimals] = useState<number>(18)
  const [refetchTrigger, setRefetchTrigger] = useState(0)
  
  // Prevent infinite update loops with refs
  const isUpdatingRef = useRef(false);
  const isPendingTransactionRef = useRef(false);
  const lastProcessedTxRef = useRef<string | null>(null);
  
  // Contract interactions
  const { writeContract, isPending, data: txHash, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash })

  // Load contract ABI
  useEffect(() => {
    async function loadContractData() {
      try {
        const artifact = await import("@/public/artifacts/MippyToken.json")
        console.log("Loaded MIPPY token contract ABI")
        setContractData({
          abi: artifact.default.abi,
        })
      } catch (error) {
        console.error("Error loading MippyToken contract data:", error)
      }
    }
    
    loadContractData()
  }, [])

  // Get token decimals
  const { data: decimalData } = useReadContract({
    address: CONTRACTS.MIPPY_TOKEN,
    abi: contractData?.abi || [],
    functionName: "decimals",
    query: {
      enabled: !!contractData?.abi,
    },
  })

  // Update decimals when data is available
  useEffect(() => {
    if (decimalData !== undefined) {
      const decimals = Number(decimalData)
      console.log(`MIPPY token has ${decimals} decimals`)
      setTokenDecimals(decimals)
    }
  }, [decimalData])

  // Get token balance
  const { data: balanceData, refetch: refetchBalanceData } = useReadContract({
    address: CONTRACTS.MIPPY_TOKEN,
    abi: contractData?.abi || [],
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contractData?.abi,
    },
  })

  // Handle transaction errors
  useEffect(() => {
    if (writeError) {
      const errorMessage = writeError.message || "Transaction failed"
      console.error("MIPPY token error:", errorMessage)
      
      // Check for user rejection
      if (errorMessage.includes("rejected") || 
          errorMessage.includes("denied") || 
          errorMessage.includes("cancelled") ||
          errorMessage.includes("canceled") ||
          errorMessage.includes("user denied")) {
        setWasCancelled(true)
      } else {
        toast({
          title: "Transaction Error",
          description: `Transaction failed: ${errorMessage}`,
          variant: "destructive",
        })
      }
      
      // Reset states
      setIsLoading(false)
      isPendingTransactionRef.current = false;
    }
  }, [writeError])

  // Reset cancelled state when starting a new transaction
  useEffect(() => {
    if (isPending) {
      setWasCancelled(false)
      isPendingTransactionRef.current = true;
    }
  }, [isPending])

  // Process balance data
  const balance = balanceData !== undefined ? BigInt(balanceData.toString()) : BigInt(0)

  // Utility function to format with proper decimals
  const formatWithDecimals = useCallback((amount: number): bigint => {
    return formatTokensWithDecimals(amount, tokenDecimals);
  }, [tokenDecimals]);

  // Pretty format balance for display
  const formatDisplayBalance = useCallback((rawBalance: bigint): string => {
    if (tokenDecimals === 0) return rawBalance.toString()
    
    const divisor = BigInt(10 ** tokenDecimals)
    const whole = rawBalance / divisor
    const fraction = rawBalance % divisor
    
    // Convert fraction to string and pad with leading zeros
    let fractionStr = fraction.toString().padStart(tokenDecimals, '0')
    
    // Trim trailing zeros
    fractionStr = fractionStr.replace(/0+$/, '')
    
    // If fractionStr is empty, set it to "0"
    if (fractionStr === '') fractionStr = '0'
    
    // Truncate to 6 decimal places for readability
    if (fractionStr.length > 6) {
      fractionStr = fractionStr.substring(0, 6)
    }
    
    return fractionStr === '0' ? whole.toString() : `${whole}.${fractionStr}`
  }, [tokenDecimals])

  // Approve tokens for a spender contract
  const approveTokens = async (spender: string, amount: number): Promise<boolean> => {
    if (!address) {
      toast({
        title: "Connection Error",
        description: "Please connect your wallet first.",
        variant: "destructive",
      })
      return false
    }
    
    if (!contractData?.abi) {
      toast({
        title: "Application Error",
        description: "Contract data is not loaded yet. Please try again in a moment.",
        variant: "destructive",
      })
      return false
    }
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive",
      })
      return false
    }
    
    // Check if we're already processing a transaction
    if (isPendingTransactionRef.current || isUpdatingRef.current) {
      console.log("Already processing a transaction, skipping approval request");
      return false;
    }
    
    // Reset states before starting a new approval
    setIsLoading(true)
    setWasCancelled(false)
    
    try {
      // Format with proper decimals
      const amountWithDecimals = formatWithDecimals(amount)
      console.log(`Approving ${amount} MIPPY tokens (${amountWithDecimals} raw units) for spender ${spender}`)
      
      // Use the direct contract call without any additional state updates
      await writeContract({
        address: CONTRACTS.MIPPY_TOKEN,
        abi: contractData.abi, 
        functionName: "approve",
        args: [spender, amountWithDecimals],
        gas: BigInt(200000), // Add extra gas for approval
      })
      
      console.log("Approval transaction initiated successfully")
      return true
    } catch (error) {
      console.error("Error approving tokens:", error)
      setIsLoading(false)
      return false
    }
  }

  // Handle confirmed transactions in a safe way
  useEffect(() => {
    if (!txHash || !isConfirmed) return;
    
    const currentTxHash = txHash.toString();
    
    // Skip if already processed
    if (lastProcessedTxRef.current === currentTxHash) return;
    
    console.log("Transaction confirmed:", currentTxHash);
    lastProcessedTxRef.current = currentTxHash;
    
    // Reset state flags
    isPendingTransactionRef.current = false;
    
    // Update UI state safely
    setTimeout(() => {
      setIsLoading(false);
      
      // Trigger a balance refetch after confirmation
      refetchBalanceData();
      
      toast({
        title: "Success!",
        description: "Transaction confirmed.",
      });
    }, 100);
  }, [isConfirmed, txHash, refetchBalanceData]);

  // Directly refetch balance without triggering state updates
  const refetchBalance = useCallback(() => {
    if (isUpdatingRef.current) return;
    console.log("Refetching MIPPY token balance");
    refetchBalanceData();
  }, [refetchBalanceData]);

  // A computed property to determine if any loading is happening
  const isAnyLoading = isLoading || isPending || isConfirming

  // Reset loading if user cancelled
  useEffect(() => {
    if (wasCancelled && isAnyLoading) {
      isPendingTransactionRef.current = false;
      setIsLoading(false);
    }
  }, [wasCancelled, isAnyLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUpdatingRef.current = false;
      isPendingTransactionRef.current = false;
      lastProcessedTxRef.current = null;
    };
  }, []);

  return { 
    balance, 
    approveTokens,
    refetchBalance,
    isLoading: isAnyLoading,
    isConfirmed,
    wasCancelled,
    tokenAddress: CONTRACTS.MIPPY_TOKEN,
    tokenDecimals,
    formatWithDecimals,
    formatDisplayBalance
  }
} 