"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTournament, submitAnswer, recordGoal } from "@/lib/gameLogic";
import { useGameSync } from "@/hooks/useGameSync";
import { useCountdown } from "@/hooks/useCountdown";
import { getGameQuestions, QUESTIONS_PER_GAME } from "@/lib/questions";
import type { Tournament, Player, Direction } from "@/types/game";
import JuggleBall from "@/components/JuggleBall";

// Kahoot-style colors
const OPT_COLORS = [
  { bg: "#E21B3C", icon: "▲" }, // A red
  { bg: "#1368CE", icon: "◆" }, // B blue
  { bg: "#D89E00", icon: "●" }, // C yellow
  { bg: "#26890C", icon: "■" }, // D green
];

export default function PlayerGamePage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const [localTournament, setLocalTournament] = useState<Tournament | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answerStartTime, setAnswerStartTime] = useState(0);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);

  // Score popup
  const [scorePopup, setScorePopup] = useState<string | null>(null);

  // Penalty state
  const [selectedDirection, setSelectedDirection] = useState<Direction | null>(null);
  const [kicked, setKicked] = useState(false);
  const kickedRef = useRef(false); // Synchronous guard — prevents double-kick from rapid taps
  const [goalkeeperDirection, setGoalkeeperDirection] = useState<Direction | null>(null);
  const [penaltyResult, setPenaltyResult] = useState<"goal" | "saved" | null>(null);
  const [penaltyDone, setPenaltyDone] = useState(false);

  const { timeLeft, restart, stop: triviaStop } = useCountdown(20);
  const {
    timeLeft: penaltyTimeLeft,
    isRunning: penaltyIsRunning,
    restart: penaltyRestart,
    stop: penaltyStop,
  } = useCountdown(10);

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
  const gameQuestions = getGameQuestions(code, currentTournament?.custom_questions);
  const question = gameQuestions[currentQ];

  // Guards to ensure each phase initializes exactly once per question round.
  // Without these, effects can re-fire on dependency changes (e.g. penaltyRestart
  // reference) and reset local state mid-phase — causing double kicks, lost state, etc.
  const questionInitRef = useRef(-1);
  const penaltyInitRef = useRef(-1);

  // Reset ALL state when a new question arrives
  useEffect(() => {
    if (status === "question" && questionInitRef.current !== currentQ) {
      questionInitRef.current = currentQ;
      setSelectedOption(null);
      setAnswered(false);
      setLastAnswerCorrect(null);
      setAnswerStartTime(Date.now());
      setSelectedDirection(null);
      setKicked(false);
      kickedRef.current = false;
      setGoalkeeperDirection(null);
      setPenaltyResult(null);
      setPenaltyDone(false);
      setScorePopup(null);
      restart(20);
    } else if (status !== "question") {
      triviaStop();
    }
  }, [status, currentQ, restart, triviaStop]);

  // Initialize penalty phase exactly once per question round.
  // If the player missed the "question" status (Realtime coalesced the rapid
  // results→question→penalty transitions), force-reset all round state so the
  // player isn't stuck with stale kicked/penaltyDone from the previous round.
  useEffect(() => {
    if (status === "penalty" && penaltyInitRef.current !== currentQ) {
      penaltyInitRef.current = currentQ;

      // Missed the question phase for this round — force full reset
      if (questionInitRef.current !== currentQ) {
        questionInitRef.current = currentQ;
        setSelectedOption(null);
        setAnswered(true); // Mark as answered (missed = no answer)
        setLastAnswerCorrect(false); // Missed question = incorrect
        setScorePopup(null);
      }

      // Reset penalty state (always — either fresh from question or recovered)
      if (!kickedRef.current) {
        setSelectedDirection(null);
        setKicked(false);
        kickedRef.current = false;
        setGoalkeeperDirection(null);
        setPenaltyResult(null);
        setPenaltyDone(false);
        penaltyRestart(10);
      }
    }
  }, [status, currentQ, penaltyRestart]);

  useEffect(() => {
    if (timeLeft === 0 && !answered && status === "question") {
      handleSubmitAnswer(-1);
    }
  }, [timeLeft, answered, status]);

  // Auto-kick when penalty timer expires — only fires if the timer actually ran
  // down (penaltyIsRunning was true and reached 0, not if it was never started)
  const penaltyTimerExpired = penaltyTimeLeft === 0 && !penaltyIsRunning;
  useEffect(() => {
    // Guard: only auto-kick if we initialized penalty for this round
    if (
      penaltyTimerExpired &&
      !kickedRef.current &&
      status === "penalty" &&
      !penaltyDone &&
      penaltyInitRef.current === currentQ
    ) {
      kickedRef.current = true;
      setKicked(true);
      const directions: Direction[] = ["left", "center", "right"];
      const randomDir = selectedDirection || directions[Math.floor(Math.random() * directions.length)];
      if (!selectedDirection) setSelectedDirection(randomDir);
      setGoalkeeperDirection(randomDir);
      setPenaltyResult("saved");
    }
  }, [penaltyTimerExpired, kicked, status, penaltyDone, selectedDirection, currentQ]);

  const handleSubmitAnswer = useCallback(
    (optionIndex: number) => {
      if (answered || !playerId || !currentTournament) return;

      const q = gameQuestions[currentQ];
      const isCorrect = optionIndex >= 0 && optionIndex === q.correctIndex;
      setLastAnswerCorrect(isCorrect);
      setSelectedOption(optionIndex);
      setAnswered(true);

      if (isCorrect) {
        const timeMs = Date.now() - answerStartTime;
        const timeBonus = Math.max(0, Math.round((1 - timeMs / 20000) * 100));
        setScorePopup(`+${100 + timeBonus}`);
        setTimeout(() => setScorePopup(null), 1500);
      }

      const timeMs = Date.now() - answerStartTime;
      submitAnswer(currentTournament.id, playerId, currentQ, optionIndex, timeMs, q.correctIndex);
    },
    [answered, playerId, currentTournament, currentQ, answerStartTime]
  );

  const handleDirectionSelect = (dir: Direction) => {
    if (kicked) return;
    setSelectedDirection(dir);
  };

  const handleKick = () => {
    if (!selectedDirection || kickedRef.current) return;
    kickedRef.current = true;
    penaltyStop();
    setKicked(true);

    if (!lastAnswerCorrect) {
      setGoalkeeperDirection(selectedDirection);
      setPenaltyResult("saved");
    } else {
      const directions: Direction[] = ["left", "center", "right"];
      const gkDir = directions[Math.floor(Math.random() * directions.length)];
      setGoalkeeperDirection(gkDir);
      const scored = selectedDirection !== gkDir || Math.random() < 0.3;
      setPenaltyResult(scored ? "goal" : "saved");
    }
  };

  const handleKickComplete = useCallback(async (scored: boolean) => {
    if (scored && playerId) {
      await recordGoal(playerId);
    }
    setPenaltyDone(true);
  }, [playerId]);

  const winner = players.find((p) => p.is_winner);
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const myRank = sorted.findIndex((p) => p.id === playerId) + 1;

  // ========== FINISHED ==========
  if (status === "finished" && winner) {
    const isSelf = winner.id === playerId;
    return (
      <div className="min-h-screen flex flex-col bg-[#1a1a2e] relative overflow-hidden">
        {/* Confetti for winner */}
        {isSelf && <MiniConfetti />}

        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 relative z-10">
          {isSelf ? (
            <>
              <div className="text-5xl mb-1 animate-[crownDrop_0.8s_ease-out]">👑</div>
              <div className="text-7xl mb-3 animate-[popIn_0.5s_ease-out_0.3s_backwards]">
                {winner.avatar}
              </div>
              <h2 className="text-3xl font-black text-white mb-1">You Won!</h2>
              <p className="text-[#00FF88] text-2xl font-bold mb-6">
                {winner.score} points
              </p>
              {currentTournament && currentTournament.prize_amount > 0 && (
                <div
                  className="bg-[#0D1117] border-2 border-[#00FF88]/30 rounded-2xl px-8 py-5 text-center mb-6"
                  style={{ boxShadow: "0 0 40px rgba(0, 255, 136, 0.15)" }}
                >
                  <p className="text-gray-400 text-sm mb-1">Your prize</p>
                  <p className="text-[#00FF88] text-4xl font-black">
                    {currentTournament.prize_amount} AVAX
                  </p>
                </div>
              )}
              <button
                onClick={() => router.push(`/claim/${code}`)}
                className="bg-[#00FF88] text-black font-black py-4 px-8 rounded-2xl text-lg active:scale-95 transform"
                style={{ boxShadow: "0 0 30px rgba(0, 255, 136, 0.4)" }}
              >
                Claim Prize
              </button>
            </>
          ) : (
            <>
              <div className="text-5xl mb-3">{winner.avatar}</div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {winner.nickname} won!
              </h2>
              <p className="text-[#00FF88] text-xl font-bold mb-6">
                {winner.score} points
              </p>
              {myRank > 0 && (
                <div className="bg-[#0D1117] border border-white/10 rounded-2xl px-6 py-4 text-center">
                  <p className="text-gray-400 text-sm">Your position</p>
                  <p className="text-white text-3xl font-black">#{myRank}</p>
                  <p className="text-gray-400 text-sm">
                    {myPlayer?.score ?? 0} pts
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Compact leaderboard */}
        <div className="relative z-10 px-4 pb-2">
          <CompactLeaderboard players={sorted} myId={playerId} />
        </div>

        {/* Play Again */}
        <div className="relative z-10 px-4 pb-4 text-center">
          <button
            onClick={() => router.push("/play")}
            className="mt-2 border border-white/20 text-white font-bold py-3 px-8 rounded-2xl text-base active:scale-95 transform hover:border-[#00FF88]/50 hover:text-[#00FF88] transition-all"
          >
            Play Again
          </button>
        </div>

        <style>{ANIMATIONS_CSS}</style>
      </div>
    );
  }

  if (!currentTournament || !question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e]">
        <div className="text-[#00FF88] text-xl animate-pulse font-bold">
          Loading...
        </div>
      </div>
    );
  }

  // Timer color
  const timerColor =
    timeLeft > 10 ? "#00FF88" : timeLeft > 5 ? "#FFD700" : "#FF4444";

  return (
    <div className="min-h-screen flex flex-col bg-[#1a1a2e] relative overflow-hidden">
      {/* Score popup */}
      {scorePopup && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <span
            className="text-[#00FF88] text-4xl font-black animate-[scoreFloat_1.5s_ease-out_forwards]"
            style={{ textShadow: "0 0 20px rgba(0, 255, 136, 0.6)" }}
          >
            {scorePopup}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">
            {currentQ + 1}/{QUESTIONS_PER_GAME}
          </span>
          {/* Progress dots */}
          <div className="flex gap-1">
            {gameQuestions.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i < currentQ
                    ? "bg-[#00FF88]"
                    : i === currentQ
                      ? "bg-[#00FF88] animate-pulse"
                      : "bg-gray-700"
                }`}
              />
            ))}
          </div>
        </div>
        {myPlayer && (
          <div className="flex items-center gap-1.5 bg-[#0D1117] rounded-lg px-3 py-1.5">
            <span className="text-sm">{myPlayer.avatar}</span>
            <span className="text-[#00FF88] font-bold text-sm tabular-nums">
              {myPlayer.score}
            </span>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col px-4 py-3">
        {/* ========== QUESTION - NOT ANSWERED ========== */}
        {status === "question" && !answered && (
          <>
            {/* Timer */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className="text-3xl font-black tabular-nums transition-colors"
                  style={{
                    color: timerColor,
                    textShadow: timeLeft <= 5 ? `0 0 15px ${timerColor}80` : "none",
                  }}
                >
                  {timeLeft}
                </span>
                {timeLeft <= 5 && (
                  <span className="text-red-400 text-xs font-bold animate-pulse uppercase tracking-wider">
                    Hurry!
                  </span>
                )}
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-linear"
                  style={{
                    width: `${(timeLeft / 20) * 100}%`,
                    backgroundColor: timerColor,
                    boxShadow: `0 0 10px ${timerColor}80`,
                  }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="bg-[#0D1117] border border-white/10 rounded-2xl px-5 py-4 mb-4">
              <h2 className="text-xl text-white font-bold text-center leading-snug">
                {question.question}
              </h2>
            </div>

            {/* Options - Kahoot style */}
            <div className="grid grid-cols-2 gap-2.5 flex-1">
              {question.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmitAnswer(i)}
                  className="rounded-2xl flex flex-col items-center justify-center gap-1 px-3 py-4 min-h-[80px] active:scale-[0.93] transition-transform"
                  style={{
                    backgroundColor: OPT_COLORS[i].bg,
                    boxShadow: `0 4px 15px ${OPT_COLORS[i].bg}50`,
                  }}
                >
                  <span className="text-white/60 text-xl font-bold">
                    {OPT_COLORS[i].icon}
                  </span>
                  <span className="text-white font-bold text-sm text-center leading-tight">
                    {opt}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ========== QUESTION - ANSWERED (feedback) ========== */}
        {status === "question" && answered && (
          <div
            className={`flex-1 flex flex-col items-center justify-center ${
              lastAnswerCorrect
                ? "animate-[flashGreen_0.5s_ease-out]"
                : "animate-[shakeX_0.5s_ease-out]"
            }`}
          >
            {/* Result icon */}
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 animate-[popIn_0.4s_ease-out] ${
                lastAnswerCorrect ? "bg-[#00FF88]/20" : "bg-red-500/20"
              }`}
              style={{
                boxShadow: lastAnswerCorrect
                  ? "0 0 40px rgba(0, 255, 136, 0.3)"
                  : "0 0 40px rgba(255, 68, 68, 0.3)",
              }}
            >
              <span className="text-5xl">
                {lastAnswerCorrect ? "✅" : "❌"}
              </span>
            </div>

            <h2
              className={`text-2xl font-black mb-1 ${
                lastAnswerCorrect ? "text-[#00FF88]" : "text-red-400"
              }`}
            >
              {lastAnswerCorrect ? "Correct!" : "Incorrect"}
            </h2>

            {/* Show correct answer if wrong */}
            {!lastAnswerCorrect && (
              <p className="text-gray-400 text-sm mt-2">
                Answer: {question.options[question.correctIndex]}
              </p>
            )}

            <div className="mt-6">
              <JuggleBall />
            </div>
          </div>
        )}

        {/* ========== PENALTY - PLAYING ========== */}
        {status === "penalty" && !penaltyDone && (
          <PenaltyArena
            penaltyTimeLeft={penaltyTimeLeft}
            kicked={kicked}
            selectedDirection={selectedDirection}
            goalkeeperDirection={goalkeeperDirection}
            penaltyResult={penaltyResult}
            goalkeeperLogo={currentTournament?.goalkeeper_logo ?? null}
            onDirectionSelect={handleDirectionSelect}
            onKick={handleKick}
            onKickComplete={handleKickComplete}
          />
        )}

        {/* ========== PENALTY DONE - WAITING ========== */}
        {status === "penalty" && penaltyDone && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <JuggleBall />
            <p className="text-gray-400 font-semibold mt-4">
              Waiting for results...
            </p>
          </div>
        )}

        {/* ========== RESULTS ========== */}
        {status === "results" && (
          <div className="flex-1 flex flex-col">
            <h2 className="text-xl text-white font-black text-center mb-1">
              Ranking
            </h2>
            <p className="text-gray-500 text-center text-sm mb-4">
              Question {currentQ + 1} of {QUESTIONS_PER_GAME}
            </p>

            {/* My position highlight */}
            {myRank > 0 && (
              <div
                className="flex items-center justify-center gap-3 bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-2xl px-4 py-3 mb-4 animate-[popIn_0.4s_ease-out]"
                style={{ boxShadow: "0 0 20px rgba(0, 255, 136, 0.1)" }}
              >
                <span className="text-white font-black text-2xl">
                  #{myRank}
                </span>
                <span className="text-lg">{myPlayer?.avatar}</span>
                <span className="text-white font-bold flex-1">
                  {myPlayer?.nickname}
                </span>
                <span className="text-[#00FF88] font-black text-xl">
                  {myPlayer?.score}
                </span>
              </div>
            )}

            {/* Full leaderboard */}
            <CompactLeaderboard players={sorted} myId={playerId} />
          </div>
        )}
      </div>

      <style>{ANIMATIONS_CSS}</style>
    </div>
  );
}

