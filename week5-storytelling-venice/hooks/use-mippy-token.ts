"use client"

import { useState, useEffect } from "react"
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseEther, parseUnits } from "viem"
import { toast } from "./use-toast"

export function useMippyToken() {
  const { address } = useAccount()
  const [balance, setBalance] = useState<bigint>(BigInt(0))
  const [isLoading, setIsLoading] = useState(false)
  const [tokenDecimals, setTokenDecimals] = useState(18) // Default to 18 decimals
  const { writeContract, isPending, data: txHash, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash })
  const [contractData, setContractData] = useState<{abi: any[], address: `0x${string}`} | null>(null)
  const [refetchTrigger, setRefetchTrigger] = useState(0)
  const [wasCancelled, setWasCancelled] = useState(false)

  // Load contract data
  useEffect(() => {
    async function loadContractData() {
      try {
        const tokenArtifact = await import("@/public/artifacts/MippyToken.json")
        setContractData({
          abi: tokenArtifact.output.abi,
          address: tokenArtifact.address as `0x${string}`
        })
      } catch (error) {
        console.error("Error loading MippyToken contract data:", error)
      }
    }
    
    loadContractData()
  }, [])

  // Handle transaction errors (including user rejection)
  useEffect(() => {
    if (writeError) {
      const errorMessage = writeError.message || "Transaction failed"
      
      // Check for user rejection patterns
      if (errorMessage.includes("rejected") || 
          errorMessage.includes("denied") || 
          errorMessage.includes("cancelled") ||
          errorMessage.includes("canceled") ||
          errorMessage.includes("user denied")) {
        toast({
          title: "Transaction Cancelled",
          description: "You cancelled the transaction in your wallet.",
          variant: "destructive",
        })
        setWasCancelled(true)
      } else {
        toast({
          title: "Transaction Error",
          description: `Transaction failed: ${errorMessage}`,
          variant: "destructive",
        })
      }
      
      // Always reset loading state on any error
      setIsLoading(false)
    }
  }, [writeError])

  // Reset cancelled state when starting a new transaction
  useEffect(() => {
    if (isPending) {
      setWasCancelled(false)
    }
  }, [isPending])

  // Get token decimals
  const { data: decimalsData } = useReadContract({
    address: contractData?.address as `0x${string}` | undefined,
    abi: [
      {
        constant: true,
        inputs: [],
        name: "decimals",
        outputs: [{ name: "", type: "uint8" }],
        type: "function"
      }
    ],
    functionName: "decimals",
    query: {
      enabled: !!contractData?.address,
    }
  })

  // Update decimals when data is available
  useEffect(() => {
    if (decimalsData !== undefined) {
      setTokenDecimals(Number(decimalsData))
    }
  }, [decimalsData])

  // Get token balance
  const { data: balanceData } = useReadContract({
    address: contractData?.address as `0x${string}` | undefined,
    abi: contractData?.abi || [],
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contractData?.address,
    },
  })

  // Format tokens with proper decimals
  const formatWithDecimals = (amount: number): bigint => {
    try {
      return parseUnits(amount.toString(), tokenDecimals)
    } catch (error) {
      console.error("Error formatting amount with decimals:", error)
      return BigInt(0)
    }
  }

  // Format for display with proper decimals
  const formatDisplayBalance = (rawBalance: bigint): string => {
    try {
      // Calculate based on the token decimals (e.g., 18 decimals means divide by 10^18)
      return (Number(rawBalance) / (10 ** tokenDecimals)).toFixed(3);
    } catch (error) {
      console.error("Error formatting display balance:", error);
      return "0";
    }
  }

  // Approve spending of tokens without returning hash
  const approveTokens = async (spender: string, amount: number): Promise<boolean> => {
    if (!contractData || !contractData.address) return false
    
    // Reset states before starting a new approval
    setIsLoading(true)
    setWasCancelled(false)
    
    try {
      // Format with proper decimals
      const amountWithDecimals = formatWithDecimals(amount)
      
      await writeContract({
        address: contractData.address,
        abi: contractData.abi, 
        functionName: "approve",
        args: [spender, amountWithDecimals],
      })
      
      // Successfully called the function (transaction might still fail)
      return true
    } catch (error) {
      console.error("Error approving tokens:", error)
      // Don't show toast here as it's handled by the writeError effect
      setIsLoading(false)
      return false
    }
  }

  const refetchBalance = () => {
    setRefetchTrigger(prev => prev + 1)
  }

  useEffect(() => {
    if (balanceData) {
      // Properly convert the balance data to bigint
      try {
        // First convert to unknown, then to string, then to BigInt
        const balanceValue = String(balanceData)
        setBalance(BigInt(balanceValue || '0'))
      } catch (error) {
        console.error("Error converting balance data to bigint:", error)
        setBalance(BigInt(0))
      }
    }
  }, [balanceData, refetchTrigger])

  useEffect(() => {
    if (isConfirmed) {
      toast({
        title: "Success!",
        description: "Transaction confirmed.",
      })
      refetchBalance()
      setIsLoading(false)
    }
  }, [isConfirmed])

  // A computed property to determine if any loading is happening
  const isAnyLoading = isLoading || isPending || isConfirming

  // Reset loading if user cancelled
  useEffect(() => {
    if (wasCancelled && isAnyLoading) {
      setIsLoading(false)
    }
  }, [wasCancelled, isAnyLoading])

  return { 
    balance, 
    approveTokens,
    refetchBalance,
    isLoading: isAnyLoading,
    isConfirmed,
    wasCancelled,
    tokenAddress: contractData?.address,
    tokenDecimals,
    formatWithDecimals,
    formatDisplayBalance
  }
} 