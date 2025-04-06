"use client"; // Mark this as a Client Component

import * as React from "react";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import ClientOnly from "./components/ClientOnly";

// You need to get a projectId from https://cloud.walletconnect.com
const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "development";

// Create Context to ensure WalletConnect is initialized only once
const WalletInitContext = React.createContext<boolean>(false);

/**
 * The Wallet provider component that wraps the application.
 * This is separated from the main provider to ensure WalletConnect is only initialized on the client.
 */
function WalletProviders({ children }: { children: React.ReactNode }) {
  const hasInitialized = React.useContext(WalletInitContext);
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: false,
          },
        },
      })
  );

  // Only create config and render providers if not yet initialized
  if (hasInitialized) {
    return <>{children}</>;
  }

  // Configure chains and connectors
  const config = getDefaultConfig({
    appName: "AI Joke Generator",
    projectId,
    chains: [sepolia],
    ssr: false,
  });

  return (
    <WalletInitContext.Provider value={true}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>{children}</RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </WalletInitContext.Provider>
  );
}

/**
 * Main Providers component that ensures client-side only rendering for WalletConnect
 * to prevent the double initialization error.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClientOnly>
      <WalletProviders>{children}</WalletProviders>
    </ClientOnly>
  );
}
