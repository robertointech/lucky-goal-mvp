import { createPublicClient, http, parseEther, encodeFunctionData, type Hex, type PublicClient } from "viem";
import { avalancheFuji, arbitrumSepolia } from "viem/chains";
import type { ChainKey } from "./chains";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const MPC_CONTRACT_ID = process.env.NEXT_PUBLIC_MPC_CONTRACT_ID || "v1.signer-prod.testnet";
const NEAR_NETWORK_ID = (process.env.NEXT_PUBLIC_NEAR_NETWORK || "testnet") as "testnet" | "mainnet";

// Derivation paths per chain
const DERIVATION_PATHS: Record<string, string> = {
  avalancheFuji: "avalanche,1",
  avalancheMainnet: "avalanche,1",
  arbitrumSepolia: "arbitrum,1",
  arbitrumOne: "arbitrum,1",
};

// Viem public clients per EVM chain
const publicClients: Record<string, PublicClient> = {
  avalancheFuji: createPublicClient({ chain: avalancheFuji, transport: http() }),
  arbitrumSepolia: createPublicClient({ chain: arbitrumSepolia, transport: http() }),
};

function getPublicClient(chainKey: string): PublicClient {
  const client = publicClients[chainKey];
  if (!client) throw new Error(`No public client for chain: ${chainKey}`);
  return client;
}

function getDerivationPath(chainKey: string): string {
  const path = DERIVATION_PATHS[chainKey];
  if (!path) throw new Error(`No derivation path for chain: ${chainKey}`);
  return path;
}

function fakeTxHash(): string {
  return "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

/**
 * Initialize chain signature components.
 * Returns the ChainSignatureContract and EVM adapter for the given chain.
 */
export async function initChainSignatures(chainKey: ChainKey) {
  if (DEMO_MODE) {
    console.log(`[chain-sig] DEMO_MODE: skipping init for ${chainKey}`);
    return { contract: null, evmChain: null };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chainsig = await import("chainsig.js") as any;
  const ChainSignatureContract = chainsig.contracts?.near?.ChainSignatureContract ?? chainsig.ChainSignatureContract;
  const EVM = chainsig.chainAdapters?.evm?.EVM ?? chainsig.EVM;

  const contract = new ChainSignatureContract({
    contractId: MPC_CONTRACT_ID,
    networkId: NEAR_NETWORK_ID,
  });

  const evmChain = new EVM({
    publicClient: getPublicClient(chainKey),
    contract,
  });

  return { contract, evmChain };
}

/**
 * Derive the EVM address for a NEAR account on a specific chain.
 */
export async function deriveEvmAddress(
  nearAccountId: string,
  chainKey: ChainKey
): Promise<{ address: string; publicKey: string }> {
  if (DEMO_MODE) {
    // Deterministic fake address from account ID
    const hash = nearAccountId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const fakeAddr = "0x" + hash.toString(16).padStart(40, "0");
    console.log(`[chain-sig] DEMO_MODE: derived address ${fakeAddr} for ${nearAccountId} on ${chainKey}`);
    return { address: fakeAddr, publicKey: "0x04demo" };
  }

  const { evmChain } = await initChainSignatures(chainKey);
  if (!evmChain) throw new Error("Failed to init chain signatures");

  const path = getDerivationPath(chainKey);
  const result = await evmChain.deriveAddressAndPublicKey(nearAccountId, path);
  return { address: result.address, publicKey: result.publicKey };
}

/**
 * Send a native token transfer (AVAX, ETH) on an EVM chain via MPC signing.
 */
export async function sendNativeTransfer(
  nearAccountId: string,
  signerAccount: {
    accountId: string;
    signAndSendTransactions: (tx: { transactions: any[] }) => Promise<any[]>;
  },
  chainKey: ChainKey,
  to: string,
  amountInEther: string
): Promise<string> {
  if (DEMO_MODE) {
    const txHash = fakeTxHash();
    console.log(`[chain-sig] DEMO_MODE: sendNativeTransfer ${amountInEther} to ${to} on ${chainKey} -> ${txHash}`);
    return txHash;
  }

  const { contract, evmChain } = await initChainSignatures(chainKey);
  if (!contract || !evmChain) throw new Error("Failed to init chain signatures");

  const path = getDerivationPath(chainKey);
  const { address } = await evmChain.deriveAddressAndPublicKey(nearAccountId, path);

  // Prepare transaction
  const { transaction, hashesToSign } = await evmChain.prepareTransactionForSigning({
    from: address as Hex,
    to: to as Hex,
    value: parseEther(amountInEther),
  });

  // Sign with MPC
  const signatures = await contract.sign({
    payloads: hashesToSign,
    path,
    keyType: "Ecdsa",
    signerAccount,
  });

  // Finalize and broadcast
  const signedTx = evmChain.finalizeTransactionSigning({
    transaction,
    rsvSignatures: signatures,
  });

  const { hash } = await evmChain.broadcastTx(signedTx);
  return hash;
}

/**
 * Send a contract call on an EVM chain via MPC signing.
 */
export async function sendContractCall(
  nearAccountId: string,
  signerAccount: {
    accountId: string;
    signAndSendTransactions: (tx: { transactions: any[] }) => Promise<any[]>;
  },
  chainKey: ChainKey,
  contractAddress: string,
  data: Hex,
  value?: string
): Promise<string> {
  if (DEMO_MODE) {
    const txHash = fakeTxHash();
    console.log(`[chain-sig] DEMO_MODE: sendContractCall to ${contractAddress} on ${chainKey} -> ${txHash}`);
    return txHash;
  }

  const { contract, evmChain } = await initChainSignatures(chainKey);
  if (!contract || !evmChain) throw new Error("Failed to init chain signatures");

  const path = getDerivationPath(chainKey);
  const { address } = await evmChain.deriveAddressAndPublicKey(nearAccountId, path);

  const { transaction, hashesToSign } = await evmChain.prepareTransactionForSigning({
    from: address as Hex,
    to: contractAddress as Hex,
    data,
    ...(value ? { value: parseEther(value) } : {}),
  });

  const signatures = await contract.sign({
    payloads: hashesToSign,
    path,
    keyType: "Ecdsa",
    signerAccount,
  });

  const signedTx = evmChain.finalizeTransactionSigning({
    transaction,
    rsvSignatures: signatures,
  });

  const { hash } = await evmChain.broadcastTx(signedTx);
  return hash;
}
