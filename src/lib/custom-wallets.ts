/**
 * Custom wallet module factories that wrap @near-wallet-selector/ethereum-wallets
 * to show MetaMask and Coinbase Wallet as individual entries in the modal.
 *
 * Root cause of "MetaMask opens Rainbow" bug:
 * setupEthereumWallets always calls `wagmiCore.injected()` to connect (ignoring
 * the connectors in the wagmiConfig). We fix this by patching the wagmiCore
 * object we pass so that `injected()` returns the specific connector we want.
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

// Official icons — hosted on reliable public CDNs
const METAMASK_ICON =
  "https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/SVG_MetaMask_Icon_Color.svg";
const COINBASE_ICON =
  "https://raw.githubusercontent.com/coinbase/coinbase-wallet-sdk/master/packages/wallet-sdk/assets/coinbase-wallet-logo.png";

const NEAR_TRANSPORTS = {
  [nearTestnet.id]: http("https://eth-rpc.testnet.near.org"),
  [nearMainnet.id]: http("https://eth-rpc.mainnet.near.org"),
};

const metaMaskConnector = metaMask();
const coinbaseConnector = coinbaseWallet({ appName: "Lucky Goal" });

function makeMetaMaskConfig() {
  return createConfig({
    chains: [nearTestnet, nearMainnet],
    connectors: [metaMaskConnector],
    transports: NEAR_TRANSPORTS,
  });
}

function makeCoinbaseConfig() {
  return createConfig({
    chains: [nearTestnet, nearMainnet],
    connectors: [coinbaseConnector],
    transports: NEAR_TRANSPORTS,
  });
}

/**
 * Creates a wallet module factory that wraps ethereum-wallets but:
 * 1. Overrides id/name/iconUrl for correct display
 * 2. Patches wagmiCore.injected to return the specific connector,
 *    so the plugin connects to the right wallet instead of window.ethereum
 */
function createCustomEthWallet(
  id: string,
  name: string,
  iconUrl: string,
  wagmiCfg: ReturnType<typeof createConfig>,
  specificConnector: ReturnType<typeof metaMask> | ReturnType<typeof coinbaseWallet>
) {
  return () => {
    // Patch wagmiCore so setupEthereumWallets uses our specific connector
    // instead of the generic wagmiCore.injected() which picks up window.ethereum
    const patchedWagmiCore = {
      ...wagmiCore,
      injected: () => specificConnector,
    };

    const factory = setupEthereumWallets({
      wagmiConfig: wagmiCfg as any,
      wagmiCore: patchedWagmiCore as any,
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
    makeMetaMaskConfig(),
    metaMaskConnector
  );
}

export function setupCoinbaseWalletNear() {
  return createCustomEthWallet(
    "coinbase-wallet",
    "Coinbase Wallet",
    COINBASE_ICON,
    makeCoinbaseConfig(),
    coinbaseConnector
  );
}
