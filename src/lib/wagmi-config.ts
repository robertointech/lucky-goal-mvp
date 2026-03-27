import { createConfig, http } from "wagmi";
import { mainnet, sepolia, avalanche, avalancheFuji, arbitrum, arbitrumSepolia } from "wagmi/chains";
import { defineChain } from "viem";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";
import { QueryClient } from "@tanstack/react-query";

// NEAR Protocol chains required by @near-wallet-selector/ethereum-wallets
// The plugin looks for chain ID 397 (mainnet) or 398 (testnet)
const nearMainnet = defineChain({
  id: 397,
  name: "NEAR Protocol",
  nativeCurrency: { name: "NEAR", symbol: "NEAR", decimals: 24 },
  rpcUrls: {
    default: { http: ["https://eth-rpc.mainnet.near.org"] },
  },
  blockExplorers: {
    default: { name: "NearBlocks", url: "https://nearblocks.io" },
  },
});

const nearTestnet = defineChain({
  id: 398,
  name: "NEAR Protocol Testnet",
  nativeCurrency: { name: "NEAR", symbol: "NEAR", decimals: 24 },
  rpcUrls: {
    default: { http: ["https://eth-rpc.testnet.near.org"] },
  },
  blockExplorers: {
    default: { name: "NearBlocks", url: "https://testnet.nearblocks.io" },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [nearTestnet, nearMainnet, mainnet, sepolia, avalanche, avalancheFuji, arbitrum, arbitrumSepolia],
  connectors: [
    injected(), // MetaMask, Rabby, Brave, etc.
    coinbaseWallet({ appName: "Lucky Goal" }),
    ...(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
      ? [walletConnect({ projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID })]
      : []),
  ],
  transports: {
    [nearTestnet.id]: http("https://eth-rpc.testnet.near.org"),
    [nearMainnet.id]: http("https://eth-rpc.mainnet.near.org"),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [avalanche.id]: http("https://api.avax.network/ext/bc/C/rpc"),
    [avalancheFuji.id]: http("https://api.avax-test.network/ext/bc/C/rpc"),
    [arbitrum.id]: http("https://arb1.arbitrum.io/rpc"),
    [arbitrumSepolia.id]: http("https://sepolia-rollup.arbitrum.io/rpc"),
  },
});

export const queryClient = new QueryClient();
