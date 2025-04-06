"use client"

import { useState, useEffect, useCallback } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi"
import { parseEther, formatEther } from "viem"
import { toast } from "./use-toast"
import { useMippyToken } from "./use-mippy-token"
import { CONTRACTS } from "@/config/contracts"

export function useDepositManager() {
  const { address } = useAccount()
  const { refetchBalance, tokenDecimals, formatWithDecimals } = useMippyToken()
  const [isLoading, setIsLoading] = useState(false)
  const { writeContract, isPending, data: txHash, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash })
  const [contractData, setContractData] = useState<{abi: any[]} | null>(null)
  const [wasCancelled, setWasCancelled] = useState(false)
  const [estimatedTokens, setEstimatedTokens] = useState<string>("0")
  const [conversionRate, setConversionRate] = useState<number | null>(null)
  const [shouldRefetchBalance, setShouldRefetchBalance] = useState(false)
  const [lastProcessedTx, setLastProcessedTx] = useState<string | null>(null)

  // Load contract data
  useEffect(() => {
    async function loadContractData() {
      try {
        const depositManagerArtifact = await import("@/public/artifacts/DepositManager.json")
        console.log("Loaded DepositManager contract ABI:", depositManagerArtifact.default.abi)
        setContractData({
          abi: depositManagerArtifact.default.abi,
        })
      } catch (error) {
        console.error("Error loading DepositManager contract data:", error)
      }
    }
    
    loadContractData()
  }, [])

  // Get the current price/conversion rate
  const { data: priceData } = useReadContract({
    address: CONTRACTS.DEPOSIT_MANAGER,
    abi: contractData?.abi || [],
    functionName: "getPrice",
    query: {
      enabled: !!contractData?.abi,
    }
  })

  // Update conversion rate when price data is available
  useEffect(() => {
    if (priceData !== undefined) {
      // Convert from int256 to number for easier calculations
      try {
        console.log("Raw price data received:", priceData)
        
        // Convert the price data to a string first for safer handling
        let priceString = priceData.toString();
        console.log("Price data as string:", priceString);
        
        // Check if the price needs to be divided by 10^8 (common price oracle format)
        // 178731250100 would mean 1787.3125 tokens per ETH
        const rate = Number(priceString) / 10**8;
        console.log("Calculated conversion rate:", rate);
        
        // Only update if the rate is different
        if (conversionRate !== rate) {
          setConversionRate(rate);
        }
      } catch (error) {
        console.error("Error converting price data:", error)
        // Set a default rate if conversion fails
        if (conversionRate !== 1787.31) {
          setConversionRate(1787.31)
        }
      }
    } else if (conversionRate === null) {
      // Set a default fallback rate if no data is available and we haven't set a rate yet
      console.log("No price data available, using default rate")
      setConversionRate(1787.31)
    }
  }, [priceData, conversionRate])

  // Handle transaction errors (including user rejection)
  useEffect(() => {
    if (writeError) {
      const errorMessage = writeError.message || "Transaction failed"
      console.error("Deposit error:", errorMessage)
      
      // Use setTimeout to break potential update cycles
      setTimeout(() => {
        // Check for user rejection patterns
        if (errorMessage.includes("rejected") || 
            errorMessage.includes("denied") || 
            errorMessage.includes("cancelled") ||
            errorMessage.includes("canceled") ||
            errorMessage.includes("user denied")) {
          toast({
            title: "Deposit Cancelled",
            description: "You cancelled the deposit transaction in your wallet.",
            variant: "destructive",
          })
          setWasCancelled(true)
        } else if (errorMessage.includes("gas")) {
          toast({
            title: "Gas Estimation Failed",
            description: "The transaction may require more gas than expected. Try increasing the amount you're depositing.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Deposit Error",
            description: `Deposit failed: ${errorMessage}`,
            variant: "destructive",
          })
        }
        
        // Always reset loading state on any error
        setIsLoading(false)
      }, 100);
    }
  }, [writeError])

  // Reset cancelled state when starting a new transaction
  useEffect(() => {
    if (isPending) {
      setWasCancelled(false)
    }
  }, [isPending])

  // Calculate estimated Mippy tokens for a given ETH amount
  const estimateMippyTokens = useCallback((ethAmount: number): string => {
    if (isNaN(ethAmount) || ethAmount <= 0) return "0";
    
    // If we have the conversion rate from the contract, use it
    if (conversionRate !== null) {
      const mippyAmount = ethAmount * conversionRate;
      console.log(`Estimating MIPPY: ${ethAmount} ETH × ${conversionRate} = ${mippyAmount.toFixed(2)} MIPPY`);
      return mippyAmount.toFixed(2);
    }
    
    // Fallback to a default rate if contract rate isn't available yet
    // Use 1787 as fallback since that's the current known rate
    const defaultRate = 1787.31; 
    const mippyAmount = ethAmount * defaultRate;
    console.log(`Using fallback rate: ${ethAmount} ETH × ${defaultRate} = ${mippyAmount.toFixed(2)} MIPPY`);
    return mippyAmount.toFixed(2);
  }, [conversionRate]);

  // Update estimated tokens when eth amount changes
  const updateTokenEstimate = useCallback((ethAmount: number) => {
    console.log(`Updating token estimate for ${ethAmount} ETH`);
    const estimate = estimateMippyTokens(ethAmount);
    
    // Only update state if estimate changed
    if (estimate !== estimatedTokens) {
      setEstimatedTokens(estimate);
      console.log(`Set estimatedTokens to: ${estimate}`);
    }
    
    return estimate;
  }, [estimateMippyTokens, estimatedTokens]);

  // Deposit ETH to get Mippy tokens
  const depositEth = async (amount: number) => {
    if (!address) {
      toast({
        title: "Connection Error",
        description: "Please connect your wallet first.",
        variant: "destructive",
      })
      return
    }

    if (!contractData?.abi) {
      console.error("Contract ABI not loaded yet");
      toast({
        title: "Application Error",
        description: "Contract data is not loaded yet. Please try again in a moment.",
        variant: "destructive",
      })
      return
    }

    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive",
      })
      return
    }

    // Reset states before starting a new deposit
    setIsLoading(true)
    setWasCancelled(false)
    setShouldRefetchBalance(false)
    setLastProcessedTx(null)
    
    try {
      const amountInWei = parseEther(amount.toString())
      console.log(`Depositing ${amount} ETH (${amountInWei} wei) to contract ${CONTRACTS.DEPOSIT_MANAGER}`)
      
      // Add warning if amount is too small
      if (amount < 0.01) {
        toast({
          title: "Low Amount Warning",
          description: "Very small deposits may fail due to gas costs. We recommend at least 0.01 ETH.",
          variant: "destructive",
        })
      }
      
      // Call depositBaseTokens with no arguments, just passing the value
      await writeContract({
        address: CONTRACTS.DEPOSIT_MANAGER,
        abi: contractData.abi,
        functionName: "depositBaseTokens",
        args: [], // Empty array since the function doesn't accept any parameters
        value: amountInWei, // Pass ETH with the transaction
        gas: BigInt(300000), // Add extra gas for potential complex operations
      })
      
      console.log("Deposit transaction initiated successfully");
    } catch (error) {
      console.error("Error depositing ETH:", error)
      // Don't show toast here as it's handled by the writeError effect
      setIsLoading(false)
    }
  }

  // A computed property to determine if any loading is happening
  const isAnyLoading = isLoading || isPending || isConfirming
  
  // Reset loading if user cancelled
  useEffect(() => {
    if (wasCancelled && isAnyLoading) {
      setIsLoading(false)
    }
  }, [wasCancelled, isAnyLoading])

  // Handle transaction confirmation separately to avoid loops
  useEffect(() => {
    // Only process confirmation if we haven't processed this tx before
    if (isConfirmed && txHash && txHash !== lastProcessedTx) {
      console.log("Deposit transaction confirmed:", txHash);
      
      // Use timeout to break potential update cycles
      setTimeout(() => {
        // Remove the toast notification since it's now handled in the component
        
        // Mark this tx as processed
        setLastProcessedTx(txHash);
        
        // Only trigger balance refetch if not already pending
        if (!shouldRefetchBalance) {
          setShouldRefetchBalance(true);
        }
        
        if (isLoading) {
          setIsLoading(false);
        }
      }, 300);
    }
  }, [isConfirmed, txHash, estimatedTokens, shouldRefetchBalance, isLoading, lastProcessedTx])

  // Separate effect for balance refetching to avoid loops
  useEffect(() => {
    let refetchTimeoutId: NodeJS.Timeout | null = null;
    
    if (shouldRefetchBalance) {
      console.log("Scheduling balance refetch after deposit");
      
      // Use timeout to break potential update cycles
      refetchTimeoutId = setTimeout(() => {
        console.log("Refetching balance after successful deposit");
        refetchBalance();
        setShouldRefetchBalance(false);
      }, 500);
    }
    
    // Cleanup function to clear the timeout if the component unmounts or the effect re-runs
    return () => {
      if (refetchTimeoutId) {
        clearTimeout(refetchTimeoutId);
      }
    };
  }, [shouldRefetchBalance, refetchBalance])

  return { 
    depositEth,
    isLoading: isAnyLoading,
    wasCancelled,
    txHash, 
    isSuccess: isConfirmed,
    estimatedTokens,
    updateTokenEstimate,
    conversionRate
  }
} 