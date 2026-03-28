/**
 * Custom wallet module factories that wrap @near-wallet-selector/ethereum-wallets
 * to show MetaMask and Coinbase Wallet as individual entries in the modal.
 *
 * Each creates a separate wagmi config with a single specific connector,
 * then overrides the id/name/icon from the returned WalletModule.
 */
import { createConfig, http } from "wagmi";
import { defineChain } from "viem";
import { metaMask, coinbaseWallet } from "wagmi/connectors";
import { setupEthereumWallets } from "@near-wallet-selector/ethereum-wallets";
import * as wagmiCore from "@wagmi/core";

// NEAR chains required by ethereum-wallets plugin
const nearTestnet = defineChain({
  id: 398,
  name: "NEAR Protocol Testnet",
  nativeCurrency: { name: "NEAR", symbol: "NEAR", decimals: 24 },
  rpcUrls: { default: { http: ["https://eth-rpc.testnet.near.org"] } },
  blockExplorers: { default: { name: "NearBlocks", url: "https://testnet.nearblocks.io" } },
  testnet: true,
});

const nearMainnet = defineChain({
  id: 397,
  name: "NEAR Protocol",
  nativeCurrency: { name: "NEAR", symbol: "NEAR", decimals: 24 },
  rpcUrls: { default: { http: ["https://eth-rpc.mainnet.near.org"] } },
  blockExplorers: { default: { name: "NearBlocks", url: "https://nearblocks.io" } },
});

// Official icon URLs
const METAMASK_ICON = "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg";
const COINBASE_ICON = "https://altcoinsbox.com/wp-content/uploads/2022/12/coinbase-wallet-logo.png";

function makeMetaMaskConfig() {
  return createConfig({
    chains: [nearTestnet, nearMainnet],
    connectors: [metaMask()],
    transports: {
      [nearTestnet.id]: http("https://eth-rpc.testnet.near.org"),
      [nearMainnet.id]: http("https://eth-rpc.mainnet.near.org"),
    },
  });
}

function makeCoinbaseConfig() {
  return createConfig({
    chains: [nearTestnet, nearMainnet],
    connectors: [coinbaseWallet({ appName: "Lucky Goal" })],
    transports: {
      [nearTestnet.id]: http("https://eth-rpc.testnet.near.org"),
      [nearMainnet.id]: http("https://eth-rpc.mainnet.near.org"),
    },
  });
}

/**
 * Creates a wallet module factory that wraps ethereum-wallets
 * but overrides the id, name, and icon.
 */
function createCustomEthWallet(
  id: string,
  name: string,
  iconUrl: string,
  wagmiCfg: ReturnType<typeof createConfig>
) {
  return () => {
    const factory = setupEthereumWallets({
      wagmiConfig: wagmiCfg as any,
      wagmiCore: wagmiCore as any,
      alwaysOnboardDuringSignIn: true,
    });

    return (factory as Function)().then((module: any) => ({
      ...module,
      id,
      metadata: {
        ...module.metadata,
        name,
        iconUrl,
        description: `Connect with ${name}`,
      },
    }));
  };
}

export function setupMetaMask() {
  return createCustomEthWallet(
    "metamask",
    "MetaMask",
    METAMASK_ICON,
    makeMetaMaskConfig()
  );
}

export function setupCoinbaseWalletNear() {
  return createCustomEthWallet(
    "coinbase-wallet",
    "Coinbase Wallet",
    COINBASE_ICON,
    makeCoinbaseConfig()
  );
}
