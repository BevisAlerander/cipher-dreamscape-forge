import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";
import {
  RainbowKitProvider,
  getDefaultConfig,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { mainnet, sepolia } from "wagmi/chains";
import type { Chain } from "viem/chains";

import App from "./App";
import "./index.css";
import "@rainbow-me/rainbowkit/styles.css";

// Custom Hardhat local chain (matches hardhat.config.ts chainId 31337 / 0x7a69)
const hardhatLocal: Chain = {
  id: 31337,
  name: "Hardhat Local",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
    public: { http: ["http://127.0.0.1:8545"] },
  },
};

const wagmiConfig = getDefaultConfig({
  appName: "Cipher Dreamscape World",
  projectId: "88306a972a77389d91871e08d26516af",
  chains: [hardhatLocal, sepolia, mainnet],
  ssr: false,
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
);


