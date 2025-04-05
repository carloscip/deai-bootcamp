"use client"

import { useState, useEffect } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi"
import { toast } from "./use-toast"
import { useMippyToken } from "./use-mippy-token"

// Import contract ABIs dynamically
export function useAIModelQueryTool() {
  const { address } = useAccount()
  const { approveTokens, tokenAddress, isConfirmed: isMippyConfirmed } = useMippyToken()
  const [isLoading, setIsLoading] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [querySuccess, setQuerySuccess] = useState(false)
  const [approvalSuccess, setApprovalSuccess] = useState(false)
  const { writeContract, isPending, data: txHash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash })
  
  // Load contract data
  const [contractData, setContractData] = useState<{
    abi: any[];
    address: string;
  } | null>(null)
  
  useEffect(() => {
    async function loadContractData() {
      try {
        const aiQueryToolArtifact = await import("@/public/artifacts/AIModelQueryTool.json")
        setContractData({
          abi: aiQueryToolArtifact.output.abi,
          address: aiQueryToolArtifact.address,
        })
      } catch (error) {
        console.error("Error loading contract data:", error)
      }
    }
    
    loadContractData()
  }, [])

  // Check token approval - only if tokenAddress and contract address are available
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress as `0x${string}` | undefined,
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
    const requiredAllowance = BigInt(queryCostInCredits) * BigInt(10**18)
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

    setIsApproving(true)
    
    try {
      // Call approveTokens from the MippyToken hook which now returns success status
      const success = await approveTokens(contractData.address, queryCostInCredits)
      if (!success) {
        setIsApproving(false)
      }
      return success
    } catch (error) {
      console.error("Error approving tokens:", error)
      toast({
        title: "Error",
        description: "Failed to approve tokens.",
        variant: "destructive",
      })
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

    setQuerySuccess(false)
    setIsLoading(true)
    
    try {
      // Then call the queryAI function
      await writeContract({
        address: contractData.address as `0x${string}`,
        abi: contractData.abi,
        functionName: "queryAI",
        args: [BigInt(queryCostInCredits)],
      })
      
      return true // Return true if writeContract didn't throw
    } catch (error) {
      console.error("Error querying AI:", error)
      toast({
        title: "Error",
        description: "Failed to query AI.",
        variant: "destructive",
      })
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
    contractAddress: contractData?.address,
    refetchAllowance
  }
} 