"use client"

import { useState, useEffect } from "react"
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseEther } from "viem"
import { toast } from "./use-toast"

export function useMippyToken() {
  const { address } = useAccount()
  const [balance, setBalance] = useState<bigint>(BigInt(0))
  const [isLoading, setIsLoading] = useState(false)
  const { writeContract, isPending, data: txHash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash })
  const [contractData, setContractData] = useState<{abi: any[], address: string} | null>(null)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  // Load contract data
  useEffect(() => {
    async function loadContractData() {
      try {
        const tokenArtifact = await import("@/public/artifacts/MippyToken.json")
        setContractData({
          abi: tokenArtifact.output.abi,
          address: tokenArtifact.address
        })
      } catch (error) {
        console.error("Error loading MippyToken contract data:", error)
      }
    }
    
    loadContractData()
  }, [])

  // Get token balance
  const { data: balanceData } = useReadContract({
    address: contractData?.address as `0x${string}` | undefined,
    abi: contractData?.abi || [],
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: !!address && !!contractData && !!contractData.address,
    },
  })

  // Approve spending of tokens without returning hash
  const approveTokens = async (spender: string, amount: number): Promise<boolean> => {
    if (!contractData || !contractData.address) return false
    
    setIsLoading(true)
    try {
      const amountInWei = parseEther(amount.toString())
      
      await writeContract({
        address: contractData.address as `0x${string}`,
        abi: contractData.abi, 
        functionName: "approve",
        args: [spender, amountInWei],
      })
      
      // Successfully called the function (transaction might still fail)
      return true
    } catch (error) {
      console.error("Error approving tokens:", error)
      toast({
        title: "Error",
        description: "Failed to approve tokens.",
        variant: "destructive",
      })
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

  return { 
    balance, 
    approveTokens,
    refetchBalance,
    isLoading: isLoading || isPending || isConfirming,
    isConfirmed,
    tokenAddress: contractData?.address 
  }
} 