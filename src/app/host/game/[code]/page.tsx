"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getTournament,
  updateTournamentStatus,
  determineWinner,
  getTotalQuestions,
} from "@/lib/gameLogic";
import { useGameSync } from "@/hooks/useGameSync";
import { useCountdown } from "@/hooks/useCountdown";
import { useSendTransaction } from "thirdweb/react";
import { triviaQuestions } from "@/lib/questions";
import { prepareClaimPrize } from "@/lib/escrow";
import type { Tournament, Player, GameStatus } from "@/types/game";

// Kahoot-style option colors
const OPTION_COLORS = [
  { bg: "#E21B3C", icon: "▲" }, // A - Red
  { bg: "#1368CE", icon: "◆" }, // B - Blue
  { bg: "#D89E00", icon: "●" }, // C - Yellow
  { bg: "#26890C", icon: "■" }, // D - Green
];

export default function HostGamePage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const [localTournament, setLocalTournament] = useState<Tournament | null>(
    null
  );
  const [phase, setPhase] = useState<
    "question" | "penalty" | "results" | "finished"
  >("question");
  const [prizeSent, setPrizeSent] = useState(false);
  const [sendingPrize, setSendingPrize] = useState(false);
  const [prizeError, setPrizeError] = useState("");
  const [prevScores, setPrevScores] = useState<Record<string, number>>({});
  const { mutateAsync: sendTx } = useSendTransaction();

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

  // Refs to avoid stale closures in setTimeout callbacks
  const currentQRef = useRef(currentQ);
  const tournamentRef = useRef(currentTournament);
  useEffect(() => {
    currentQRef.current = currentQ;
  }, [currentQ]);
  useEffect(() => {
    tournamentRef.current = currentTournament;
  }, [currentTournament]);

  const { timeLeft, restart } = useCountdown(20);

  // Snapshot scores when entering results to show deltas
  useEffect(() => {
    if (phase === "results") {
      // prevScores was set when leaving question phase
    } else if (phase === "question") {
      // Capture current scores before the question
      const scores: Record<string, number> = {};
      players.forEach((p) => {
        scores[p.id] = p.score;
      });
      setPrevScores(scores);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "question") {
      restart(20);
    }
  }, [phase, currentQ, restart]);

  useEffect(() => {
    if (timeLeft === 0 && phase === "question") {
      handleNextPhase("penalty");
    }
  }, [timeLeft, phase]);

  const handleNextPhase = async (
    next: "penalty" | "results" | "question" | "finished"
  ) => {
    const t = tournamentRef.current;
    if (!t) return;

    if (next === "penalty") {
      setPhase("penalty");
      await updateTournamentStatus(t.id, "penalty" as GameStatus);
      setTimeout(() => handleNextPhase("results"), 12000);
    } else if (next === "results") {
      setPhase("results");
      await updateTournamentStatus(t.id, "results" as GameStatus);
      await refreshPlayers();
      setTimeout(async () => {
        const q = currentQRef.current;
        const tid = tournamentRef.current?.id;
        if (!tid) return;
        if (q + 1 >= totalQ) {
          handleNextPhase("finished");
        } else {
          await updateTournamentStatus(tid, "question" as GameStatus, q + 1);
          setPhase("question");
        }
      }, 4000);
    } else if (next === "finished") {
      setPhase("finished");
      await determineWinner(t.id);
      await refreshPlayers();
    }
  };

  const handleSendPrize = async () => {
    if (!winner?.wallet_address) return;
    setSendingPrize(true);
    setPrizeError("");
    try {
      const tx = prepareClaimPrize(code, winner.wallet_address);
      await sendTx(tx);
      setPrizeSent(true);
    } catch (err) {
      console.error("Prize transfer error:", err);
      setPrizeError("Error al enviar premio. Intenta de nuevo.");
    } finally {
      setSendingPrize(false);
    }
  };

  const winner = players.find((p) => p.is_winner);
  const sorted = [...players].sort((a, b) => b.score - a.score);

  if (!currentTournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e]">
        <div className="text-[#00FF88] text-3xl animate-pulse font-bold">
          Cargando...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#1a1a2e] relative overflow-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-[-30%] left-[50%] translate-x-[-50%] w-[1000px] h-[1000px] rounded-full opacity-[0.05]"
          style={{
            background: "radial-gradient(circle, #00FF88 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚽</span>
          <span className="text-white font-bold text-xl">Lucky Goal</span>
          <span className="text-gray-600 text-sm font-mono ml-2">{code}</span>
        </div>
        <div className="flex items-center gap-6">
          {currentTournament.prize_amount > 0 && (
            <div className="flex items-center gap-2 bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-full px-4 py-1.5">
              <span className="text-[#00FF88] font-bold">
                💎 {currentTournament.prize_amount} AVAX
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse" />
            <span className="text-gray-400 text-sm">
              {players.length} jugadores
            </span>
          </div>
          {phase !== "finished" && (
            <div className="bg-white/5 rounded-lg px-3 py-1.5">
              <span className="text-gray-400 text-sm">
                Pregunta{" "}
                <span className="text-white font-bold">
                  {currentQ + 1}/{totalQ}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {phase !== "finished" && (
        <div className="relative z-10 w-full h-1 bg-white/5">
          <div
            className="h-full bg-[#00FF88] transition-all duration-500"
            style={{ width: `${((currentQ + (phase !== "question" ? 1 : 0)) / totalQ) * 100}%` }}
          />
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* ========== QUESTION PHASE ========== */}
        {phase === "question" && question && (
          <div className="flex-1 flex flex-col px-8 py-6">
            {/* Timer bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-6xl font-black tabular-nums transition-colors"
                  style={{
                    color:
                      timeLeft > 10
                        ? "#00FF88"
                        : timeLeft > 5
                          ? "#FFD700"
                          : "#FF4444",
                    textShadow:
                      timeLeft <= 5
                        ? "0 0 20px rgba(255, 68, 68, 0.5)"
                        : "none",
                  }}
                >
                  {timeLeft}
                </span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-linear"
                  style={{
                    width: `${(timeLeft / 20) * 100}%`,
                    backgroundColor:
                      timeLeft > 10
                        ? "#00FF88"
                        : timeLeft > 5
                          ? "#FFD700"
                          : "#FF4444",
                    boxShadow:
                      timeLeft <= 5
                        ? "0 0 15px rgba(255, 68, 68, 0.6)"
                        : "0 0 10px rgba(0, 255, 136, 0.3)",
                  }}
                />
              </div>
            </div>

            {/* Question */}
            <div
              className="bg-[#0D1117] border border-white/10 rounded-3xl px-10 py-8 mb-8 animate-[fadeIn_0.5s_ease-out]"
              style={{
                boxShadow: "0 0 40px rgba(0, 0, 0, 0.3)",
              }}
            >
              <p className="text-[#00FF88] text-sm font-bold uppercase tracking-widest mb-3">
                Pregunta {currentQ + 1} de {totalQ}
              </p>
              <h2 className="text-4xl text-white font-bold leading-tight">
                {question.question}
              </h2>
            </div>

            {/* Options grid - Kahoot style */}
            <div className="grid grid-cols-2 gap-4 flex-1">
              {question.options.map((opt, i) => (
                <div
                  key={i}
                  className="rounded-2xl flex items-center gap-4 px-8 py-6 animate-[slideUp_0.4s_ease-out] min-h-[100px]"
                  style={{
                    backgroundColor: OPTION_COLORS[i].bg,
                    animationDelay: `${i * 0.1}s`,
                    animationFillMode: "backwards",
                    boxShadow: `0 4px 20px ${OPTION_COLORS[i].bg}40`,
                  }}
                >
                  <span className="text-white/80 text-3xl font-bold">
                    {OPTION_COLORS[i].icon}
                  </span>
                  <span className="text-white text-2xl font-bold flex-1">
                    {opt}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== PENALTY PHASE ========== */}
        {phase === "penalty" && (
          <div className="flex-1 flex flex-col items-center justify-center px-8">
            {/* Animated ball */}
            <div className="relative mb-8">
              <div
                className="text-[120px] animate-[kickBounce_1.5s_ease-in-out_infinite]"
                style={{
                  filter: "drop-shadow(0 0 30px rgba(0, 255, 136, 0.3))",
                }}
              >
                ⚽
              </div>
              {/* Glow ring behind ball */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full animate-[pulseRing_2s_ease-in-out_infinite]"
                style={{
                  border: "2px solid rgba(0, 255, 136, 0.2)",
                }}
              />
            </div>

            <h2 className="text-5xl text-white font-black mb-4 text-center">
              Hora del Penal!
            </h2>
            <div className="flex items-center gap-2 text-gray-400 text-2xl">
              <span>Los jugadores estan pateando</span>
              <span className="inline-flex">
                <span className="animate-[dotBounce_1.4s_ease-in-out_infinite]">
                  .
                </span>
                <span className="animate-[dotBounce_1.4s_ease-in-out_0.2s_infinite]">
                  .
                </span>
                <span className="animate-[dotBounce_1.4s_ease-in-out_0.4s_infinite]">
                  .
                </span>
              </span>
            </div>

            {/* Mini scoreboard during penalty */}
            <div className="mt-12 flex gap-3 flex-wrap justify-center max-w-3xl">
              {sorted.slice(0, 5).map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 bg-[#0D1117]/80 border border-white/10 rounded-xl px-4 py-2"
                >
                  <span className="text-lg">{p.avatar}</span>
                  <span className="text-white font-semibold text-sm">
                    {p.nickname}
                  </span>
                  <span className="text-[#00FF88] font-bold text-sm">
                    {p.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== RESULTS PHASE ========== */}
        {phase === "results" && (
          <div className="flex-1 flex flex-col px-8 py-6">
            <h2 className="text-3xl text-white font-black text-center mb-2">
              Resultados
            </h2>
            <p className="text-gray-500 text-center mb-8 text-lg">
              Pregunta {currentQ + 1} de {totalQ}
            </p>

            {/* Scoreboard */}
            <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col gap-3">
              {sorted.map((player, i) => {
                const delta = player.score - (prevScores[player.id] ?? 0);
                const isTop3 = i < 3;
                const medals = ["🥇", "🥈", "🥉"];

                return (
                  <div
                    key={player.id}
                    className="flex items-center gap-4 rounded-2xl px-6 py-4 animate-[slideIn_0.5s_ease-out] transition-all"
                    style={{
                      animationDelay: `${i * 0.08}s`,
                      animationFillMode: "backwards",
                      backgroundColor: isTop3
                        ? "rgba(0, 255, 136, 0.08)"
                        : "rgba(13, 17, 23, 0.6)",
                      border: isTop3
                        ? "1px solid rgba(0, 255, 136, 0.2)"
                        : "1px solid rgba(255, 255, 255, 0.05)",
                      boxShadow: i === 0
                        ? "0 0 30px rgba(0, 255, 136, 0.1)"
                        : "none",
                    }}
                  >
                    {/* Rank */}
                    <span className="text-3xl min-w-[48px] text-center">
                      {isTop3 ? medals[i] : (
                        <span className="text-gray-600 font-bold text-2xl">
                          {i + 1}
                        </span>
                      )}
                    </span>

                    {/* Avatar */}
                    <span
                      className="text-4xl"
                      style={{
                        filter: i === 0 ? "drop-shadow(0 0 8px rgba(0, 255, 136, 0.5))" : "none",
                      }}
                    >
                      {player.avatar}
                    </span>

                    {/* Name */}
                    <span
                      className={`text-2xl font-bold flex-1 truncate ${
                        isTop3 ? "text-white" : "text-gray-300"
                      }`}
                    >
                      {player.nickname}
                    </span>

                    {/* Score delta */}
                    {delta > 0 && (
                      <span className="text-[#00FF88] font-bold text-lg animate-[popIn_0.6s_ease-out] whitespace-nowrap">
                        +{delta}
                      </span>
                    )}

                    {/* Total score */}
                    <span
                      className={`text-3xl font-black tabular-nums min-w-[80px] text-right ${
                        isTop3 ? "text-[#00FF88]" : "text-gray-400"
                      }`}
                    >
                      {player.score}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========== FINISHED PHASE ========== */}
        {phase === "finished" && winner && (
          <div className="flex-1 flex flex-col">
            {/* Confetti */}
            <Confetti />

            {/* Winner showcase */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 py-6">
              {/* Crown */}
              <div className="text-7xl mb-2 animate-[crownDrop_0.8s_ease-out]">
                👑
              </div>

              {/* Avatar */}
              <div
                className="text-[100px] mb-4 animate-[popIn_0.6s_ease-out_0.3s_backwards]"
                style={{
                  filter: "drop-shadow(0 0 40px rgba(0, 255, 136, 0.4))",
                }}
              >
                {winner.avatar}
              </div>

              {/* Name */}
              <h2 className="text-6xl font-black text-white mb-3 text-center animate-[fadeIn_0.5s_ease-out_0.5s_backwards]">
                {winner.nickname}
              </h2>

              {/* Score */}
              <p className="text-[#00FF88] text-4xl font-bold mb-8 animate-[fadeIn_0.5s_ease-out_0.7s_backwards]">
                {winner.score} puntos
              </p>

              {/* Prize card */}
              {currentTournament.prize_amount > 0 && (
                <div
                  className="bg-[#0D1117] border-2 border-[#00FF88]/30 rounded-3xl px-10 py-6 text-center mb-8 animate-[fadeIn_0.5s_ease-out_0.9s_backwards]"
                  style={{
                    boxShadow: "0 0 60px rgba(0, 255, 136, 0.15)",
                  }}
                >
                  <p className="text-gray-400 text-lg mb-1">Premio</p>
                  <p className="text-[#00FF88] text-5xl font-black">
                    {currentTournament.prize_amount} AVAX
                  </p>

                  {/* Prize action */}
                  <div className="mt-6">
                    {winner.wallet_address ? (
                      prizeSent ? (
                        <div className="flex items-center justify-center gap-3">
                          <span className="text-3xl">✅</span>
                          <div>
                            <p className="text-[#00FF88] font-bold text-xl">
                              Premio enviado!
                            </p>
                            <p className="text-gray-400 text-sm">
                              {winner.wallet_address.slice(0, 8)}...
                              {winner.wallet_address.slice(-6)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          {prizeError && (
                            <p className="text-red-400 text-sm mb-3">
                              {prizeError}
                            </p>
                          )}
                          <button
                            onClick={handleSendPrize}
                            disabled={sendingPrize}
                            className="bg-[#00FF88] text-black font-black py-4 px-10 rounded-2xl text-xl active:scale-95 transform transition-transform disabled:opacity-50"
                            style={{
                              boxShadow:
                                "0 0 40px rgba(0, 255, 136, 0.4), 0 4px 20px rgba(0, 0, 0, 0.3)",
                            }}
                          >
                            {sendingPrize ? (
                              <span className="flex items-center gap-2">
                                <span className="animate-spin">⏳</span>{" "}
                                Enviando...
                              </span>
                            ) : (
                              `Enviar ${currentTournament.prize_amount} AVAX`
                            )}
                          </button>
                          <p className="text-gray-600 text-xs mt-3 font-mono">
                            → {winner.wallet_address.slice(0, 8)}...
                            {winner.wallet_address.slice(-6)}
                          </p>
                        </>
                      )
                    ) : (
                      <div>
                        <p className="text-gray-400 animate-pulse text-lg">
                          Esperando wallet del ganador...
                        </p>
                        <button
                          onClick={refreshPlayers}
                          className="mt-3 text-[#00FF88] text-sm underline hover:no-underline"
                        >
                          Actualizar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Final leaderboard - compact */}
              <div className="w-full max-w-2xl">
                <div className="flex gap-3 justify-center flex-wrap">
                  {sorted.slice(0, 5).map((p, i) => {
                    const medals = ["🥇", "🥈", "🥉"];
                    return (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 bg-[#0D1117]/80 border border-white/10 rounded-xl px-5 py-3 animate-[slideUp_0.4s_ease-out]"
                        style={{
                          animationDelay: `${1.2 + i * 0.1}s`,
                          animationFillMode: "backwards",
                          border:
                            p.id === winner.id
                              ? "1px solid rgba(0, 255, 136, 0.3)"
                              : "1px solid rgba(255, 255, 255, 0.05)",
                        }}
                      >
                        <span className="text-lg">
                          {i < 3 ? medals[i] : `#${i + 1}`}
                        </span>
                        <span className="text-xl">{p.avatar}</span>
                        <span className="text-white font-bold">{p.nickname}</span>
                        <span className="text-[#00FF88] font-bold ml-1">
                          {p.score}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.5); }
          70% { transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes kickBounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          30% { transform: translateY(-40px) rotate(-15deg); }
          60% { transform: translateY(-20px) rotate(10deg); }
        }
        @keyframes pulseRing {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
          50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
        }
        @keyframes dotBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-8px); }
        }
        @keyframes crownDrop {
          0% { opacity: 0; transform: translateY(-60px) rotate(-20deg); }
          60% { transform: translateY(5px) rotate(5deg); }
          100% { opacity: 1; transform: translateY(0) rotate(0deg); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ---- Confetti component ----
function Confetti() {
  const [particles, setParticles] = useState<
    {
      id: number;
      x: number;
      color: string;
      delay: number;
      size: number;
      duration: number;
    }[]
  >([]);

  useEffect(() => {
    const colors = ["#00FF88", "#FFD700", "#FF6B6B", "#4ECDC4", "#E21B3C", "#1368CE"];
    const items = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 3,
      size: 5 + Math.random() * 10,
      duration: 2.5 + Math.random() * 3,
    }));
    setParticles(items);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: "-15px",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            animation: `confettiFall ${p.duration}s ${p.delay}s linear infinite`,
          }}
        />
      ))}
    </div>
  );
}
