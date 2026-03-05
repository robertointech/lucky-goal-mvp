"use client";

import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import Login from "@/components/Login";
import Home from "@/components/Home";
import Trivia from "@/components/Trivia";
import PenaltyKick from "@/components/PenaltyKick";
import Score from "@/components/Score";

type GameState = "home" | "trivia" | "penalty" | "score";

export interface GameData {
  currentQuestion: number;
  correctAnswers: number;
  totalQuestions: number;
  goals: number;
  penalties: number;
  lastAnswerCorrect: boolean;
}

export default function Page() {
  const account = useActiveAccount();
  const [gameState, setGameState] = useState<GameState>("home");
  const [gameData, setGameData] = useState<GameData>({
    currentQuestion: 0,
    correctAnswers: 0,
    totalQuestions: 5,
    goals: 0,
    penalties: 0,
    lastAnswerCorrect: false,
  });

  // If not logged in, show login screen
  if (!account) {
    return <Login />;
  }

  // Handle game flow
  const startGame = () => {
    setGameData({
      currentQuestion: 0,
      correctAnswers: 0,
      totalQuestions: 5,
      goals: 0,
      penalties: 0,
      lastAnswerCorrect: false,
    });
    setGameState("trivia");
  };

  const handleAnswerSubmit = (isCorrect: boolean) => {
    setGameData((prev) => ({
      ...prev,
      correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
      lastAnswerCorrect: isCorrect,
    }));
    // Go to penalty kick
    setGameState("penalty");
  };

  const handlePenaltyResult = (scored: boolean) => {
    setGameData((prev) => ({
      ...prev,
      goals: scored ? prev.goals + 1 : prev.goals,
      penalties: prev.penalties + 1,
      currentQuestion: prev.currentQuestion + 1,
    }));

    // Check if game is over
    if (gameData.currentQuestion + 1 >= gameData.totalQuestions) {
      setGameState("score");
    } else {
      setGameState("trivia");
    }
  };

  const handlePlayAgain = () => {
    startGame();
  };

  const handleGoHome = () => {
    setGameState("home");
  };

  // Render based on game state
  return (
    <main className="min-h-screen flex flex-col">
      {gameState === "home" && (
        <Home account={account} onStartGame={startGame} />
      )}

      {gameState === "trivia" && (
        <Trivia
          questionIndex={gameData.currentQuestion}
          onAnswer={handleAnswerSubmit}
        />
      )}

      {gameState === "penalty" && (
        <PenaltyKick
          wasCorrect={gameData.lastAnswerCorrect}
          onResult={handlePenaltyResult}
        />
      )}

      {gameState === "score" && (
        <Score
          goals={gameData.goals}
          totalPenalties={gameData.penalties}
          correctAnswers={gameData.correctAnswers}
          totalQuestions={gameData.totalQuestions}
          onPlayAgain={handlePlayAgain}
          onGoHome={handleGoHome}
        />
      )}
    </main>
  );
}
