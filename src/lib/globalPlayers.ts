import { supabase } from "./supabase";
import type { GlobalPlayer, Achievement, AchievementType } from "@/types/game";

// ─── Leaderboard ───

export async function getLeaderboard(limit = 10): Promise<(GlobalPlayer & { achievements: Achievement[] })[]> {
  const { data } = await supabase
    .from("global_players")
    .select("*, achievements(*)")
    .order("total_xp", { ascending: false })
    .limit(limit);

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
  // Fetch all players in this tournament
  const { data: players } = await supabase
    .from("players")
    .select()
    .eq("tournament_id", tournamentId)
    .order("score", { ascending: false });

  if (!players || players.length === 0) return;

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

      // Evaluate achievements
      const playerAnswers = (answers || []).filter((a) => a.player_id === player.id);
      await evaluateAchievements(globalPlayer, player, playerAnswers);
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