// ---- Penalty Arena (CSS goal) ----
function PenaltyArena({
  penaltyTimeLeft,
  kicked,
  selectedDirection,
  goalkeeperDirection,
  penaltyResult,
  goalkeeperLogo,
  onDirectionSelect,
  onKick,
  onKickComplete,
}: {
  penaltyTimeLeft: number;
  kicked: boolean;
  selectedDirection: Direction | null;
  goalkeeperDirection: Direction | null;
  penaltyResult: "goal" | "saved" | null;
  goalkeeperLogo: string | null;
  onDirectionSelect: (d: Direction) => void;
  onKick: () => void;
  onKickComplete: (scored: boolean) => void;
}) {
  const [resultShown, setResultShown] = useState(false);

  useEffect(() => {
    if (penaltyResult && !resultShown) {
      const t = setTimeout(() => {
        setResultShown(true);
        onKickComplete(penaltyResult === "goal");
      }, 1400);
      return () => clearTimeout(t);
    }
  }, [penaltyResult, resultShown, onKickComplete]);

  useEffect(() => {
    if (!kicked) setResultShown(false);
  }, [kicked]);

  const timerPct = penaltyTimeLeft / 10;
  const timerColor =
    penaltyTimeLeft > 5 ? "#00FF88" : penaltyTimeLeft > 2 ? "#FFD700" : "#FF4444";

  // Goalkeeper dive position
  const gkDiveX: Record<Direction, string> = { left: "-35%", center: "0%", right: "35%" };
  const gkDiveRotate: Record<Direction, string> = { left: "-25deg", center: "0deg", right: "25deg" };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="text-center mb-2">
        <h2 className="text-xl text-white font-black flex items-center justify-center gap-2">
          <span className="animate-[ballSpin_1s_linear_infinite]">&#9917;</span>
          Take the Penalty!
        </h2>
        <p className="text-xs mt-1 font-semibold text-gray-400">
          Pick a corner and kick!
        </p>
      </div>

      {/* Goal frame with timer arc */}
      <div className="flex-1 flex flex-col items-center justify-center px-2">
        <div className="relative w-full max-w-[340px] mx-auto">
          {/* Circular timer behind goal */}
          {!kicked && (
            <svg className="absolute -inset-3 z-0" viewBox="0 0 200 140" fill="none">
              <path d="M 15 130 A 85 85 0 0 1 185 130" stroke="rgba(255,255,255,0.08)" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M 15 130 A 85 85 0 0 1 185 130" stroke={timerColor} strokeWidth="4" strokeLinecap="round" fill="none"
                strokeDasharray={`${timerPct * 268} 268`}
                style={{ transition: "stroke-dasharray 1s linear, stroke 0.3s", filter: `drop-shadow(0 0 6px ${timerColor}80)` }}
              />
              <text x="100" y="28" textAnchor="middle" fill={timerColor} fontSize="18" fontWeight="900" fontFamily="monospace"
                style={{ filter: `drop-shadow(0 0 4px ${timerColor}60)` }}
              >{penaltyTimeLeft}</text>
            </svg>
          )}

          {/* Goal structure */}
          <div className="goal-frame relative" style={{
            aspectRatio: "16/10",
            border: "4px solid rgba(255,255,255,0.7)",
            borderBottom: "none",
            borderRadius: "8px 8px 0 0",
            background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,255,136,0.03) 100%)",
          }}>
            {/* Net pattern */}
            <div className="absolute inset-0 overflow-hidden rounded-t-[4px]" style={{
              backgroundImage: `
                linear-gradient(45deg, rgba(255,255,255,0.04) 1px, transparent 1px),
                linear-gradient(-45deg, rgba(255,255,255,0.04) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px),
                linear-gradient(0deg, rgba(255,255,255,0.06) 1px, transparent 1px)
              `,
              backgroundSize: "14px 14px, 14px 14px, 20px 20px, 20px 20px",
            }} />

            {/* Goal post depth effect */}
            <div className="absolute -left-1 top-0 bottom-0 w-2 rounded-l" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))" }} />
            <div className="absolute -right-1 top-0 bottom-0 w-2 rounded-r" style={{ background: "linear-gradient(270deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))" }} />
            <div className="absolute -top-1 left-0 right-0 h-2 rounded-t" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))" }} />

            {/* 3 clickable zones */}
            <div className="absolute inset-0 grid grid-cols-3 z-10">
              {(["left", "center", "right"] as Direction[]).map((dir) => {
                const isSelected = selectedDirection === dir;
                return (
                  <button
                    key={dir}
                    onClick={() => !kicked && onDirectionSelect(dir)}
                    className="relative flex items-center justify-center transition-all duration-200"
                    style={{
                      background: isSelected ? "rgba(0, 255, 136, 0.15)" : "transparent",
                      borderLeft: dir !== "left" ? "1px dashed rgba(255,255,255,0.1)" : "none",
                    }}
                  >
                    {!kicked && (
                      <span className="text-xs font-bold uppercase tracking-widest transition-all" style={{
                        color: isSelected ? "#00FF88" : "rgba(255,255,255,0.2)",
                        textShadow: isSelected ? "0 0 10px rgba(0,255,136,0.5)" : "none",
                      }}>
                        {dir === "left" ? "LEFT" : dir === "center" ? "CENTER" : "RIGHT"}
                      </span>
                    )}
                    {isSelected && !kicked && (
                      <div className="absolute inset-2 rounded-lg border-2 border-[#00FF88]/40 animate-pulse"
                        style={{ boxShadow: "inset 0 0 20px rgba(0,255,136,0.1), 0 0 15px rgba(0,255,136,0.1)" }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Goalkeeper - visible at all times */}
            <div
              className="absolute z-30 flex flex-col items-center transition-all"
              style={{
                bottom: "2%",
                left: "50%",
                transform: kicked && goalkeeperDirection
                  ? `translateX(calc(-50% + ${gkDiveX[goalkeeperDirection]})) rotate(${gkDiveRotate[goalkeeperDirection]}) ${penaltyResult === "saved" ? "scaleX(" + (goalkeeperDirection === "left" ? "-1" : "1") + ")" : ""}`
                  : "translateX(-50%)",
                transition: kicked ? "all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)" : "none",
              }}
            >
              {/* Logo on jersey */}
              {(goalkeeperLogo || true) && (
                <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center mb-[-4px] z-10"
                  style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.2)" }}>
                  {goalkeeperLogo ? (
                    <img src={goalkeeperLogo} alt="" className="w-5 h-5 object-contain" />
                  ) : (
                    <span className="text-[10px] font-black text-[#00FF88]">LG</span>
                  )}
                </div>
              )}
              {/* Goalkeeper body */}
              <div className="text-4xl" style={{
                filter: kicked && penaltyResult === "saved"
                  ? "drop-shadow(0 0 15px rgba(255,68,68,0.6))"
                  : "drop-shadow(0 0 8px rgba(255,255,255,0.3))",
              }}>
                🧤
              </div>
              {/* Goalkeeper hands spread on dive */}
              {kicked && penaltyResult === "saved" && (
                <div className="absolute -top-1 text-2xl animate-[gkGrab_0.3s_ease-out_0.5s_forwards]" style={{ opacity: 0 }}>
                  🤲
                </div>
              )}
            </div>

            {/* Ball animation - arc trajectory */}
            {kicked && selectedDirection && (
              <div className="absolute z-20 text-3xl" style={{
                left: "50%",
                top: "100%",
                transform: "translate(-50%, 0)",
                animation: `ballArc_${selectedDirection} 0.7s cubic-bezier(0.22, 0.61, 0.36, 1) forwards`,
              }}>
                &#9917;
              </div>
            )}

            {/* Net shake on goal */}
            {penaltyResult === "goal" && (
              <div className="absolute inset-0 animate-[netShake_0.5s_ease-out_0.4s] rounded-t-[4px] overflow-hidden">
                <div className="w-full h-full" style={{
                  backgroundImage: `
                    linear-gradient(90deg, rgba(0,255,136,0.15) 1px, transparent 1px),
                    linear-gradient(0deg, rgba(0,255,136,0.15) 1px, transparent 1px)
                  `,
                  backgroundSize: "20px 20px",
                }} />
              </div>
            )}
          </div>

          {/* Realistic grass field */}
          <div className="relative h-10 rounded-b-lg overflow-hidden" style={{
            background: "linear-gradient(180deg, #1a5c2a 0%, #2d8a4e 30%, #1f6b35 60%, #1a5c2a 100%)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.1)",
          }}>
            {/* Grass stripes */}
            <div className="absolute inset-0" style={{
              backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,255,255,0.03) 20px, rgba(255,255,255,0.03) 40px)",
            }} />
            {/* Penalty spot */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/30" />
            {/* Goal line */}
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{
              background: "linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.6), rgba(255,255,255,0.3))",
            }} />
          </div>

          {/* Ball at bottom before kick */}
          {!kicked && (
            <div className="flex justify-center mt-3">
              <div className="text-4xl animate-[ballReady_2s_ease-in-out_infinite]" style={{
                filter: selectedDirection
                  ? "drop-shadow(0 0 12px rgba(0,255,136,0.5))"
                  : "drop-shadow(0 0 6px rgba(255,255,255,0.2))",
              }}>
                &#9917;
              </div>
            </div>
          )}
        </div>

        {/* Result overlay */}
        {penaltyResult && (
          <div className={`mt-4 text-center ${
            penaltyResult === "goal" ? "animate-[goalCelebrate_0.6s_ease-out]" : "animate-[shakeX_0.5s_ease-out]"
          }`}>
            <p className={`text-3xl font-black ${penaltyResult === "goal" ? "text-[#00FF88]" : "text-red-400"}`}
              style={{
                textShadow: penaltyResult === "goal"
                  ? "0 0 30px rgba(0,255,136,0.5), 0 0 60px rgba(0,255,136,0.2)"
                  : "0 0 20px rgba(255,68,68,0.4)",
              }}>
              {penaltyResult === "goal" ? "GOAAL!" : "Saved!"}
            </p>
            {penaltyResult === "goal" && (
              <p className="text-[#00FF88] text-lg font-bold mt-1 animate-[scoreFloat_1.5s_ease-out_forwards]">+50 pts</p>
            )}
          </div>
        )}
      </div>

      {/* Kick button */}
      {!kicked && (
        <div className="px-2 pb-2 mt-auto">
          <button
            onClick={onKick}
            disabled={!selectedDirection}
            className="w-full font-black py-5 rounded-2xl text-xl active:scale-[0.95] transform transition-all disabled:opacity-20"
            style={{
              background: selectedDirection ? "linear-gradient(135deg, #00FF88, #00CC6A)" : "#222",
              color: selectedDirection ? "#000" : "#555",
              boxShadow: selectedDirection ? "0 0 30px rgba(0,255,136,0.35), 0 4px 15px rgba(0,0,0,0.3)" : "none",
            }}
          >
            {selectedDirection ? (
              <span className="flex items-center justify-center gap-2">
                <span className="text-2xl">&#9917;</span> KICK!
              </span>
            ) : (
              "Choose where to kick"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ---- Compact mobile leaderboard ----
function CompactLeaderboard({
  players,
  myId,
}: {
  players: Player[];
  myId: string | null;
}) {
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="flex flex-col gap-1.5">
      {players.map((p, i) => {
        const isMe = p.id === myId;
        return (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 animate-[slideIn_0.4s_ease-out]"
            style={{
              animationDelay: `${i * 0.06}s`,
              animationFillMode: "backwards",
              backgroundColor: isMe
                ? "rgba(0, 255, 136, 0.1)"
                : "rgba(13, 17, 23, 0.5)",
              border: isMe
                ? "1px solid rgba(0, 255, 136, 0.25)"
                : "1px solid rgba(255, 255, 255, 0.04)",
            }}
          >
            <span className="min-w-[28px] text-center">
              {i < 3 ? (
                <span className="text-lg">{medals[i]}</span>
              ) : (
                <span className="text-gray-600 font-bold text-sm">
                  {i + 1}
                </span>
              )}
            </span>
            <span className="text-xl">{p.avatar}</span>
            <span
              className={`font-semibold text-sm flex-1 truncate ${
                isMe ? "text-white" : "text-gray-300"
              }`}
            >
              {p.nickname}
              {isMe && (
                <span className="text-[#00FF88] text-xs ml-1">(you)</span>
              )}
            </span>
            <span
              className={`font-bold tabular-nums text-sm ${
                isMe ? "text-[#00FF88]" : "text-gray-500"
              }`}
            >
              {p.score}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---- Mini confetti for winner ----
function MiniConfetti() {
  const [particles, setParticles] = useState<
    { id: number; x: number; color: string; delay: number; size: number; dur: number }[]
  >([]);
  useEffect(() => {
    const colors = ["#00FF88", "#FFD700", "#FF6B6B", "#4ECDC4", "#E21B3C", "#1368CE"];
    setParticles(
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 2,
        size: 4 + Math.random() * 7,
        dur: 2 + Math.random() * 3,
      }))
    );
  }, []);
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: "-10px",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            animation: `confettiFall ${p.dur}s ${p.delay}s linear infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ---- CSS Animations ----
const ANIMATIONS_CSS = `
  @keyframes popIn {
    0% { opacity: 0; transform: scale(0.5); }
    70% { transform: scale(1.1); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes scoreFloat {
    0% { opacity: 1; transform: translateY(0) scale(1); }
    50% { opacity: 1; transform: translateY(-30px) scale(1.2); }
    100% { opacity: 0; transform: translateY(-60px) scale(0.8); }
  }
  @keyframes flashGreen {
    0% { background-color: rgba(0, 255, 136, 0.15); }
    100% { background-color: transparent; }
  }
  @keyframes shakeX {
    0%, 100% { transform: translateX(0); }
    15% { transform: translateX(-8px); }
    30% { transform: translateX(8px); }
    45% { transform: translateX(-6px); }
    60% { transform: translateX(6px); }
    75% { transform: translateX(-3px); }
    90% { transform: translateX(3px); }
  }
  @keyframes crownDrop {
    0% { opacity: 0; transform: translateY(-40px) rotate(-15deg); }
    60% { transform: translateY(3px) rotate(3deg); }
    100% { opacity: 1; transform: translateY(0) rotate(0deg); }
  }
  @keyframes confettiFall {
    0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }
  @keyframes ballSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes ballReady {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
  @keyframes ballArc_left {
    0% {
      left: 50%; top: 100%;
      transform: translate(-50%, 0) scale(1) rotate(0deg);
    }
    40% {
      left: 35%; top: 40%;
      transform: translate(-50%, -50%) scale(0.85) rotate(-180deg);
    }
    100% {
      left: 18%; top: 28%;
      transform: translate(-50%, -50%) scale(0.7) rotate(-360deg);
    }
  }
  @keyframes ballArc_center {
    0% {
      left: 50%; top: 100%;
      transform: translate(-50%, 0) scale(1) rotate(0deg);
    }
    40% {
      left: 50%; top: 45%;
      transform: translate(-50%, -50%) scale(0.9) rotate(-180deg);
    }
    100% {
      left: 50%; top: 18%;
      transform: translate(-50%, -50%) scale(0.7) rotate(-360deg);
    }
  }
  @keyframes ballArc_right {
    0% {
      left: 50%; top: 100%;
      transform: translate(-50%, 0) scale(1) rotate(0deg);
    }
    40% {
      left: 65%; top: 40%;
      transform: translate(-50%, -50%) scale(0.85) rotate(180deg);
    }
    100% {
      left: 82%; top: 28%;
      transform: translate(-50%, -50%) scale(0.7) rotate(360deg);
    }
  }
  @keyframes gkGrab {
    0% { opacity: 0; transform: scale(0.5); }
    100% { opacity: 1; transform: scale(1.2); }
  }
  @keyframes netShake {
    0% { transform: translateX(0); }
    10% { transform: translateX(4px) translateY(-2px); }
    20% { transform: translateX(-4px) translateY(2px); }
    30% { transform: translateX(3px) translateY(-1px); }
    40% { transform: translateX(-2px) translateY(1px); }
    50% { transform: translateX(1px); }
    100% { transform: translateX(0); }
  }
  @keyframes gkDive {
    0% { opacity: 0; transform: scale(0.3) rotate(-20deg); }
    60% { transform: scale(1.3) rotate(5deg); }
    100% { opacity: 1; transform: scale(1) rotate(0deg); }
  }
  @keyframes goalCelebrate {
    0% { opacity: 0; transform: scale(0.3); }
    50% { transform: scale(1.2); }
    70% { transform: scale(0.95); }
    100% { opacity: 1; transform: scale(1); }
  }
`;
