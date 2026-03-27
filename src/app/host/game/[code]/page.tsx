"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getTournament,
  updateTournamentStatus,
  determineWinner,
  getTotalQuestions,
  getCorrectAnswerCounts,
} from "@/lib/gameLogic";
import { useLanguage } from "@/contexts/LanguageContext";
import { processPostTournament } from "@/lib/globalPlayers";
import { useGameSync } from "@/hooks/useGameSync";
import { useCountdown } from "@/hooks/useCountdown";
import { getGameQuestions } from "@/lib/questions";
import { prepareClaimPrize } from "@/lib/escrow";
import { sendMessageToAll } from "@/lib/messages";
import { sendNativeTransfer } from "@/lib/chains";
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
    "question" | "countdown" | "penalty" | "results" | "finished"
  >("question");
  const [prizeSent, setPrizeSent] = useState(false);
  const [sendingPrize, setSendingPrize] = useState(false);
  const [prizeError, setPrizeError] = useState("");
  const [messageText, setMessageText] = useState("");
  const [messageSent, setMessageSent] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [prevScores, setPrevScores] = useState<Record<string, number>>({});
  const [correctCounts, setCorrectCounts] = useState<Record<string, number>>({});
  // Airdrop state
  const [airdropAmount, setAirdropAmount] = useState("");
  const [airdropConfirm, setAirdropConfirm] = useState(false);
  const [airdropSending, setAirdropSending] = useState(false);
  const [airdropSent, setAirdropSent] = useState(false);
  const [airdropError, setAirdropError] = useState("");
  const [airdropProgress, setAirdropProgress] = useState({ current: 0, total: 0 });
  const { t } = useLanguage();

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
  const gameQuestions = getGameQuestions(code, currentTournament?.custom_questions);
  const question = gameQuestions[currentQ];

  // Refs to avoid stale closures in setTimeout callbacks
  const currentQRef = useRef(currentQ);
  const tournamentRef = useRef(currentTournament);
  const phaseRef = useRef(phase);
  useEffect(() => {
    currentQRef.current = currentQ;
  }, [currentQ]);
  useEffect(() => {
    tournamentRef.current = currentTournament;
  }, [currentTournament]);
  useEffect(() => {
    phaseRef.current = phase;
    console.log("[HOST] PHASE CHANGED TO:", phase, "timeLeft:", timeLeft);
  }, [phase]);

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
      console.log("[HOST] RESTART CALLED WITH: 20");
      restart(20);
    }
  }, [phase, currentQ, restart]);

  // Only depends on timeLeft — does NOT re-run when phase changes.
  // Reads phase from phaseRef to avoid firing on stale timeLeft===0
  // when phase transitions to "question" (timeLeft hasn't updated yet).
  useEffect(() => {
    console.log("[HOST] TIMER TICK:", timeLeft, "phase:", phaseRef.current);
    if (timeLeft === 0 && phaseRef.current === "question") {
      console.log("[HOST] PENALTY TRIGGER! timeLeft=0, phase=question");
      handleNextPhase("penalty");
    }
  }, [timeLeft]);

  const handleNextPhase = async (
    next: "penalty" | "results" | "question" | "finished"
  ) => {
    const t = tournamentRef.current;
    if (!t) return;

    if (next === "penalty") {
      setPhase("penalty");
      await updateTournamentStatus(t.id, "penalty" as GameStatus);
      setTimeout(() => handleNextPhase("results"), 15000);
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
          // Update DB first so Realtime delivers "question" to players
          await updateTournamentStatus(tid, "question" as GameStatus, q + 1);
          // Show countdown screen while players receive the status update
          setPhase("countdown");
          setTimeout(() => {
            setPhase("question");
          }, 3000);
        }
      }, 4000);
    } else if (next === "finished") {
      setPhase("finished");
      await determineWinner(t.id);
      await refreshPlayers();
      // Process global ranking + achievements
      processPostTournament(t.id).catch(console.error);
      // Load correct answer counts for dashboard
      getCorrectAnswerCounts(t.id).then(setCorrectCounts).catch(console.error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentTournament) return;
    const walletAddresses = sorted
      .map((p) => p.wallet_address)
      .filter((w): w is string => Boolean(w));
    if (walletAddresses.length === 0) return;
    setSendingMessage(true);
    try {
      await sendMessageToAll(
        code,
        currentTournament.host_wallet,
        messageText.trim(),
        walletAddresses
      );
      setMessageSent(true);
      setMessageText("");
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendPrize = async () => {
    if (!winner?.wallet_address) return;
    setSendingPrize(true);
    setPrizeError("");
    try {
      await prepareClaimPrize(code, winner.wallet_address);
      setPrizeSent(true);
    } catch (err) {
      console.error("Prize transfer error:", err);
      setPrizeError("Error sending prize. Try again.");
    } finally {
      setSendingPrize(false);
    }
  };

  const winner = players.find((p) => p.is_winner);
  const sorted = [...players].sort((a, b) => b.score - a.score);

  if (!currentTournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-primary text-3xl animate-pulse font-bold">
          {t("hostGame.loading")}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface relative overflow-hidden">
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
      <div className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-outline-variant/15">
        <div className="flex items-center gap-3">
          <img src="/logo.jpeg" alt="Lucky Goal" className="w-10 h-10 rounded-lg object-cover" />
          <span className="text-on-surface font-bold text-xl">Lucky Goal</span>
          <span className="text-outline-variant text-sm font-mono ml-2">{code}</span>
        </div>
        <div className="flex items-center gap-6">
          {currentTournament.prize_amount > 0 && (
            <div className="flex items-center gap-2 bg-[#00FF88]/10 border border-primary/30 rounded-full px-4 py-1.5">
              <span className="text-primary font-bold">
                💎 {currentTournament.prize_amount} AVAX
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse" />
            <span className="text-on-surface-variant text-sm">
              {players.length} {t("hostGame.players")}
            </span>
          </div>
          {phase !== "finished" && (
            <div className="bg-white/5 rounded-lg px-3 py-1.5">
              <span className="text-on-surface-variant text-sm">
                {t("hostGame.question")}{" "}
                <span className="text-on-surface font-bold">
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
            style={{ width: `${((currentQ + (phase !== "question" && phase !== "countdown" ? 1 : 0)) / totalQ) * 100}%` }}
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
              className="bg-lucky-card border border-outline-variant/20 rounded-3xl px-10 py-8 mb-8 animate-[fadeIn_0.5s_ease-out]"
              style={{
                boxShadow: "0 0 40px rgba(0, 0, 0, 0.3)",
              }}
            >
              <p className="text-primary text-sm font-bold uppercase tracking-widest mb-3">
                {t("hostGame.question")} {currentQ + 1} {t("hostGame.of")} {totalQ}
              </p>
              <h2 className="text-4xl text-on-surface font-bold leading-tight">
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

        {/* ========== COUNTDOWN (buffer before question timer) ========== */}
        {phase === "countdown" && question && (
          <div className="flex-1 flex flex-col items-center justify-center px-8">
            <p className="text-primary text-xl font-bold uppercase tracking-widest mb-6 animate-pulse">
              {t("hostGame.question")} {currentQ + 1} {t("hostGame.of")} {totalQ}
            </p>
            <div
              className="text-9xl font-black text-white animate-[popIn_0.5s_ease-out]"
              style={{ textShadow: "0 0 40px rgba(0, 255, 136, 0.4)" }}
            >
              {t("hostGame.getReady")}
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

            <h2 className="text-5xl text-on-surface font-headline font-black mb-4 text-center">
              {t("hostGame.penaltyTime")}
            </h2>
            <div className="flex items-center gap-2 text-on-surface-variant text-2xl">
              <span>{t("hostGame.playersKicking")}</span>
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
                  className="flex items-center gap-2 bg-lucky-card/80 border border-outline-variant/20 rounded-xl px-4 py-2"
                >
                  <span className="text-lg">{p.avatar}</span>
                  <span className="text-white font-semibold text-sm">
                    {p.nickname}
                  </span>
                  <span className="text-primary font-bold text-sm">
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
            <h2 className="text-3xl text-on-surface font-headline font-black text-center mb-2">
              {t("hostGame.results")}
            </h2>
            <p className="text-outline text-center mb-8 text-lg">
              {t("hostGame.question")} {currentQ + 1} {t("hostGame.of")} {totalQ}
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
                        <span className="text-outline-variant font-bold text-2xl">
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
                        isTop3 ? "text-white" : "text-on-surface/80"
                      }`}
                    >
                      {player.nickname}
                    </span>

                    {/* Score delta */}
                    {delta > 0 && (
                      <span className="text-primary font-bold text-lg animate-[popIn_0.6s_ease-out] whitespace-nowrap">
                        +{delta}
                      </span>
                    )}

                    {/* Total score */}
                    <span
                      className={`text-3xl font-black tabular-nums min-w-[80px] text-right ${
                        isTop3 ? "text-primary" : "text-on-surface-variant"
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
              <p className="text-primary text-4xl font-bold mb-8 animate-[fadeIn_0.5s_ease-out_0.7s_backwards]">
                {winner.score} {t("hostGame.points")}
              </p>

              {/* Prize card */}
              {currentTournament.prize_amount > 0 && (
                <div
                  className="bg-lucky-card border-2 border-primary/30 rounded-3xl px-10 py-6 text-center mb-8 animate-[fadeIn_0.5s_ease-out_0.9s_backwards]"
                  style={{
                    boxShadow: "0 0 60px rgba(0, 255, 136, 0.15)",
                  }}
                >
                  <p className="text-on-surface-variant text-lg mb-1">{t("hostGame.prize")}</p>
                  <p className="text-primary text-5xl font-black">
                    {currentTournament.prize_amount} AVAX
                  </p>

                  {/* Prize action */}
                  <div className="mt-6">
                    {winner.wallet_address ? (
                      prizeSent ? (
                        <div className="flex items-center justify-center gap-3">
                          <span className="text-3xl">✅</span>
                          <div>
                            <p className="text-primary font-bold text-xl">
                              {t("hostGame.prizeSent")}
                            </p>
                            <p className="text-on-surface-variant text-sm">
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
                                {t("hostGame.sending")}
                              </span>
                            ) : (
                              `${t("hostGame.sendPrize")} ${currentTournament.prize_amount} AVAX`
                            )}
                          </button>
                          <p className="text-outline-variant text-xs mt-3 font-mono">
                            → {winner.wallet_address.slice(0, 8)}...
                            {winner.wallet_address.slice(-6)}
                          </p>
                        </>
                      )
                    ) : (
                      <div>
                        <p className="text-on-surface-variant animate-pulse text-lg">
                          {t("hostGame.waitingWallet")}
                        </p>
                        <button
                          onClick={refreshPlayers}
                          className="mt-3 text-primary text-sm underline hover:no-underline"
                        >
                          {t("hostGame.refresh")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── Tournament Dashboard ─── */}
              <div className="w-full max-w-4xl mt-4">
                <h3 className="text-2xl text-on-surface font-headline font-black text-center mb-6">{t("hostGame.dashboard")}</h3>

                {/* Stats cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: t("hostGame.totalPlayers"), value: sorted.length, color: "#00FF88" },
                    { label: t("hostGame.avgScore"), value: sorted.length ? Math.round(sorted.reduce((s, p) => s + p.score, 0) / sorted.length) : 0, color: "#FFD700" },
                    { label: t("hostGame.totalGoals"), value: sorted.reduce((s, p) => s + p.goals, 0), color: "#4ECDC4" },
                    { label: t("hostGame.highestScore"), value: sorted[0]?.score ?? 0, color: "#A855F7" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-lucky-card border border-white/8 rounded-xl p-4 text-center">
                      <p className="text-outline text-xs uppercase tracking-wider mb-1">{stat.label}</p>
                      <p className="text-3xl font-black" style={{ color: stat.color }}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Player table */}
                <div className="bg-lucky-card border border-white/8 rounded-xl overflow-hidden mb-4">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/15">
                    <h4 className="text-on-surface font-bold">{t("hostGame.playerTable")}</h4>
                    <button
                      onClick={() => {
                        const header = "rank,nickname,avatar,score,goals,correct_answers,wallet_address\n";
                        const rows = sorted.map((p, i) =>
                          `${i + 1},"${p.nickname}","${p.avatar}",${p.score},${p.goals},${correctCounts[p.id] || 0},"${p.wallet_address || ""}"`
                        ).join("\n");
                        const blob = new Blob([header + rows], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `lucky-goal-${code}-results.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="text-primary text-xs font-semibold hover:underline flex items-center gap-1"
                    >
                      📥 {t("hostGame.exportCsv")}
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-outline text-xs uppercase tracking-wider border-b border-outline-variant/15">
                          <th className="px-4 py-3 text-left">#</th>
                          <th className="px-4 py-3 text-left">{t("hostGame.nickname")}</th>
                          <th className="px-4 py-3 text-right">{t("hostGame.score")}</th>
                          <th className="px-4 py-3 text-right">{t("hostGame.goals")}</th>
                          <th className="px-4 py-3 text-right">{t("hostGame.correct")}</th>
                          <th className="px-4 py-3 text-left">{t("hostGame.wallet")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map((p, i) => (
                          <tr key={p.id} className="border-b border-white/3 hover:bg-white/3 transition-colors"
                            style={p.id === winner.id ? { backgroundColor: "rgba(0,255,136,0.06)" } : {}}>
                            <td className="px-4 py-3 text-outline font-bold">{i + 1}</td>
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-2">
                                <span className="text-lg">{p.avatar}</span>
                                <span className="text-white font-semibold">{p.nickname}</span>
                                {p.id === winner.id && <span className="text-xs">👑</span>}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-primary font-bold tabular-nums">{p.score}</td>
                            <td className="px-4 py-3 text-right text-white tabular-nums">{p.goals}</td>
                            <td className="px-4 py-3 text-right text-white tabular-nums">{correctCounts[p.id] || 0}</td>
                            <td className="px-4 py-3 text-outline font-mono text-xs">
                              {p.wallet_address ? `${p.wallet_address.slice(0, 6)}...${p.wallet_address.slice(-4)}` : t("hostGame.noWallet")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* New Tournament button */}
                <div className="text-center mt-6">
                  <button
                    onClick={() => router.push("/host")}
                    className="bg-[#00FF88] text-black font-black py-4 px-10 rounded-2xl text-lg active:scale-95 transform transition-transform"
                    style={{ boxShadow: "0 0 30px rgba(0,255,136,0.3)" }}
                  >
                    {t("host.createNew")} ⚡
                  </button>
                </div>

                {/* Messaging card */}
                <div className="bg-lucky-card border border-white/8 rounded-xl p-5 mt-6">
                  <h4 className="text-on-surface font-bold mb-4">{t("hostGame.sendMessage")}</h4>
                  {messageSent ? (
                    <div className="flex items-center gap-2 text-primary font-semibold py-2">
                      <span>✅</span>
                      <span>{t("hostGame.messageSent")}</span>
                    </div>
                  ) : (
                    <>
                      <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder={t("hostGame.messagePlaceholder")}
                        rows={3}
                        className="w-full bg-white/5 border border-outline-variant/20 rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none focus:border-primary/50 placeholder-gray-600 mb-3"
                      />
                      {sorted.filter((p) => p.wallet_address).length === 0 ? (
                        <p className="text-outline text-xs">{t("hostGame.noWallets")}</p>
                      ) : (
                        <button
                          onClick={handleSendMessage}
                          disabled={sendingMessage || !messageText.trim()}
                          className="bg-[#00FF88] text-black font-bold py-2.5 px-6 rounded-xl text-sm active:scale-95 transform transition-transform disabled:opacity-40"
                        >
                          {sendingMessage ? "..." : t("hostGame.sendToAll")}
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Airdrop card */}
                <AirdropCard
                  players={sorted}
                  airdropAmount={airdropAmount}
                  setAirdropAmount={setAirdropAmount}
                  airdropConfirm={airdropConfirm}
                  setAirdropConfirm={setAirdropConfirm}
                  airdropSending={airdropSending}
                  airdropSent={airdropSent}
                  airdropError={airdropError}
                  airdropProgress={airdropProgress}
                  onAirdrop={async () => {
                    const walletPlayers = sorted.filter((p) => p.wallet_address);
                    if (!walletPlayers.length || !airdropAmount) return;
                    const each = parseFloat(airdropAmount) / walletPlayers.length;
                    if (isNaN(each) || each <= 0) return;
                    setAirdropSending(true);
                    setAirdropError("");
                    setAirdropProgress({ current: 0, total: walletPlayers.length });
                    try {
                      for (let i = 0; i < walletPlayers.length; i++) {
                        setAirdropProgress({ current: i + 1, total: walletPlayers.length });
                        await sendNativeTransfer(
                          walletPlayers[i].wallet_address!,
                          each.toFixed(8)
                        );
                      }
                      setAirdropSent(true);
                    } catch (err) {
                      console.error("Airdrop error:", err);
                      setAirdropError(t("hostGame.airdropError"));
                    } finally {
                      setAirdropSending(false);
                    }
                  }}
                />
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

// ---- Airdrop Card ----
function AirdropCard({
  players, airdropAmount, setAirdropAmount, airdropConfirm, setAirdropConfirm,
  airdropSending, airdropSent, airdropError, airdropProgress, onAirdrop,
}: {
  players: Player[];
  airdropAmount: string;
  setAirdropAmount: (v: string) => void;
  airdropConfirm: boolean;
  setAirdropConfirm: (v: boolean) => void;
  airdropSending: boolean;
  airdropSent: boolean;
  airdropError: string;
  airdropProgress: { current: number; total: number };
  onAirdrop: () => void;
}) {
  const { t } = useLanguage();
  const walletPlayers = players.filter((p) => p.wallet_address);
  const amount = parseFloat(airdropAmount) || 0;
  const each = walletPlayers.length > 0 ? amount / walletPlayers.length : 0;

  return (
    <div className="bg-lucky-card border border-white/8 rounded-xl p-5 mt-6">
      <h4 className="text-on-surface font-bold mb-4">{t("hostGame.airdrop")}</h4>

      {airdropSent ? (
        <div className="flex items-center gap-2 text-primary font-semibold py-2">
          <span>✅</span>
          <span>{t("hostGame.airdropSent")}</span>
        </div>
      ) : walletPlayers.length === 0 ? (
        <p className="text-outline text-xs">{t("hostGame.airdropNoWallets")}</p>
      ) : (
        <>
          <div className="flex gap-3 items-end mb-3">
            <div className="flex-1">
              <label className="text-outline text-xs block mb-1">{t("hostGame.airdropAmount")}</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={airdropAmount}
                onChange={(e) => { setAirdropAmount(e.target.value); setAirdropConfirm(false); }}
                disabled={airdropSending}
                placeholder="0.05"
                className="w-full bg-white/5 border border-outline-variant/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50 placeholder-gray-600"
              />
            </div>
          </div>

          {amount > 0 && (
            <p className="text-on-surface-variant text-xs mb-3">
              Send <span className="text-on-surface font-bold">{each.toFixed(4)} AVAX</span> to each of <span className="text-on-surface font-bold">{walletPlayers.length}</span> players (<span className="text-primary font-bold">{amount} AVAX</span> total)
            </p>
          )}

          {airdropError && <p className="text-red-400 text-xs mb-3">{airdropError}</p>}

          {airdropSending ? (
            <div className="flex items-center gap-2 text-on-surface-variant text-sm">
              <span className="animate-spin">⏳</span>
              {t("hostGame.airdropSending")
                .replace("{current}", String(airdropProgress.current))
                .replace("{total}", String(airdropProgress.total))}
            </div>
          ) : !airdropConfirm ? (
            <button
              onClick={() => setAirdropConfirm(true)}
              disabled={!amount || amount <= 0}
              className="bg-[#00FF88] text-black font-bold py-2.5 px-6 rounded-xl text-sm active:scale-95 transform transition-transform disabled:opacity-40"
            >
              {t("hostGame.airdropBtn")}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={onAirdrop}
                className="bg-[#00FF88] text-black font-bold py-2.5 px-6 rounded-xl text-sm active:scale-95 transform transition-transform"
              >
                {t("hostGame.airdropConfirm")}
              </button>
              <button
                onClick={() => setAirdropConfirm(false)}
                className="border border-white/20 text-on-surface-variant font-bold py-2.5 px-4 rounded-xl text-sm active:scale-95 transform transition-transform hover:text-white"
              >
                {t("hostGame.airdropCancel")}
              </button>
            </div>
          )}
        </>
      )}
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
