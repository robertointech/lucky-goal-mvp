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
  timeLimit: number; // seconds
}

export const AVATARS = ["⚽", "🏆", "🦁", "🐯", "🦅", "🐉", "🔥", "⭐"] as const;
export type Avatar = (typeof AVATARS)[number];

export const TOURNAMENT_CODE_LENGTH = 6;
