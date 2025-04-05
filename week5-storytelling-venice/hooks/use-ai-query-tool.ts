"use client"

import { useState, useEffect } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { toast } from "./use-toast"
import { useMippyToken } from "./use-mippy-token"

// Import contract ABIs dynamically
export function useAIModelQueryTool() {
  const { address } = useAccount()
  const { approveTokens } = useMippyToken()
  const [isLoading, setIsLoading] = useState(false)
  const [querySuccess, setQuerySuccess] = useState(false)
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
      // First approve spending of tokens
      await approveTokens(contractData.address, queryCostInCredits)
      
      // Then call the queryAI function
      writeContract({
        address: contractData.address as `0x${string}`,
        abi: contractData.abi,
        functionName: "queryAI",
        args: [BigInt(queryCostInCredits)],
      })
      
      return false // Return false initially, will be updated when confirmed
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
    isLoading: isLoading || isPending || isConfirming,
    querySuccess,
    contractAddress: contractData?.address
  }
} 