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
  passkey_on_join: boolean;
  goalkeeper_logo: string | null;
  question_started_at: string | null;
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
  first_match: { label: "Rookie", icon: "🎮", description: "Play your first tournament" },
  first_win: { label: "Champion", icon: "🏆", description: "Win your first tournament" },
  first_goal: { label: "Scorer", icon: "⚽", description: "Score your first goal" },
  streak_3: { label: "On Fire", icon: "🔥", description: "3 correct answers in a row" },
  perfect_round: { label: "Perfect", icon: "💎", description: "All correct in a tournament" },
  five_games: { label: "Veteran", icon: "⭐", description: "Play 5 tournaments" },
};

export const TOURNAMENT_CODE_LENGTH = 6;

export type MedalType = "og_participant" | "champion" | "sharpshooter" | "scholar" | "social";

export interface Medal {
  id: string;
  player_id: string;
  medal_type: MedalType;
  tournament_code: string;
  earned_at: string;
}

export const MEDAL_META: Record<MedalType, { label: string; icon: string; description: string }> = {
  og_participant: { label: "OG", icon: "🎖️", description: "Participated in a tournament" },
  champion: { label: "Champion", icon: "🏅", description: "Won a tournament" },
  sharpshooter: { label: "Sharpshooter", icon: "🎯", description: "Scored 3+ goals in one tournament" },
  scholar: { label: "Scholar", icon: "📚", description: "All answers correct in a tournament" },
  social: { label: "Social", icon: "🤝", description: "Played in a tournament with 5+ players" },
};
