import { supabase } from "./supabase";
import { QUESTIONS_PER_GAME } from "./questions";
import type { Tournament, Player, GameStatus, Question } from "@/types/game";
import { TOURNAMENT_CODE_LENGTH } from "@/types/game";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < TOURNAMENT_CODE_LENGTH; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createTournament(
  hostWallet: string,
  prizeAmount: number,
  customQuestions?: Question[] | null,
  passkeyOnJoin?: boolean,
  goalkeeperLogo?: string | null
): Promise<Tournament> {
  const code = generateCode();
  const insert: Record<string, unknown> = {
    code,
    host_wallet: hostWallet,
    prize_amount: prizeAmount,
    passkey_on_join: passkeyOnJoin ?? false,
  };
  if (customQuestions && customQuestions.length > 0) {
    insert.custom_questions = customQuestions;
  }
  if (goalkeeperLogo) {
    insert.goalkeeper_logo = goalkeeperLogo;
  }

  const { data, error } = await supabase
    .from("tournaments")
    .insert(insert)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTournament(code: string): Promise<Tournament | null> {
  const { data } = await supabase
    .from("tournaments")
    .select()
    .eq("code", code.toUpperCase())
    .single();
  return data;
}

export async function updateTournamentStatus(tournamentId: string, status: GameStatus, currentQuestion?: number) {
  const update: Record<string, unknown> = { status };
  if (currentQuestion !== undefined) update.current_question = currentQuestion;

  const { error } = await supabase
    .from("tournaments")
    .update(update)
    .eq("id", tournamentId);

  if (error) throw error;
}

export async function joinTournament(tournamentId: string, nickname: string, avatar: string): Promise<Player> {
  const { data, error } = await supabase
    .from("players")
    .insert({ tournament_id: tournamentId, nickname, avatar })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPlayers(tournamentId: string): Promise<Player[]> {
  const { data } = await supabase
    .from("players")
    .select()
    .eq("tournament_id", tournamentId)
    .order("score", { ascending: false });
  return data || [];
}

export async function submitAnswer(
  tournamentId: string,
  playerId: string,
  questionIndex: number,
  selectedIndex: number,
  timeMs: number,
  correctIndex: number
) {
  const isCorrect = selectedIndex === correctIndex;

  // Insert answer
  await supabase.from("answers").insert({
    tournament_id: tournamentId,
    player_id: playerId,
    question_index: questionIndex,
    is_correct: isCorrect,
    time_ms: timeMs,
  });

  // Update player score: correct answer = 100 pts + time bonus (max 100 pts for fast answer)
  if (isCorrect) {
    const timeBonus = Math.max(0, Math.round((1 - timeMs / 20000) * 100));
    const points = 100 + timeBonus;

    const { data: player } = await supabase
      .from("players")
      .select("score")
      .eq("id", playerId)
      .single();

    await supabase
      .from("players")
      .update({ score: (player?.score || 0) + points })
      .eq("id", playerId);
  }

  return isCorrect;
}

export async function recordGoal(playerId: string) {
  const { data: player } = await supabase
    .from("players")
    .select("goals, score")
    .eq("id", playerId)
    .single();

  await supabase
    .from("players")
    .update({
      goals: (player?.goals || 0) + 1,
      score: (player?.score || 0) + 50, // bonus for goal
    })
    .eq("id", playerId);
}

export async function determineWinner(tournamentId: string): Promise<Player | null> {
  const players = await getPlayers(tournamentId);
  if (players.length === 0) return null;

  const winner = players[0]; // already sorted by score desc

  // Mark winner
  await supabase
    .from("players")
    .update({ is_winner: true })
    .eq("id", winner.id);

  await supabase
    .from("tournaments")
    .update({ winner_id: winner.id, status: "finished" as GameStatus })
    .eq("id", tournamentId);

  return winner;
}

export async function setPlayerWallet(playerId: string, walletAddress: string) {
  const { error } = await supabase
    .from("players")
    .update({ wallet_address: walletAddress })
    .eq("id", playerId);

  if (error) throw error;
}

export function getTotalQuestions(): number {
  return QUESTIONS_PER_GAME;
}

export async function getCorrectAnswerCounts(tournamentId: string): Promise<Record<string, number>> {
  const { data } = await supabase
    .from("answers")
    .select("player_id")
    .eq("tournament_id", tournamentId)
    .eq("is_correct", true);

  const counts: Record<string, number> = {};
  (data || []).forEach((a) => {
    counts[a.player_id] = (counts[a.player_id] || 0) + 1;
  });
  return counts;
}
