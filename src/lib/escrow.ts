import { getContract, prepareContractCall, readContract, toWei } from "thirdweb";
import { avalancheFuji } from "thirdweb/chains";
import { client } from "./thirdweb";

const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_CONTRACT || "";

export function getEscrowContract() {
  if (!ESCROW_ADDRESS) {
    throw new Error("Missing NEXT_PUBLIC_ESCROW_CONTRACT env var");
  }
  return getContract({
    client,
    chain: avalancheFuji,
    address: ESCROW_ADDRESS,
  });
}

export function prepareCreateTournament(code: string, avaxAmount: string) {
  const contract = getEscrowContract();
  return prepareContractCall({
    contract,
    method: "function createTournament(string code) payable",
    params: [code],
    value: toWei(avaxAmount),
  });
}

export function prepareClaimPrize(code: string, winnerAddress: string) {
  const contract = getEscrowContract();
  return prepareContractCall({
    contract,
    method: "function claimPrize(string code, address winner)",
    params: [code, winnerAddress],
  });
}

export async function getEscrowTournament(code: string) {
  const contract = getEscrowContract();
  const [host, prize, claimed] = await readContract({
    contract,
    method: "function getTournament(string code) view returns (address host, uint256 prize, bool claimed)",
    params: [code],
  });
  return { host, prize, claimed };
}
