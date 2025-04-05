"use client"

import { useState, useEffect } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseEther } from "viem"
import { toast } from "./use-toast"
import { useMippyToken } from "./use-mippy-token"

export function useDepositManager() {
  const { address } = useAccount()
  const { refetchBalance } = useMippyToken()
  const [isLoading, setIsLoading] = useState(false)
  const { writeContract, isPending, data: txHash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash })
  const [contractData, setContractData] = useState<{abi: any[], address: string} | null>(null)

  // Load contract data
  useEffect(() => {
    async function loadContractData() {
      try {
        const depositManagerArtifact = await import("@/public/artifacts/DepositManager.json")
        setContractData({
          abi: depositManagerArtifact.output.abi,
          address: depositManagerArtifact.address
        })
      } catch (error) {
        console.error("Error loading DepositManager contract data:", error)
      }
    }
    
    loadContractData()
  }, [])

  // Deposit ETH to get Mippy tokens
  const depositEth = async (amount: number) => {
    if (!address || !contractData) {
      toast({
        title: "Error",
        description: "Please connect your wallet first.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const amountInWei = parseEther(amount.toString())
      writeContract({
        address: contractData.address as `0x${string}`,
        abi: contractData.abi,
        functionName: "depositBaseTokens",
        args: [amountInWei],
        value: amountInWei,
      })
    } catch (error) {
      console.error("Error depositing ETH:", error)
      toast({
        title: "Error",
        description: "Failed to deposit ETH.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isConfirmed) {
      toast({
        title: "Success!",
        description: "Deposit confirmed. You've received Mippy tokens!",
      })
      // Update token balance
      refetchBalance?.()
      setIsLoading(false)
    }
  }, [isConfirmed, refetchBalance])

  return { 
    depositEth,
    isLoading: isLoading || isPending || isConfirming,
    isSuccess: isConfirmed,
    depositManagerAddress: contractData?.address
  }
} 