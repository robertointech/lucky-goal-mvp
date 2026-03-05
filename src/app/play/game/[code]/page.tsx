"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { getTournament, submitAnswer, recordGoal } from "@/lib/gameLogic";
import { useGameSync } from "@/hooks/useGameSync";
import { useCountdown } from "@/hooks/useCountdown";
import { triviaQuestions } from "@/lib/questions";
import Timer from "@/components/ui/Timer";
import Leaderboard from "@/components/ui/Leaderboard";
import WinnerBanner from "@/components/ui/WinnerBanner";
import type { Tournament, Direction } from "@/types/game";

const PenaltyScene = dynamic(() => import("@/components/3d/PenaltyScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[350px] bg-[#0D1117] rounded-xl flex items-center justify-center">
      <div className="text-[#00FF88] animate-pulse">Cargando 3D...</div>
    </div>
  ),
});

export default function PlayerGamePage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const [localTournament, setLocalTournament] = useState<Tournament | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answerStartTime, setAnswerStartTime] = useState(0);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);

  // Penalty state
  const [selectedDirection, setSelectedDirection] = useState<Direction | null>(null);
  const [kicked, setKicked] = useState(false);
  const [goalkeeperDirection, setGoalkeeperDirection] = useState<Direction | null>(null);
  const [penaltyResult, setPenaltyResult] = useState<"goal" | "saved" | null>(null);
  const [penaltyDone, setPenaltyDone] = useState(false);

  const { timeLeft, restart } = useCountdown(20);

  useEffect(() => {
    const pid = sessionStorage.getItem(`player_${code}`);
    setPlayerId(pid);

    const load = async () => {
      const t = await getTournament(code);
      setLocalTournament(t);
    };
    load();
  }, [code]);

  const { tournament, players, myPlayer } = useGameSync({
    tournamentId: localTournament?.id ?? null,
    playerId,
  });

  const currentTournament = tournament || localTournament;
  const status = currentTournament?.status;
  const currentQ = currentTournament?.current_question ?? 0;
  const question = triviaQuestions[currentQ];

  // Reset state when question changes
  useEffect(() => {
    if (status === "question") {
      setSelectedOption(null);
      setAnswered(false);
      setAnswerStartTime(Date.now());
      setSelectedDirection(null);
      setKicked(false);
      setGoalkeeperDirection(null);
      setPenaltyResult(null);
      setPenaltyDone(false);
      restart(20);
    }
  }, [status, currentQ, restart]);

  // Auto-submit when timer runs out
  useEffect(() => {
    if (timeLeft === 0 && !answered && status === "question") {
      handleSubmitAnswer(-1);
    }
  }, [timeLeft, answered, status]);

  const handleSubmitAnswer = useCallback(
    async (optionIndex: number) => {
      if (answered || !playerId || !currentTournament) return;
      setAnswered(true);

      const timeMs = Date.now() - answerStartTime;
      const isCorrect = await submitAnswer(
        currentTournament.id,
        playerId,
        currentQ,
        optionIndex,
        timeMs
      );
      setLastAnswerCorrect(isCorrect);
    },
    [answered, playerId, currentTournament, currentQ, answerStartTime]
  );

  const handleDirectionSelect = (dir: Direction) => {
    if (kicked) return;
    setSelectedDirection(dir);
  };

  const handleKick = () => {
    if (!selectedDirection || kicked) return;
    setKicked(true);

    const directions: Direction[] = ["left", "center", "right"];
    const gkDir = directions[Math.floor(Math.random() * directions.length)];
    setGoalkeeperDirection(gkDir);

    // Goal probability
    const goalProb = lastAnswerCorrect ? 0.7 : 0.35;
    const sameDir = selectedDirection === gkDir;
    const scored = !sameDir || Math.random() < goalProb;
    setPenaltyResult(scored ? "goal" : "saved");
  };

  const handleKickComplete = async (scored: boolean) => {
    if (scored && playerId) {
      await recordGoal(playerId);
    }
    setPenaltyDone(true);
  };

  // Redirect to claim if finished and winner
  const winner = players.find((p) => p.is_winner);

  if (status === "finished" && winner) {
    const isSelf = winner.id === playerId;

    return (
      <div className="min-h-screen flex flex-col bg-[#1a1a2e] px-4 py-6">
        <WinnerBanner
          nickname={winner.nickname}
          avatar={winner.avatar}
          score={winner.score}
          prizeAmount={currentTournament?.prize_amount ?? 0}
          isSelf={isSelf}
          onClaim={isSelf ? () => router.push(`/claim/${code}`) : undefined}
        />
        <div className="mt-6">
          <Leaderboard players={players} highlightId={winner.id} />
        </div>
      </div>
    );
  }

  if (!currentTournament || !question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e]">
        <div className="text-[#00FF88] text-xl animate-pulse">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#1a1a2e] px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-400 text-sm">
          Pregunta {currentQ + 1}/{triviaQuestions.length}
        </p>
        {myPlayer && (
          <p className="text-[#00FF88] font-bold">{myPlayer.score} pts</p>
        )}
      </div>

      {/* Progress */}
      <div className="w-full bg-gray-800 rounded-full h-1.5 mb-4">
        <div
          className="bg-[#00FF88] h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${((currentQ + 1) / triviaQuestions.length) * 100}%` }}
        />
      </div>

      {/* Question Phase */}
      {status === "question" && !answered && (
        <>
          <div className="flex justify-center mb-4">
            <Timer timeLeft={timeLeft} totalTime={20} />
          </div>
          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-4 mb-4">
            <h2 className="text-lg text-white font-semibold text-center">
              {question.question}
            </h2>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            {question.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedOption(i);
                  handleSubmitAnswer(i);
                }}
                className={`w-full text-left bg-[#0D1117] border rounded-xl px-4 py-3 transition-all active:scale-95 ${
                  selectedOption === i
                    ? "border-[#00FF88] bg-[#00FF88]/10"
                    : "border-gray-700 hover:border-gray-500"
                }`}
              >
                <span className="text-[#00FF88] font-bold mr-2">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-white">{opt}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Waiting for answer result */}
      {status === "question" && answered && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-4xl mb-4">
            {lastAnswerCorrect ? "✅" : "❌"}
          </div>
          <h2 className="text-xl text-white font-bold">
            {lastAnswerCorrect ? "Correcto!" : "Incorrecto"}
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            Esperando al penal...
          </p>
        </div>
      )}

      {/* Penalty Phase */}
      {status === "penalty" && !penaltyDone && (
        <div className="flex-1 flex flex-col">
          <div className="text-center mb-2">
            <h2 className="text-xl text-white font-bold">Patea el Penal!</h2>
            <p className="text-gray-400 text-xs mt-1">
              {lastAnswerCorrect
                ? "Respuesta correcta: 70% probabilidad"
                : "Respuesta incorrecta: 35% probabilidad"}
            </p>
          </div>

          <PenaltyScene
            onDirectionSelect={handleDirectionSelect}
            onKickComplete={handleKickComplete}
            selectedDirection={selectedDirection}
            kicked={kicked}
            goalkeeperDirection={goalkeeperDirection}
            result={penaltyResult}
          />

          {/* Kick button */}
          {!kicked && (
            <button
              onClick={handleKick}
              disabled={!selectedDirection}
              className="mt-4 w-full bg-[#00FF88] text-black font-bold py-4 rounded-xl text-lg active:scale-95 transform disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {selectedDirection ? "PATEAR!" : "Selecciona direccion"}
            </button>
          )}

          {/* Result */}
          {penaltyResult && (
            <div className="text-center mt-4">
              <div className="text-4xl mb-2">
                {penaltyResult === "goal" ? "🎉" : "😔"}
              </div>
              <p className={`text-xl font-bold ${
                penaltyResult === "goal" ? "text-[#00FF88]" : "text-red-500"
              }`}>
                {penaltyResult === "goal" ? "GOOOL!" : "Atajada!"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Penalty done, waiting */}
      {status === "penalty" && penaltyDone && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-[#00FF88] text-xl animate-pulse">
            Esperando resultados...
          </div>
        </div>
      )}

      {/* Results Phase */}
      {status === "results" && (
        <div className="flex-1">
          <h2 className="text-xl text-white font-bold text-center mb-4">
            Resultados
          </h2>
          <Leaderboard players={players} highlightId={playerId ?? undefined} />
        </div>
      )}
    </div>
  );
}
