import { createConfig, http } from "wagmi";
import { mainnet, sepolia, avalanche, avalancheFuji, arbitrum, arbitrumSepolia } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";
import { QueryClient } from "@tanstack/react-query";

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia, avalanche, avalancheFuji, arbitrum, arbitrumSepolia],
  connectors: [
    injected(), // MetaMask, Rabby, Brave, etc.
    coinbaseWallet({ appName: "Lucky Goal" }),
    ...(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
      ? [walletConnect({ projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID })]
      : []),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [avalanche.id]: http("https://api.avax.network/ext/bc/C/rpc"),
    [avalancheFuji.id]: http("https://api.avax-test.network/ext/bc/C/rpc"),
    [arbitrum.id]: http("https://arb1.arbitrum.io/rpc"),
    [arbitrumSepolia.id]: http("https://sepolia-rollup.arbitrum.io/rpc"),
  },
});

export const queryClient = new QueryClient();
