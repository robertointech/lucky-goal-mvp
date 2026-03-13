import { supabase } from "./supabase";

export interface Message {
  id: string;
  tournament_code: string;
  sender_wallet: string;
  recipient_wallet: string | null;
  message_text: string;
  read: boolean;
  created_at: string;
}

export async function sendMessage(
  tournamentCode: string,
  senderWallet: string,
  recipientWallet: string | null,
  messageText: string
) {
  const { error } = await supabase.from("messages").insert({
    tournament_code: tournamentCode,
    sender_wallet: senderWallet,
    recipient_wallet: recipientWallet,
    message_text: messageText,
  });
  if (error) throw error;
}

export async function sendMessageToAll(
  tournamentCode: string,
  senderWallet: string,
  messageText: string,
  recipientWallets: string[]
) {
  const rows = recipientWallets.map((w) => ({
    tournament_code: tournamentCode,
    sender_wallet: senderWallet,
    recipient_wallet: w,
    message_text: messageText,
  }));
  const { error } = await supabase.from("messages").insert(rows);
  if (error) throw error;
}

export async function getInboxMessages(walletAddress: string): Promise<Message[]> {
  const { data } = await supabase
    .from("messages")
    .select()
    .eq("recipient_wallet", walletAddress)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getUnreadCount(walletAddress: string): Promise<number> {
  const { count } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("recipient_wallet", walletAddress)
    .eq("read", false);
  return count || 0;
}

export async function markAsRead(messageId: string) {
  await supabase.from("messages").update({ read: true }).eq("id", messageId);
}

export async function markAllAsRead(walletAddress: string) {
  await supabase
    .from("messages")
    .update({ read: true })
    .eq("recipient_wallet", walletAddress)
    .eq("read", false);
}
