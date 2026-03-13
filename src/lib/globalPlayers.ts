import { supabase } from "./supabase";
import type { GlobalPlayer, Achievement, AchievementType, Medal, MedalType } from "@/types/game";

// ─── Leaderboard ───

export type LeaderboardEntry = GlobalPlayer & { achievements: Achievement[]; medals: Medal[] };

export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const { data } = await supabase
    .from("global_players")
    .select("*, achievements(*), medals(*)")
    .order("total_xp", { ascending: false })
    .limit(limit);

  return data || [];
}

// ─── Get medals for a player ───

export async function getMedalsForPlayer(globalPlayerId: string): Promise<Medal[]> {
  const { data } = await supabase
    .from("medals")
    .select()
    .eq("player_id", globalPlayerId);
  return data || [];
}

// ─── Upsert global player (find or create by nickname) ───

async function upsertGlobalPlayer(
  nickname: string,
  avatar: string,
  walletAddress: string | null
): Promise<GlobalPlayer> {
  // Try to find existing player by nickname
  const { data: existing } = await supabase
    .from("global_players")
    .select()
    .eq("nickname", nickname)
    .maybeSingle();

  if (existing) {
    // Update avatar/wallet if changed
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (avatar) updates.avatar = avatar;
    if (walletAddress) updates.wallet_address = walletAddress;

    const { data } = await supabase
      .from("global_players")
      .update(updates)
      .eq("id", existing.id)
      .select()
      .single();

    return data || existing;
  }

  // Create new
  const { data, error } = await supabase
    .from("global_players")
    .insert({ nickname, avatar, wallet_address: walletAddress })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Process all players after tournament ends ───

export async function processPostTournament(tournamentId: string) {
  // Fetch tournament for code
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("code")
    .eq("id", tournamentId)
    .maybeSingle();

  const tournamentCode = tournament?.code ?? tournamentId;

  // Fetch all players in this tournament
  const { data: players } = await supabase
    .from("players")
    .select()
    .eq("tournament_id", tournamentId)
    .order("score", { ascending: false });

  if (!players || players.length === 0) return;

  const playerCount = players.length;

  // Fetch all answers for this tournament
  const { data: answers } = await supabase
    .from("answers")
    .select()
    .eq("tournament_id", tournamentId)
    .order("question_index", { ascending: true });

  for (const player of players) {
    try {
      // Upsert global player
      const globalPlayer = await upsertGlobalPlayer(
        player.nickname,
        player.avatar,
        player.wallet_address
      );

      // Update stats
      await supabase
        .from("global_players")
        .update({
          total_xp: globalPlayer.total_xp + player.score,
          total_games: globalPlayer.total_games + 1,
          total_wins: globalPlayer.total_wins + (player.is_winner ? 1 : 0),
          total_goals: globalPlayer.total_goals + player.goals,
          updated_at: new Date().toISOString(),
        })
        .eq("id", globalPlayer.id);

      // Evaluate achievements and medals
      const playerAnswers = (answers || []).filter((a) => a.player_id === player.id);
      await evaluateAchievements(globalPlayer, player, playerAnswers);
      await evaluateMedals(globalPlayer, player, playerAnswers, tournamentCode, playerCount);
    } catch (err) {
      console.error(`Error processing player ${player.nickname}:`, err);
    }
  }
}

// ─── Achievement evaluation ───

async function evaluateAchievements(
  globalPlayer: GlobalPlayer,
  tournamentPlayer: { score: number; goals: number; is_winner: boolean },
  answers: { is_correct: boolean; question_index: number }[]
) {
  const newAchievements: AchievementType[] = [];

  // first_match: first tournament (total_games was 0 before this one, now updated to 1)
  if (globalPlayer.total_games === 0) {
    newAchievements.push("first_match");
  }

  // first_win
  if (tournamentPlayer.is_winner && globalPlayer.total_wins === 0) {
    newAchievements.push("first_win");
  }

  // first_goal
  if (tournamentPlayer.goals > 0 && globalPlayer.total_goals === 0) {
    newAchievements.push("first_goal");
  }

  // five_games (total_games was N before, now N+1)
  if (globalPlayer.total_games + 1 >= 5) {
    newAchievements.push("five_games");
  }

  // streak_3: 3 consecutive correct answers
  if (answers.length >= 3) {
    let streak = 0;
    for (const a of answers) {
      streak = a.is_correct ? streak + 1 : 0;
      if (streak >= 3) {
        newAchievements.push("streak_3");
        break;
      }
    }
  }

  // perfect_round: all answers correct
  if (answers.length > 0 && answers.every((a) => a.is_correct)) {
    newAchievements.push("perfect_round");
  }

  // Insert achievements (ignore duplicates via ON CONFLICT)
  for (const type of newAchievements) {
    await supabase
      .from("achievements")
      .upsert(
        { player_id: globalPlayer.id, achievement_type: type },
        { onConflict: "player_id,achievement_type" }
      )
      .select();
  }
}

// ─── Medal evaluation ───

async function evaluateMedals(
  globalPlayer: GlobalPlayer,
  tournamentPlayer: { score: number; goals: number; is_winner: boolean },
  answers: { is_correct: boolean }[],
  tournamentCode: string,
  playerCount: number
) {
  const newMedals: MedalType[] = [];

  // og_participant — always
  newMedals.push("og_participant");

  // champion — won
  if (tournamentPlayer.is_winner) newMedals.push("champion");

  // sharpshooter — 3+ goals
  if (tournamentPlayer.goals >= 3) newMedals.push("sharpshooter");

  // scholar — all correct
  if (answers.length > 0 && answers.every((a) => a.is_correct)) newMedals.push("scholar");

  // social — 5+ players in tournament
  if (playerCount >= 5) newMedals.push("social");

  for (const type of newMedals) {
    await supabase
      .from("medals")
      .upsert(
        { player_id: globalPlayer.id, medal_type: type, tournament_code: tournamentCode },
        { onConflict: "player_id,medal_type,tournament_code" }
      )
      .select();
  }
}
