"use client"; // Mark this as a Client Component

import * as React from "react";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import ClientOnly from "./components/ClientOnly";
import { http, custom } from "viem";

// You need to get a projectId from https://cloud.walletconnect.com
const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "development";

// Create singletons outside of the React component tree
let initialized = false;
let singletonQueryClient: QueryClient | null = null;
let singletonConfig: ReturnType<typeof getDefaultConfig> | null = null;

// Function to initialize singletons exactly once
function getOrCreateSingletons() {
  if (!initialized) {
    console.log("🔵 Creating WagmiProvider singletons (first initialization)");

    // Create query client
    singletonQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retry: false,
        },
      },
    });

    // Create wagmi config
    singletonConfig = getDefaultConfig({
      appName: "AI Joke Generator",
      projectId,
      chains: [sepolia],
      transports: {
        [sepolia.id]: custom({
          async request({ method, params }) {
            const response = await fetch("/api/eth-proxy", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ method, params }),
            });

            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
              throw new Error(
                data.error.message || "Error desconocido del RPC"
              );
            }

            return data.result;
          },
        }),
      },
      ssr: true,
    });

    initialized = true;
  }

  return {
    queryClient: singletonQueryClient,
    config: singletonConfig,
  };
}

// Separate component to handle React context providers
function WagmiProviders({ children }: { children: React.ReactNode }) {
  const { queryClient, config } = getOrCreateSingletons();

  if (!queryClient || !config) {
    return <div>Initializing providers...</div>;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

/**
 * Main Providers component that ensures client-side only rendering for WalletConnect
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClientOnly>
      <WagmiProviders>{children}</WagmiProviders>
    </ClientOnly>
  );
}
