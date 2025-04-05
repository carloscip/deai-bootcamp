"use client"

import { useState, useEffect } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi"
import { toast } from "./use-toast"
import { useMippyToken } from "./use-mippy-token"

// Import contract ABIs dynamically
export function useAIModelQueryTool() {
  const { address } = useAccount()
  const { approveTokens, tokenAddress, isConfirmed: isMippyConfirmed, wasCancelled: mippyWasCancelled, tokenDecimals, formatWithDecimals } = useMippyToken()
  const [isLoading, setIsLoading] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [querySuccess, setQuerySuccess] = useState(false)
  const [approvalSuccess, setApprovalSuccess] = useState(false)
  const { writeContract, isPending, data: txHash, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash })
  const [wasCancelled, setWasCancelled] = useState(false)
  
  // Load contract data
  const [contractData, setContractData] = useState<{
    abi: any[];
    address: `0x${string}`;
  } | null>(null)
  
  useEffect(() => {
    async function loadContractData() {
      try {
        const aiQueryToolArtifact = await import("@/public/artifacts/AIModelQueryTool.json")
        setContractData({
          abi: aiQueryToolArtifact.output.abi,
          address: aiQueryToolArtifact.address as `0x${string}`,
        })
      } catch (error) {
        console.error("Error loading contract data:", error)
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
          title: "Error",
          description: `Transaction failed: ${errorMessage}`,
          variant: "destructive",
        })
      }
      
      setIsLoading(false)
      setIsApproving(false) // Also reset approving state
    }
  }, [writeError])

  // Reset cancelled state when starting a new transaction
  useEffect(() => {
    if (isPending) {
      setWasCancelled(false)
    }
  }, [isPending])

  // Watch for approval cancellations 
  useEffect(() => {
    if (isApproving && mippyWasCancelled) {
      setIsApproving(false)
      toast({
        title: "Approval Cancelled",
        description: "Token approval was cancelled.",
        variant: "destructive",
      })
    }
  }, [isApproving, mippyWasCancelled])

  // Check token approval - only if tokenAddress and contract address are available
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: [
      {
        constant: true,
        inputs: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' }
        ],
        name: 'allowance',
        outputs: [{ name: '', type: 'uint256' }],
        type: 'function'
      }
    ],
    functionName: "allowance",
    args: address && contractData?.address ? [address, contractData.address] : undefined,
    query: {
      enabled: !!contractData?.address && !!address && !!tokenAddress,
    }
  })

  // Watch for approval confirmations
  useEffect(() => {
    if (isApproving && isMippyConfirmed) {
      toast({
        title: "Success!",
        description: "Token approval completed successfully.",
      })
      setIsApproving(false)
      setApprovalSuccess(true)
      refetchAllowance()
    }
  }, [isApproving, isMippyConfirmed, refetchAllowance])

  // Check if current allowance is enough for the query
  const hasEnoughAllowance = (queryCostInCredits: number): boolean => {
    if (!allowance) return false
    const requiredAllowance = formatWithDecimals(queryCostInCredits)
    return BigInt(allowance.toString()) >= requiredAllowance
  }

  // Approve tokens for the AI query
  const approveAIQuery = async (queryCostInCredits: number) => {
    if (!address || !contractData) {
      toast({
        title: "Error",
        description: "Please connect your wallet first or contract data is not loaded.",
        variant: "destructive",
      })
      return false
    }

    // Reset states before starting new approval
    setWasCancelled(false)
    setIsApproving(true)
    setApprovalSuccess(false)
    
    try {
      // Call approveTokens from the MippyToken hook which now returns success status
      const success = await approveTokens(contractData.address, queryCostInCredits)
      if (!success) {
        setIsApproving(false)
      }
      return success
    } catch (error) {
      console.error("Error approving tokens:", error)
      // Don't show toast here as it's handled by the writeError effect in useMippyToken
      setIsApproving(false)
      return false
    }
  }

  // Query AI with cost in tokens
  const queryAI = async (queryCostInCredits: number) => {
    if (!address || !contractData) {
      toast({
        title: "Error",
        description: "Please connect your wallet first or contract data is not loaded.",
        variant: "destructive",
      })
      return false
    }

    // Reset states before starting new query
    setQuerySuccess(false)
    setIsLoading(true)
    setWasCancelled(false)
    
    try {
      // Then call the queryAI function
      await writeContract({
        address: contractData.address,
        abi: contractData.abi,
        functionName: "queryAI",
        args: [formatWithDecimals(queryCostInCredits)],
      })
      
      return true // Return true if writeContract didn't throw
    } catch (error) {
      console.error("Error querying AI:", error)
      // Don't show toast here as it's handled by the writeError effect
      setIsLoading(false)
      return false
    }
  }

  // Handle query confirmation
  useEffect(() => {
    if (isConfirmed) {
      toast({
        title: "Success!",
        description: "AI Query completed successfully.",
      })
      setQuerySuccess(true)
      setIsLoading(false)
    }
  }, [isConfirmed])

  return { 
    queryAI,
    approveAIQuery,
    hasEnoughAllowance,
    isLoading: isLoading || isPending || isConfirming,
    isApproving,
    approvalSuccess,
    querySuccess,
    wasCancelled,
    contractAddress: contractData?.address,
    refetchAllowance
  }
} 