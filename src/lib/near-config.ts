export type NearNetworkConfig = {
  networkId: "testnet" | "mainnet";
  nodeUrl: string;
  walletUrl: string;
  helperUrl: string;
  explorerUrl: string;
  mpcContractId: string;
};

export const nearTestnet: NearNetworkConfig = {
  networkId: "testnet",
  nodeUrl: "https://rpc.testnet.near.org",
  walletUrl: "https://testnet.mynearwallet.com",
  helperUrl: "https://helper.testnet.near.org",
  explorerUrl: "https://testnet.nearblocks.io",
  mpcContractId: "v1.signer-prod.testnet",
};

export const nearMainnet: NearNetworkConfig = {
  networkId: "mainnet",
  nodeUrl: "https://rpc.mainnet.near.org",
  walletUrl: "https://app.mynearwallet.com",
  helperUrl: "https://helper.mainnet.near.org",
  explorerUrl: "https://nearblocks.io",
  mpcContractId: "v1.signer",
};

const NEAR_NETWORK = (process.env.NEXT_PUBLIC_NEAR_NETWORK || "testnet") as
  | "testnet"
  | "mainnet";

export const nearConfig =
  NEAR_NETWORK === "mainnet" ? nearMainnet : nearTestnet;

export const NEAR_CONTRACT_ID =
  process.env.NEXT_PUBLIC_NEAR_CONTRACT_ID || "luckygoal.testnet";
