import { createPublicClient, http, parseEther, encodeFunctionData, type Hex } from "viem";
import { avalancheFuji } from "viem/chains";
import { sendContractCall } from "./chain-signatures";
import type { ChainKey } from "./chains";

const ESCROW_ADDRESS = (process.env.NEXT_PUBLIC_ESCROW_CONTRACT || "") as Hex;
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const DEFAULT_CHAIN: ChainKey = "avalancheFuji";

const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: http(),
});

const ESCROW_ABI = [
  {
    name: "createTournament",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "code", type: "string" }],
    outputs: [],
  },
  {
    name: "claimPrize",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "code", type: "string" },
      { name: "winner", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "getTournament",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "code", type: "string" }],
    outputs: [
      { name: "host", type: "address" },
      { name: "prize", type: "uint256" },
      { name: "claimed", type: "bool" },
    ],
  },
] as const;

export function getCreateTournamentData(code: string, avaxAmount: string) {
  return {
    to: ESCROW_ADDRESS,
    data: encodeFunctionData({
      abi: ESCROW_ABI,
      functionName: "createTournament",
      args: [code],
    }),
    value: parseEther(avaxAmount),
  };
}

export async function prepareCreateTournament(
  code: string,
  avaxAmount: string,
  nearAccountId?: string,
  signerAccount?: {
    accountId: string;
    signAndSendTransactions: (tx: { transactions: any[] }) => Promise<any[]>;
  }
): Promise<string> {
  const txData = getCreateTournamentData(code, avaxAmount);

  if (DEMO_MODE) {
    const fakeTx = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    console.log(`[escrow] DEMO_MODE: createTournament(${code}, ${avaxAmount} AVAX) -> ${fakeTx}`);
    return fakeTx;
  }

  if (!nearAccountId || !signerAccount) {
    console.warn("[escrow] prepareCreateTournament: no signer provided, skipping");
    return "";
  }

  return sendContractCall(
    nearAccountId,
    signerAccount,
    DEFAULT_CHAIN,
    ESCROW_ADDRESS,
    txData.data,
    avaxAmount
  );
}

export function getClaimPrizeData(code: string, winnerAddress: string) {
  return {
    to: ESCROW_ADDRESS,
    data: encodeFunctionData({
      abi: ESCROW_ABI,
      functionName: "claimPrize",
      args: [code, winnerAddress as Hex],
    }),
  };
}

export async function prepareClaimPrize(
  code: string,
  winnerAddress: string,
  nearAccountId?: string,
  signerAccount?: {
    accountId: string;
    signAndSendTransactions: (tx: { transactions: any[] }) => Promise<any[]>;
  }
): Promise<string> {
  const txData = getClaimPrizeData(code, winnerAddress);

  if (DEMO_MODE) {
    const fakeTx = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    console.log(`[escrow] DEMO_MODE: claimPrize(${code}, ${winnerAddress}) -> ${fakeTx}`);
    return fakeTx;
  }

  if (!nearAccountId || !signerAccount) {
    console.warn("[escrow] prepareClaimPrize: no signer provided, skipping");
    return "";
  }

  return sendContractCall(
    nearAccountId,
    signerAccount,
    DEFAULT_CHAIN,
    ESCROW_ADDRESS,
    txData.data
  );
}

export async function getEscrowTournament(code: string) {
  if (!ESCROW_ADDRESS) {
    throw new Error("Missing NEXT_PUBLIC_ESCROW_CONTRACT env var");
  }
  const result = await publicClient.readContract({
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    functionName: "getTournament",
    args: [code],
  });
  return {
    host: result[0],
    prize: result[1],
    claimed: result[2],
  };
}
