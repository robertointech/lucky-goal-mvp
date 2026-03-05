"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTournament, updateTournamentStatus, determineWinner, getTotalQuestions } from "@/lib/gameLogic";
import { useGameSync } from "@/hooks/useGameSync";
import { useCountdown } from "@/hooks/useCountdown";
import { triviaQuestions } from "@/lib/questions";
import Leaderboard from "@/components/ui/Leaderboard";
import Timer from "@/components/ui/Timer";
import WinnerBanner from "@/components/ui/WinnerBanner";
import type { Tournament, GameStatus } from "@/types/game";

export default function HostGamePage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const [localTournament, setLocalTournament] = useState<Tournament | null>(null);
  const [phase, setPhase] = useState<"question" | "penalty" | "results" | "finished">("question");

  // Load tournament
  useEffect(() => {
    const load = async () => {
      const t = await getTournament(code);
      setLocalTournament(t);
    };
    load();
  }, [code]);

  const { tournament, players, refreshPlayers } = useGameSync({
    tournamentId: localTournament?.id ?? null,
  });

  const currentTournament = tournament || localTournament;
  const currentQ = currentTournament?.current_question ?? 0;
  const totalQ = getTotalQuestions();
  const question = triviaQuestions[currentQ];

  const { timeLeft, restart } = useCountdown(20);

  // Start countdown when question phase begins
  useEffect(() => {
    if (phase === "question") {
      restart(20);
    }
  }, [phase, currentQ, restart]);

  // When timer runs out, move to penalty phase
  useEffect(() => {
    if (timeLeft === 0 && phase === "question") {
      handleNextPhase("penalty");
    }
  }, [timeLeft, phase]);

  const handleNextPhase = async (next: "penalty" | "results" | "question" | "finished") => {
    if (!currentTournament) return;

    if (next === "penalty") {
      setPhase("penalty");
      await updateTournamentStatus(currentTournament.id, "penalty" as GameStatus);
      // Auto-advance after penalty time
      setTimeout(() => handleNextPhase("results"), 5000);
    } else if (next === "results") {
      setPhase("results");
      await updateTournamentStatus(currentTournament.id, "results" as GameStatus);
      await refreshPlayers();
      // Show results for 4 seconds then advance
      setTimeout(async () => {
        if (currentQ + 1 >= totalQ) {
          handleNextPhase("finished");
        } else {
          await updateTournamentStatus(
            currentTournament.id,
            "question" as GameStatus,
            currentQ + 1
          );
          setPhase("question");
        }
      }, 4000);
    } else if (next === "finished") {
      setPhase("finished");
      await determineWinner(currentTournament.id);
      await refreshPlayers();
    }
  };

  const winner = players.find((p) => p.is_winner);

  if (!currentTournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e]">
        <div className="text-[#00FF88] text-xl animate-pulse">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#1a1a2e] px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white font-bold text-lg">Lucky Goal</h1>
          <p className="text-gray-500 text-xs">Codigo: {code}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-sm">
            Pregunta {currentQ + 1}/{totalQ}
          </p>
          <p className="text-[#00FF88] text-xs">{players.length} jugadores</p>
        </div>
      </div>

      {/* Game Content */}
      {phase === "finished" && winner ? (
        <WinnerBanner
          nickname={winner.nickname}
          avatar={winner.avatar}
          score={winner.score}
          prizeAmount={currentTournament.prize_amount}
        />
      ) : (
        <>
          {/* Question Display (Host View) */}
          {phase === "question" && question && (
            <div className="flex-1">
              <div className="flex justify-center mb-4">
                <Timer timeLeft={timeLeft} totalTime={20} />
              </div>
              <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-6 mb-6">
                <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">
                  Pregunta {currentQ + 1}
                </p>
                <h2 className="text-xl text-white font-semibold">
                  {question.question}
                </h2>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {question.options.map((opt, i) => (
                    <div
                      key={i}
                      className="bg-[#1a1a2e] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300"
                    >
                      <span className="text-[#00FF88] font-bold mr-2">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Penalty Phase */}
          {phase === "penalty" && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-6xl mb-4 animate-bounce">⚽</div>
              <h2 className="text-2xl text-white font-bold mb-2">Hora del Penal!</h2>
              <p className="text-gray-400">Los jugadores estan pateando...</p>
            </div>
          )}

          {/* Results Phase */}
          {phase === "results" && (
            <div className="flex-1">
              <h2 className="text-xl text-white font-bold text-center mb-4">
                Resultados
              </h2>
            </div>
          )}

          {/* Leaderboard (always visible) */}
          <div className="mt-auto">
            <Leaderboard
              players={players}
              highlightId={winner?.id}
            />
          </div>
        </>
      )}
    </div>
  );
}
