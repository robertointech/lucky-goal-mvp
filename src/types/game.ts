export type GameStatus =
  | "waiting" // lobby, waiting for players
  | "starting" // countdown before first question
  | "question" // showing trivia question
  | "penalty" // penalty kick phase
  | "results" // showing question results
  | "finished"; // tournament over

export type Direction = "left" | "center" | "right";

export interface Tournament {
  id: string;
  code: string;
  host_wallet: string;
  prize_amount: number;
  status: GameStatus;
  current_question: number;
  winner_id: string | null;
  custom_questions: Question[] | null;
  created_at: string;
}

export interface Player {
  id: string;
  tournament_id: string;
  nickname: string;
  avatar: string;
  score: number;
  goals: number;
  wallet_address: string | null;
  is_winner: boolean;
  created_at: string;
}

export interface Answer {
  id: string;
  tournament_id: string;
  player_id: string;
  question_index: number;
  is_correct: boolean;
  time_ms: number;
  created_at: string;
}

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  timeLimit?: number; // seconds (default 20)
}

export const AVATARS = ["⚽", "🏆", "🦁", "🐯", "🦅", "🐉", "🔥", "⭐"] as const;
export type Avatar = (typeof AVATARS)[number];

export interface GlobalPlayer {
  id: string;
  nickname: string;
  avatar: string;
  total_xp: number;
  total_games: number;
  total_wins: number;
  total_goals: number;
  wallet_address: string | null;
  created_at: string;
  updated_at: string;
}

export type AchievementType =
  | "first_match"
  | "first_win"
  | "first_goal"
  | "streak_3"
  | "perfect_round"
  | "five_games";

export interface Achievement {
  id: string;
  player_id: string;
  achievement_type: AchievementType;
  earned_at: string;
}

export const ACHIEVEMENT_META: Record<AchievementType, { label: string; icon: string; description: string }> = {
  first_match: { label: "Debutante", icon: "🎮", description: "Jugar tu primer torneo" },
  first_win: { label: "Campeón", icon: "🏆", description: "Ganar tu primer torneo" },
  first_goal: { label: "Goleador", icon: "⚽", description: "Meter tu primer gol" },
  streak_3: { label: "En Racha", icon: "🔥", description: "3 respuestas correctas seguidas" },
  perfect_round: { label: "Perfecto", icon: "💎", description: "Todas correctas en un torneo" },
  five_games: { label: "Veterano", icon: "⭐", description: "Jugar 5 torneos" },
};

export const TOURNAMENT_CODE_LENGTH = 6;
