import { supabase } from "./supabase";

export async function registerWallet(
  walletAddress: string,
  nickname: string,
  avatar: string,
  createdVia: "passkey" | "external",
  tournamentCode: string
) {
  const { error } = await supabase.from("wallet_registry").insert({
    wallet_address: walletAddress,
    nickname,
    avatar,
    created_via: createdVia,
    tournament_code: tournamentCode,
  });

  if (error) {
    console.error("Failed to register wallet:", error);
  }
}
