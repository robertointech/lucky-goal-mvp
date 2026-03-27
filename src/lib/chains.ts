export type ChainConfig = {
  id: string;
  name: string;
  chainId: number | string;
  rpcUrl: string;
  explorerUrl: string;
  nativeToken: {
    symbol: string;
    decimals: number;
  };
  type: "evm" | "near";
};

export const chains = {
  avalancheFuji: {
    id: "avalanche-fuji",
    name: "Avalanche Fuji",
    chainId: 43113,
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    explorerUrl: "https://testnet.snowtrace.io",
    nativeToken: { symbol: "AVAX", decimals: 18 },
    type: "evm",
  },
  arbitrumSepolia: {
    id: "arbitrum-sepolia",
    name: "Arbitrum Sepolia",
    chainId: 421614,
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    explorerUrl: "https://sepolia.arbiscan.io",
    nativeToken: { symbol: "ETH", decimals: 18 },
    type: "evm",
  },
  nearTestnet: {
    id: "near-testnet",
    name: "NEAR Testnet",
    chainId: "testnet",
    rpcUrl: "https://rpc.testnet.near.org",
    explorerUrl: "https://testnet.nearblocks.io",
    nativeToken: { symbol: "NEAR", decimals: 24 },
    type: "near",
  },
  avalancheMainnet: {
    id: "avalanche-mainnet",
    name: "Avalanche",
    chainId: 43114,
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    explorerUrl: "https://snowtrace.io",
    nativeToken: { symbol: "AVAX", decimals: 18 },
    type: "evm",
  },
  arbitrumOne: {
    id: "arbitrum-one",
    name: "Arbitrum One",
    chainId: 42161,
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    explorerUrl: "https://arbiscan.io",
    nativeToken: { symbol: "ETH", decimals: 18 },
    type: "evm",
  },
  nearMainnet: {
    id: "near-mainnet",
    name: "NEAR",
    chainId: "mainnet",
    rpcUrl: "https://rpc.mainnet.near.org",
    explorerUrl: "https://nearblocks.io",
    nativeToken: { symbol: "NEAR", decimals: 24 },
    type: "near",
  },
} as const satisfies Record<string, ChainConfig>;

export type ChainKey = keyof typeof chains;

export const DEFAULT_CHAIN: ChainKey = "avalancheFuji";

export function getChain(key: ChainKey): ChainConfig {
  return chains[key];
}

export function getEvmChains() {
  return Object.entries(chains)
    .filter(([, c]) => c.type === "evm")
    .map(([key, config]) => ({ key: key as ChainKey, ...config }));
}

export function getNearChains() {
  return Object.entries(chains)
    .filter(([, c]) => c.type === "near")
    .map(([key, config]) => ({ key: key as ChainKey, ...config }));
}

// Re-export chain-signatures sendNativeTransfer for airdrop use
// In host/game page, this is called with (to, amount) — we wrap it for DEMO_MODE compat
export async function sendNativeTransfer(to: string, amount: string): Promise<void> {
  const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  if (DEMO_MODE) {
    const fakeTx = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    console.log(`[airdrop] DEMO_MODE: send ${amount} AVAX to ${to} -> ${fakeTx}`);
    return;
  }
  // Real transfers require a NEAR signer account — the host/game page should
  // call chain-signatures.sendNativeTransfer directly with the signer context.
  // This simplified wrapper is for backwards compatibility.
  console.warn(`[airdrop] sendNativeTransfer called without signer context. To: ${to}, Amount: ${amount}`);
}
