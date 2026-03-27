/**
 * Custom wallet module factories that wrap @near-wallet-selector/ethereum-wallets
 * to show MetaMask and Coinbase Wallet as individual entries in the modal.
 *
 * Each creates a separate wagmi config with a single connector,
 * then overrides the id/name/icon from the returned WalletModule.
 */
import { createConfig, http } from "wagmi";
import { defineChain } from "viem";
import { injected, coinbaseWallet } from "wagmi/connectors";
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

// MetaMask icon (official SVG as data URI)
const METAMASK_ICON = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMTIiIGhlaWdodD0iMTg5IiB2aWV3Qm94PSIwIDAgMjEyIDE4OSI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cG9seWdvbiBmaWxsPSIjQ0RCREIyIiBwb2ludHM9IjYwLjc1IDE3My4yNSA3Ni4yNSAxNzYuNzUgNzYuMjUgMTYzLjc1IDYwLjc1IDE2My43NSIvPjxwb2x5Z29uIGZpbGw9IiNDREJEQjIiIHBvaW50cz0iMTA1Ljc1IDE3My4yNSAxMzUuNzUgMTc2Ljc1IDEzNS43NSAxNjMuNzUgMTA1Ljc1IDE2My43NSIvPjxwb2x5Z29uIGZpbGw9IiNFNDc2MUIiIHBvaW50cz0iNzYuMjUgMTUwLjc1IDYwLjc1IDE2My43NSA3Ni4yNSAxNzYuNzUgNzYuMjUgMTYzLjc1Ii8+PHBvbHlnb24gZmlsbD0iI0U0NzYxQiIgcG9pbnRzPSIxMDUuNzUgMTUwLjc1IDEzNS43NSAxNjMuNzUgMTA1Ljc1IDE3Ni43NSAxMDUuNzUgMTYzLjc1Ii8+PHBvbHlnb24gZmlsbD0iI0Y2ODUxQiIgcG9pbnRzPSI3Ni4yNSAxNjMuNzUgNjAuNzUgMTYzLjc1IDQ2Ljc1IDEzMy41IDc2LjI1IDE1MC43NSIvPjxwb2x5Z29uIGZpbGw9IiNGNjg1MUIiIHBvaW50cz0iMTA1Ljc1IDE2My43NSAxMzUuNzUgMTYzLjc1IDE2NS43NSAxMzMuNSAxMDUuNzUgMTUwLjc1Ii8+PHBvbHlnb24gZmlsbD0iI0U0NzYxQiIgcG9pbnRzPSIxNjUuNzUgMTMzLjUgMTM1Ljc1IDE2My43NSAxODAuNzUgMTIwLjc1Ii8+PHBvbHlnb24gZmlsbD0iI0U0NzYxQiIgcG9pbnRzPSI0Ni43NSAxMzMuNSA3Ni4yNSAxNjMuNzUgMzEuNzUgMTIwLjc1Ii8+PHBvbHlnb24gZmlsbD0iI0Y2ODUxQiIgcG9pbnRzPSIzMS43NSAxMjAuNzUgNzYuMjUgMTUwLjc1IDQ2Ljc1IDEzMy41Ii8+PHBvbHlnb24gZmlsbD0iI0Y2ODUxQiIgcG9pbnRzPSIxODAuNzUgMTIwLjc1IDEwNS43NSAxNTAuNzUgMTY1Ljc1IDEzMy41Ii8+PHBvbHlnb24gZmlsbD0iI0U0NzYxQiIgcG9pbnRzPSI3Ni4yNSAxNTAuNzUgMzEuNzUgMTIwLjc1IDQ2Ljc1IDEwNS43NSIvPjxwb2x5Z29uIGZpbGw9IiNFNDc2MUIiIHBvaW50cz0iMTA1Ljc1IDE1MC43NSAxODAuNzUgMTIwLjc1IDE2NS43NSAxMDUuNzUiLz48cG9seWdvbiBmaWxsPSIjRjY4NTFCIiBwb2ludHM9IjQ2Ljc1IDEwNS43NSA3Ni4yNSAxNTAuNzUgNjkuNzUgMTE3Ljc1Ii8+PHBvbHlnb24gZmlsbD0iI0Y2ODUxQiIgcG9pbnRzPSIxNjUuNzUgMTA1Ljc1IDEwNS43NSAxNTAuNzUgMTQyLjI1IDExNy43NSIvPjxwb2x5Z29uIGZpbGw9IiNFMjc2MUIiIHBvaW50cz0iNjkuNzUgMTE3Ljc1IDc2LjI1IDE1MC43NSAxMDUuNzUgMTUwLjc1IDE0Mi4yNSAxMTcuNzUgMTIxLjI1IDg3LjI1IDkxLjI1IDg3LjI1Ii8+PHBvbHlnb24gZmlsbD0iI0Q3QzFCMyIgcG9pbnRzPSI0Ni43NSAxMDUuNzUgNjkuNzUgMTE3Ljc1IDkxLjI1IDg3LjI1Ii8+PHBvbHlnb24gZmlsbD0iI0Q3QzFCMyIgcG9pbnRzPSIxNjUuNzUgMTA1Ljc1IDE0Mi4yNSAxMTcuNzUgMTIxLjI1IDg3LjI1Ii8+PHBvbHlnb24gZmlsbD0iIzIzMzQ0NyIgcG9pbnRzPSI5MS4yNSA4Ny4yNSA2OS43NSAxMTcuNzUgODYuMjUgMTA4Ljc1Ii8+PHBvbHlnb24gZmlsbD0iIzIzMzQ0NyIgcG9pbnRzPSIxMjEuMjUgODcuMjUgMTQyLjI1IDExNy43NSAxMjYuNzUgMTA4Ljc1Ii8+PHBvbHlnb24gZmlsbD0iI0Y2ODUxQiIgcG9pbnRzPSI0Ni43NSAxMDUuNzUgOTEuMjUgODcuMjUgNzYuMjUgNzEuMjUiLz48cG9seWdvbiBmaWxsPSIjRTQ3NjFCIiBwb2ludHM9IjkxLjI1IDg3LjI1IDc2LjI1IDcxLjI1IDEwNi43NSAzOS43NSIvPjxwb2x5Z29uIGZpbGw9IiNGNjg1MUIiIHBvaW50cz0iMTY1Ljc1IDEwNS43NSAxMjEuMjUgODcuMjUgMTM1Ljc1IDcxLjI1Ii8+PHBvbHlnb24gZmlsbD0iI0U0NzYxQiIgcG9pbnRzPSIxMjEuMjUgODcuMjUgMTM1Ljc1IDcxLjI1IDEwNi43NSAzOS43NSIvPjxwb2x5Z29uIGZpbGw9IiNDRDYxMTYiIHBvaW50cz0iNzYuMjUgNzEuMjUgNDYuNzUgMTA1Ljc1IDMxLjc1IDQ3LjI1Ii8+PHBvbHlnb24gZmlsbD0iI0NENjExNiIgcG9pbnRzPSIxMzUuNzUgNzEuMjUgMTY1Ljc1IDEwNS43NSAxODAuNzUgNDcuMjUiLz48cG9seWdvbiBmaWxsPSIjRTQ3NjFCIiBwb2ludHM9IjMxLjc1IDQ3LjI1IDc2LjI1IDcxLjI1IDcxLjI1IDUzLjI1Ii8+PHBvbHlnb24gZmlsbD0iI0U0NzYxQiIgcG9pbnRzPSIxODAuNzUgNDcuMjUgMTM1Ljc1IDcxLjI1IDE0MS43NSA1My4yNSIvPjxwb2x5Z29uIGZpbGw9IiNGNjg1MUIiIHBvaW50cz0iMzEuNzUgNDcuMjUgNzEuMjUgNTMuMjUgODAuMjUgMzMuNzUiLz48cG9seWdvbiBmaWxsPSIjRjY4NTFCIiBwb2ludHM9IjE4MC43NSA0Ny4yNSAxNDEuNzUgNTMuMjUgMTMxLjI1IDMzLjc1Ii8+PHBvbHlnb24gZmlsbD0iI0NENjExNiIgcG9pbnRzPSI4MC4yNSAzMy43NSAxMDYuNzUgMzkuNzUgNzYuMjUgNzEuMjUgNzEuMjUgNTMuMjUiLz48cG9seWdvbiBmaWxsPSIjQ0Q2MTE2IiBwb2ludHM9IjEzMS4yNSAzMy43NSAxMDYuNzUgMzkuNzUgMTM1Ljc1IDcxLjI1IDE0MS43NSA1My4yNSIvPjxwb2x5Z29uIGZpbGw9IiNGNjg1MUIiIHBvaW50cz0iODAuMjUgMzMuNzUgMTA2Ljc1IDM5Ljc1IDEwNi43NSA2LjI1Ii8+PHBvbHlnb24gZmlsbD0iI0Y2ODUxQiIgcG9pbnRzPSIxMzEuMjUgMzMuNzUgMTA2Ljc1IDM5Ljc1IDEwNi43NSA2LjI1Ii8+PHBvbHlnb24gZmlsbD0iI0U0NzYxQiIgcG9pbnRzPSIzMS43NSA0Ny4yNSA4MC4yNSAzMy43NSAxMDYuNzUgNi4yNSIvPjxwb2x5Z29uIGZpbGw9IiNFNDc2MUIiIHBvaW50cz0iMTgwLjc1IDQ3LjI1IDEzMS4yNSAzMy43NSAxMDYuNzUgNi4yNSIvPjwvZz48L3N2Zz4=";

// Coinbase icon
const COINBASE_ICON = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHJ4PSIxMiIgZmlsbD0iIzAwNTJGRiIvPjxwYXRoIGQ9Ik0yNCAxMGMtNy43MzIgMC0xNCAxLjI2OC0xNCAxNHM2LjI2OCAxNCAxNCAxNCAxNC02LjI2OCAxNC0xNC02LjI2OC0xNC0xNC0xNHptLTUuNSAxN2EyLjUgMi41IDAgMCAxIDAtNWg0YTEuNSAxLjUgMCAwIDEgMCAzaC00YTIuNSAyLjUgMCAwIDEgMCA1aC0yYTIuNSAyLjUgMCAwIDEgMi0yLjQ1eiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==";

function makeMetaMaskConfig() {
  return createConfig({
    chains: [nearTestnet, nearMainnet],
    connectors: [injected({ target: "metaMask" })],
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
  wagmiConfig: ReturnType<typeof createConfig>
) {
  return () => {
    const factory = setupEthereumWallets({
      wagmiConfig: wagmiConfig as any,
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
