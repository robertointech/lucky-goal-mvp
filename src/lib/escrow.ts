import { createPublicClient, http, parseEther, encodeFunctionData, type Hex } from "viem";
import { avalancheFuji } from "viem/chains";

const ESCROW_ADDRESS = (process.env.NEXT_PUBLIC_ESCROW_CONTRACT || "") as Hex;

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

// TODO: Wire to NEAR chain signatures for actual on-chain execution
export async function prepareCreateTournament(code: string, avaxAmount: string) {
  const txData = getCreateTournamentData(code, avaxAmount);
  console.warn("[escrow] prepareCreateTournament: TX prepared but not sent (pending chain signature integration)", txData);
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

// TODO: Wire to NEAR chain signatures for actual on-chain execution
export async function prepareClaimPrize(code: string, winnerAddress: string) {
  const txData = getClaimPrizeData(code, winnerAddress);
  console.warn("[escrow] prepareClaimPrize: TX prepared but not sent (pending chain signature integration)", txData);
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
