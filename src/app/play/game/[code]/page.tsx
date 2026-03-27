"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTournament, submitAnswer, recordGoal } from "@/lib/gameLogic";
import { useGameSync } from "@/hooks/useGameSync";
import { useCountdown } from "@/hooks/useCountdown";
import { getGameQuestions, QUESTIONS_PER_GAME } from "@/lib/questions";
import type { Tournament, Player, Direction } from "@/types/game";
import JuggleBall from "@/components/JuggleBall";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  playCorrect,
  playIncorrect,
  playGoal,
  playSaved,
  playWin,
  isMuted,
  toggleMute,
} from "@/lib/sounds";

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
  const { t } = useLanguage();
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

  // Sound mute state — initialized from localStorage after mount
  const [muted, setMuted] = useState(false);
  useEffect(() => {
    setMuted(isMuted());
  }, []);

  const handleToggleMute = () => {
    const next = toggleMute();
    setMuted(next);
  };

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
      const startedAt = currentTournament?.question_started_at;
      if (startedAt) {
        const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
        const remaining = Math.max(0, 20 - elapsed);
        restart(remaining);
      } else {
        restart(20);
      }
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

  // Sound effects
  useEffect(() => {
    if (lastAnswerCorrect === true) playCorrect();
    else if (lastAnswerCorrect === false) playIncorrect();
  }, [lastAnswerCorrect]);

  useEffect(() => {
    if (penaltyResult === "goal") playGoal();
    else if (penaltyResult === "saved") playSaved();
  }, [penaltyResult]);

  useEffect(() => {
    if (status === "finished" && winner && winner.id === playerId) {
      playWin();
    }
  }, [status, winner, playerId]);

  // ========== FINISHED ==========
  if (status === "finished" && winner) {
    const isSelf = winner.id === playerId;
    return (
      <div className="min-h-screen flex flex-col bg-surface font-body relative overflow-hidden">
        {/* Background effects */}
        <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(0,253,135,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-container/10 blur-[120px] rounded-full pointer-events-none" />

        {/* Confetti for winner */}
        {isSelf && <MiniConfetti />}

        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 relative z-10">
          {isSelf ? (
            <>
              {/* Winner celebration hero */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-yellow-400/30 blur-[60px] rounded-full scale-150 animate-pulse" />
                <div className="relative">
                  <div className="text-5xl mb-1 animate-[crownDrop_0.8s_ease-out]">&#128081;</div>
                  <div className="text-7xl mb-3 animate-[popIn_0.5s_ease-out_0.3s_backwards]">
                    {winner.avatar}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-2xl">&#127942;</span>
                <h2 className="font-headline font-black text-4xl tracking-tighter uppercase italic text-on-surface">{t("game.youWon")}</h2>
                <span className="text-2xl">&#127942;</span>
              </div>
              <p className="font-body text-primary uppercase tracking-[0.2em] text-xs font-bold mb-4">Absolute Champion</p>
              <p className="text-primary-container font-headline text-2xl font-bold mb-6">
                {winner.score} {t("game.points")}
              </p>
              {currentTournament && currentTournament.prize_amount > 0 && (
                <div
                  className="bg-lucky-card border-2 border-primary/30 rounded-2xl px-8 py-5 text-center mb-6"
                  style={{ boxShadow: "0 0 40px rgba(0, 253, 135, 0.15)" }}
                >
                  <p className="text-on-surface-variant text-sm mb-1 font-body">{t("game.yourPrize")}</p>
                  <p className="text-primary-container text-4xl font-headline font-black">
                    {currentTournament.prize_amount} AVAX
                  </p>
                </div>
              )}
              <button
                onClick={() => router.push(`/claim/${code}`)}
                className="w-full max-w-sm py-5 bg-gradient-to-r from-primary-container to-primary-dim text-on-primary font-headline font-black rounded-xl text-lg uppercase tracking-widest active:scale-95 transition-all shadow-[0_15px_30px_rgba(0,253,135,0.2)]"
              >
                {t("game.claimPrize")}
              </button>
            </>
          ) : (
            <>
              <div className="text-5xl mb-3">{winner.avatar}</div>
              <h2 className="text-2xl font-headline font-bold text-on-surface mb-1">
                {winner.nickname} {t("game.won")}
              </h2>
              <p className="text-primary font-headline text-xl font-bold mb-6">
                {winner.score} {t("game.points")}
              </p>
              {myRank > 0 && (
                <div className="bg-lucky-card border border-outline-variant/20 rounded-2xl px-6 py-4 text-center">
                  <p className="text-on-surface-variant text-sm font-body">{t("game.yourPosition")}</p>
                  <p className="text-on-surface text-3xl font-headline font-black">#{myRank}</p>
                  <p className="text-on-surface-variant text-sm font-body">
                    {myPlayer?.score ?? 0} pts
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="relative z-10 px-4 pb-2 flex gap-3 max-w-sm mx-auto w-full">
          <button
            onClick={() => {
              const text = `I ${isSelf ? "won" : "played"} Lucky Goal! ${isSelf ? winner.score + " pts" : ""}\n${typeof window !== "undefined" ? window.location.origin : ""}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
            }}
            className="flex-1 py-4 bg-surface-container-high border border-outline-variant/20 rounded-xl font-body text-on-surface text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-surface-bright transition-colors"
          >
            Share Results
          </button>
          <button
            onClick={() => router.push("/play")}
            className="flex-1 py-4 bg-surface-container-high border border-outline-variant/20 rounded-xl font-body text-on-surface text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-surface-bright transition-colors"
          >
            {t("game.playAgain")}
          </button>
        </div>

        {/* Compact leaderboard */}
        <div className="relative z-10 px-4 pb-2">
          <CompactLeaderboard players={sorted} myId={playerId} />
        </div>

        <style>{ANIMATIONS_CSS}</style>
      </div>
    );
  }

  if (!currentTournament || !question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-primary text-xl animate-pulse font-headline font-bold">
          {t("game.loading")}
        </div>
      </div>
    );
  }

  // Timer color
  const timerColor =
    timeLeft > 10 ? "#00fd87" : timeLeft > 5 ? "#FFD700" : "#FF4444";

  return (
    <div className="min-h-screen flex flex-col bg-surface font-body relative overflow-hidden">
      {/* Hex pattern overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-40" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-opacity='0.05' fill='%23ffffff' fill-rule='evenodd'/%3E%3C/svg%3E\")" }} />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />

      {/* Score popup */}
      {scorePopup && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <span
            className="text-primary-container text-4xl font-headline font-black animate-[scoreFloat_1.5s_ease-out_forwards]"
            style={{ textShadow: "0 0 20px rgba(0, 253, 135, 0.6)" }}
          >
            {scorePopup}
          </span>
        </div>
      )}

      {/* Header */}
      <header className="bg-surface/80 backdrop-blur-xl flex justify-between items-center w-full px-4 py-3 z-50 shadow-[0_1px_20px_rgba(0,0,0,0.4)] relative">
        <div className="flex items-center gap-2">
          <span className="font-body text-on-surface-variant text-xs tracking-[0.2em] font-semibold uppercase">
            {currentQ + 1}/{QUESTIONS_PER_GAME}
          </span>
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {gameQuestions.map((_, i) => (
              <div
                key={i}
                className={`w-8 h-1.5 rounded-full transition-all ${
                  i < currentQ
                    ? "bg-primary-dim shadow-[0_0_8px_rgba(0,237,126,0.4)]"
                    : i === currentQ
                      ? "bg-primary-container shadow-[0_0_8px_rgba(0,253,135,0.4)]"
                      : "bg-surface-variant/50 border border-outline-variant/10"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {myPlayer && (
            <div className="flex items-center gap-1.5 bg-surface-container-high/80 backdrop-blur-md rounded-full px-3 py-1.5 border border-primary/20 shadow-[0_0_15px_rgba(0,253,135,0.1)]">
              <span className="text-sm">{myPlayer.avatar}</span>
              <span className="text-primary-container font-headline font-bold text-sm tabular-nums">
                {myPlayer.score}
              </span>
            </div>
          )}
          <button
            onClick={handleToggleMute}
            aria-label={muted ? t("game.unmute") : t("game.mute")}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-high text-base active:scale-90 transition-transform"
            style={{ opacity: muted ? 0.45 : 1 }}
          >
            {muted ? "🔇" : "🔊"}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col px-4 py-3 relative z-10">
        {/* ========== QUESTION - NOT ANSWERED ========== */}
        {status === "question" && !answered && (
          <>
            {/* Circular Timer */}
            <div className="relative flex flex-col items-center mb-6">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r="58" fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                  <circle
                    cx="64" cy="64" r="58" fill="transparent"
                    stroke={timerColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="364.4"
                    strokeDashoffset={364.4 * (1 - timeLeft / 20)}
                    style={{
                      transition: "stroke-dashoffset 1s linear, stroke 0.3s",
                      transform: "rotate(-90deg)",
                      transformOrigin: "50% 50%",
                      filter: `drop-shadow(0 0 8px ${timerColor}99)`,
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-headline text-4xl font-bold text-on-surface tracking-tighter">{timeLeft}</span>
                </div>
              </div>
              {timeLeft <= 5 && (
                <span className="text-error text-xs font-body font-bold animate-pulse uppercase tracking-wider mt-2">
                  {t("game.hurry")}
                </span>
              )}
            </div>

            {/* Question */}
            <div className="w-full text-center mb-6">
              <h1 className="font-headline text-2xl font-bold text-on-surface leading-tight tracking-tight">
                {question.question}
              </h1>
            </div>

            {/* Options - Kahoot style with glass */}
            <div className="grid grid-cols-2 gap-4 flex-1 max-w-md mx-auto w-full">
              {question.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmitAnswer(i)}
                  className="group relative rounded-xl flex flex-col items-center justify-center gap-3 px-3 py-5 min-h-[90px] active:scale-95 transition-all"
                  style={{
                    background: `rgba(${i === 0 ? "226,27,60" : i === 1 ? "19,104,206" : i === 2 ? "216,158,0" : "38,137,12"}, 0.12)`,
                    backdropFilter: "blur(20px)",
                    border: `1px solid ${OPT_COLORS[i].bg}4D`,
                    boxShadow: `inset 0 0 20px ${OPT_COLORS[i].bg}1A`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: OPT_COLORS[i].bg,
                      boxShadow: `0 0 15px ${OPT_COLORS[i].bg}66`,
                    }}
                  >
                    <span className="text-white font-bold text-lg">
                      {OPT_COLORS[i].icon}
                    </span>
                  </div>
                  <span className="text-on-surface font-body font-semibold text-base text-center leading-tight">
                    {opt}
                  </span>
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
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
                lastAnswerCorrect ? "bg-primary-container/20" : "bg-error/20"
              }`}
              style={{
                boxShadow: lastAnswerCorrect
                  ? "0 0 40px rgba(0, 253, 135, 0.3)"
                  : "0 0 40px rgba(255, 68, 68, 0.3)",
              }}
            >
              <span className="text-5xl">
                {lastAnswerCorrect ? "&#9989;" : "&#10060;"}
              </span>
            </div>

            <h2
              className={`text-2xl font-headline font-black mb-1 ${
                lastAnswerCorrect ? "text-primary-container" : "text-error"
              }`}
            >
              {lastAnswerCorrect ? t("game.correct") : t("game.incorrect")}
            </h2>

            {/* Show correct answer if wrong */}
            {!lastAnswerCorrect && (
              <p className="text-on-surface-variant text-sm mt-2 font-body">
                {t("game.answer")}: {question.options[question.correctIndex]}
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
              {t("game.waitingResults")}
            </p>
          </div>
        )}

        {/* ========== RESULTS ========== */}
        {status === "results" && (
          <div className="flex-1 flex flex-col">
            <h2 className="text-xl text-on-surface font-headline font-black text-center mb-1 uppercase">
              {t("game.ranking")}
            </h2>
            <p className="text-on-surface-variant text-center text-xs font-body uppercase tracking-widest mb-4">
              Question {currentQ + 1} of {QUESTIONS_PER_GAME}
            </p>

            {/* My position highlight */}
            {myRank > 0 && (
              <div
                className="flex items-center justify-center gap-3 bg-primary-container/10 border border-primary/30 rounded-2xl px-4 py-3 mb-4 animate-[popIn_0.4s_ease-out]"
                style={{ boxShadow: "0 0 20px rgba(0, 253, 135, 0.1)" }}
              >
                <span className="text-on-surface font-headline font-black text-2xl">
                  #{myRank}
                </span>
                <span className="text-lg">{myPlayer?.avatar}</span>
                <span className="text-on-surface font-body font-bold flex-1">
                  {myPlayer?.nickname}
                </span>
                <span className="text-primary-container font-headline font-black text-xl">
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

// ---- Goalkeeper SVG character ----
function GoalkeeperSVG({
  diveDir,
  dived,
  saved,
  logo,
}: {
  diveDir: Direction | null;
  dived: boolean;
  saved: boolean;
  logo: string | null;
}) {
  const diveTranslateX =
    dived && diveDir ? (diveDir === "left" ? -52 : diveDir === "right" ? 52 : 0) : 0;
  const diveTranslateY = dived && diveDir ? (diveDir === "center" ? -16 : 8) : 0;
  const diveRotate =
    dived && diveDir ? (diveDir === "left" ? -44 : diveDir === "right" ? 44 : 0) : 0;

  // Arms: spread wide at rest; stretch hard toward dive side on kick
  const leftArmAngle =
    dived && diveDir
      ? diveDir === "left"
        ? -155
        : diveDir === "center"
          ? -90
          : -45
      : -75;
  const rightArmAngle =
    dived && diveDir
      ? diveDir === "right"
        ? -25
        : diveDir === "center"
          ? -90
          : -135
      : -105;

  const tx = `translate(${diveTranslateX}px, ${diveTranslateY}px) rotate(${diveRotate}deg)`;
  const transition = dived ? "transform 0.55s cubic-bezier(0.25,0.46,0.45,0.94)" : "none";
  const armTransition = dived ? "transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)" : "none";
  const glowColor = saved ? "rgba(255,68,68,0.75)" : "rgba(255,255,255,0.25)";

  return (
    <svg
      viewBox="-32 -62 64 78"
      width="64"
      height="78"
      style={{ transform: tx, transition, filter: `drop-shadow(0 0 8px ${glowColor})`, overflow: "visible" }}
    >
      {/* Legs */}
      <line x1="-6" y1="8" x2="-12" y2="22" stroke="#111827" strokeWidth="6" strokeLinecap="round" />
      <line x1="6" y1="8" x2="12" y2="22" stroke="#111827" strokeWidth="6" strokeLinecap="round" />
      {/* Boots */}
      <ellipse cx="-12" cy="23" rx="6" ry="3.5" fill="#1f2937" />
      <ellipse cx="12" cy="23" rx="6" ry="3.5" fill="#1f2937" />
      {/* Boot highlight */}
      <ellipse cx="-12" cy="22" rx="3" ry="1.5" fill="rgba(255,255,255,0.2)" />
      <ellipse cx="12" cy="22" rx="3" ry="1.5" fill="rgba(255,255,255,0.2)" />

      {/* Torso / jersey */}
      <rect x="-11" y="-9" width="22" height="19" rx="5" fill="#E63946" />
      {/* Jersey centre stripe */}
      <rect x="-3" y="-9" width="6" height="19" rx="2" fill="rgba(255,255,255,0.18)" />
      {/* Jersey collar */}
      <rect x="-5" y="-9" width="10" height="4" rx="2" fill="#c1121f" />

      {/* Logo on jersey */}
      {logo ? (
        <>
          <defs>
            <clipPath id="gkLogoClip">
              <circle cx="0" cy="2" r="6" />
            </clipPath>
          </defs>
          <image href={logo} x="-6" y="-4" width="12" height="12" clipPath="url(#gkLogoClip)" />
        </>
      ) : (
        <text x="0" y="6" textAnchor="middle" fontSize="7" fontWeight="900" fill="#00FF88" fontFamily="monospace">
          LG
        </text>
      )}

      {/* Left arm */}
      <g
        style={{
          transformOrigin: "-11px -3px",
          transform: `rotate(${leftArmAngle + 90}deg)`,
          transition: armTransition,
        }}
      >
        <line x1="-11" y1="-3" x2="-27" y2="-3" stroke="#E63946" strokeWidth="6" strokeLinecap="round" />
        {/* Left glove */}
        <ellipse cx="-29" cy="-3" rx="5.5" ry="4.5" fill="#f5c518" />
        <ellipse cx="-30" cy="-4" rx="2.5" ry="1.5" fill="#d4a010" />
      </g>

      {/* Right arm */}
      <g
        style={{
          transformOrigin: "11px -3px",
          transform: `rotate(${rightArmAngle + 90}deg)`,
          transition: armTransition,
        }}
      >
        <line x1="11" y1="-3" x2="27" y2="-3" stroke="#E63946" strokeWidth="6" strokeLinecap="round" />
        {/* Right glove */}
        <ellipse cx="29" cy="-3" rx="5.5" ry="4.5" fill="#f5c518" />
        <ellipse cx="30" cy="-4" rx="2.5" ry="1.5" fill="#d4a010" />
      </g>

      {/* Neck */}
      <rect x="-4" y="-15" width="8" height="8" rx="2" fill="#f4a261" />

      {/* Head */}
      <ellipse cx="0" cy="-26" rx="12" ry="13" fill="#f4a261" />
      {/* Hair */}
      <path d="M -12 -30 Q 0 -44 12 -30 Q 9 -38 0 -40 Q -9 -38 -12 -30 Z" fill="#5c3d1e" />
      {/* Eyes */}
      <ellipse cx="-4.5" cy="-26" rx="2.2" ry="2.5" fill="#1c1206" />
      <ellipse cx="4.5" cy="-26" rx="2.2" ry="2.5" fill="#1c1206" />
      {/* Eye whites / shine */}
      <circle cx="-3.5" cy="-27" r="0.8" fill="white" />
      <circle cx="5.5" cy="-27" r="0.8" fill="white" />
      {/* Nose */}
      <ellipse cx="0" cy="-21" rx="1.5" ry="1" fill="rgba(0,0,0,0.12)" />
      {/* Mouth */}
      {saved ? (
        <path d="M -4 -17 Q 0 -20 4 -17" stroke="#8b2c0e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M -3 -17 Q 0 -15 3 -17" stroke="#8b2c0e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      )}
      {/* Eyebrows — furrowed on save */}
      {saved ? (
        <>
          <path d="M -7 -30 Q -4 -32 -2 -30" stroke="#5c3d1e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 2 -30 Q 5 -32 7 -30" stroke="#5c3d1e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M -7 -30 Q -4 -31 -2 -30" stroke="#5c3d1e" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M 2 -30 Q 5 -31 7 -30" stroke="#5c3d1e" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

// ---- Penalty Arena (redesigned) ----
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
  const { t } = useLanguage();
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

  // SVG scene: viewBox "0 0 320 240"
  // Goal interior: x=10..310, y=10..178
  // Grass: y=178..220
  // Penalty spot in grass: x=160, y=205
  // GK foreignObject anchor: x=100, y=98 (width=120, height=88)
  // Ball starts at (160, 205) = penalty spot
  // Ball destinations per zone (approx center of zone, mid-height):
  //   left  => (60, 65)   right => (260, 65)   center => (160, 55)

  // Goalkeeper position in scene coordinates when dived:
  // left => foreignObject x shifts to ~30, right => ~170, center => ~100 (stays)
  // We embed this via the GoalkeeperSVG component's own transform so the foreignObject stays fixed.

  // Net vertical lines: 19 lines spaced 16px from x=8 to x=312
  const netVLines = Array.from({ length: 19 }, (_, i) => 8 + (i + 1) * 16);
  // Net horizontal lines: 10 lines spaced 16px from y=8 to y=176
  const netHLines = Array.from({ length: 10 }, (_, i) => 8 + (i + 1) * 16);

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="text-center mb-2">
        <h2 className="text-xl text-white font-black flex items-center justify-center gap-2">
          <span className="animate-[ballSpin_1s_linear_infinite]">&#9917;</span>
          {t("game.penalty")}
        </h2>
        <p className="text-xs mt-1 font-semibold text-gray-400">{t("game.pickCorner")}</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-2">
        <div className="relative w-full max-w-[360px] mx-auto">

          {/* Circular timer arc — sits outside/above the SVG scene */}
          {!kicked && (
            <svg
              className="absolute z-0 pointer-events-none"
              style={{ inset: "-14px" }}
              viewBox="0 0 220 160"
              fill="none"
            >
              <path
                d="M 20 148 A 95 95 0 0 1 200 148"
                stroke="rgba(255,255,255,0.07)"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 20 148 A 95 95 0 0 1 200 148"
                stroke={timerColor}
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${timerPct * 299} 299`}
                style={{
                  transition: "stroke-dasharray 1s linear, stroke 0.3s",
                  filter: `drop-shadow(0 0 6px ${timerColor}80)`,
                }}
              />
              <text
                x="110"
                y="30"
                textAnchor="middle"
                fill={timerColor}
                fontSize="20"
                fontWeight="900"
                fontFamily="monospace"
                style={{ filter: `drop-shadow(0 0 4px ${timerColor}60)` }}
              >
                {penaltyTimeLeft}
              </text>
            </svg>
          )}

          {/* Main scene — all rendered in one SVG for correct layering */}
          <svg
            viewBox="0 0 320 240"
            width="100%"
            style={{ display: "block", overflow: "visible" }}
            aria-label="Penalty kick scene"
          >
            {/* === GRASS === */}
            <rect x="0" y="178" width="320" height="62" fill="#1a5c2a" />
            {/* Alternating grass stripes */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <rect key={i} x={i * 40} y="178" width="20" height="62" fill="rgba(255,255,255,0.022)" />
            ))}
            {/* Penalty area box */}
            <rect
              x="80" y="178" width="160" height="30"
              fill="none"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="1.5"
            />
            {/* Penalty spot */}
            <circle cx="160" cy="214" r="3.5" fill="rgba(255,255,255,0.55)" />
            {/* Goal line */}
            <line x1="0" y1="178" x2="320" y2="178" stroke="rgba(255,255,255,0.65)" strokeWidth="2" />

            {/* === NET (inside goal) === */}
            <rect x="10" y="10" width="300" height="168" fill="rgba(12,16,30,0.88)" />

            {/* Net vertical lines */}
            {netVLines.map((x) => (
              <line key={`nv${x}`} x1={x} y1="10" x2={x} y2="178" stroke="rgba(255,255,255,0.09)" strokeWidth="0.8" />
            ))}
            {/* Net horizontal lines */}
            {netHLines.map((y) => (
              <line key={`nh${y}`} x1="10" y1={y} x2="310" y2={y} stroke="rgba(255,255,255,0.09)" strokeWidth="0.8" />
            ))}
            {/* Net perspective diagonal accents (top portion only) */}
            {Array.from({ length: 8 }, (_, i) => (
              <line
                key={`nd${i}`}
                x1={10 + i * 38}
                y1="10"
                x2={10 + (i + 1) * 38}
                y2="40"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="0.7"
              />
            ))}

            {/* Net ripple on GOAL */}
            {penaltyResult === "goal" && (
              <g style={{ animation: "netShake 0.55s ease-out 0.3s both" }}>
                {netVLines.map((x) => (
                  <line key={`gv${x}`} x1={x} y1="10" x2={x} y2="178" stroke="rgba(0,255,136,0.35)" strokeWidth="1.4" />
                ))}
                {netHLines.map((y) => (
                  <line key={`gh${y}`} x1="10" y1={y} x2="310" y2={y} stroke="rgba(0,255,136,0.35)" strokeWidth="1.4" />
                ))}
              </g>
            )}

            {/* === POSTS === */}
            {/* Left post */}
            <rect x="0" y="0" width="11" height="180" rx="3" fill="white" />
            <rect x="11" y="0" width="5" height="180" fill="rgba(0,0,0,0.3)" />
            <rect x="2" y="2" width="3" height="176" rx="1" fill="rgba(255,255,255,0.55)" />

            {/* Right post */}
            <rect x="309" y="0" width="11" height="180" rx="3" fill="white" />
            <rect x="304" y="0" width="5" height="180" fill="rgba(0,0,0,0.3)" />
            <rect x="315" y="2" width="3" height="176" rx="1" fill="rgba(255,255,255,0.55)" />

            {/* Crossbar */}
            <rect x="0" y="0" width="320" height="11" rx="3" fill="white" />
            <rect x="0" y="11" width="320" height="4" fill="rgba(0,0,0,0.25)" />
            <rect x="2" y="2" width="316" height="3" rx="1" fill="rgba(255,255,255,0.55)" />

            {/* === DIRECTION ZONES (clickable, inside the goal) === */}
            {(["left", "center", "right"] as Direction[]).map((dir, i) => {
              const isSelected = selectedDirection === dir;
              const zx = 11 + i * 99;
              return (
                <g
                  key={dir}
                  onClick={() => !kicked && onDirectionSelect(dir)}
                  style={{ cursor: kicked ? "default" : "pointer" }}
                >
                  {/* Zone highlight fill */}
                  <rect
                    x={zx} y="12" width="99" height="166"
                    fill={isSelected ? "rgba(0,255,136,0.16)" : "rgba(0,0,0,0)"}
                    stroke={isSelected ? "rgba(0,255,136,0.55)" : "none"}
                    strokeWidth="2"
                    rx="2"
                    style={{ transition: "fill 0.18s" }}
                  />
                  {/* Zone dividers */}
                  {i > 0 && (
                    <line
                      x1={zx} y1="16" x2={zx} y2="174"
                      stroke="rgba(255,255,255,0.07)"
                      strokeWidth="1"
                      strokeDasharray="5 5"
                    />
                  )}
                  {/* Direction label */}
                  {!kicked && (
                    <text
                      x={zx + 49} y="100"
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="700"
                      fontFamily="monospace"
                      letterSpacing="2"
                      fill={isSelected ? "#00FF88" : "rgba(255,255,255,0.18)"}
                      style={{
                        textTransform: "uppercase",
                        transition: "fill 0.18s",
                        filter: isSelected ? "drop-shadow(0 0 5px rgba(0,255,136,0.7))" : "none",
                      }}
                    >
                      {dir === "left" ? "LEFT" : dir === "center" ? "CENTER" : "RIGHT"}
                    </text>
                  )}
                </g>
              );
            })}

            {/* === GOALKEEPER (foreignObject so we can use the React SVG component) === */}
            <foreignObject x="96" y="94" width="128" height="92" style={{ overflow: "visible" }}>
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                }}
              >
                <GoalkeeperSVG
                  diveDir={goalkeeperDirection}
                  dived={kicked}
                  saved={penaltyResult === "saved"}
                  logo={goalkeeperLogo}
                />
              </div>
            </foreignObject>

            {/* === BALL at penalty spot (before kick) === */}
            {!kicked && (
              <g style={{ animation: "ballFloat 2s ease-in-out infinite", transformOrigin: "160px 214px" }}>
                {/* Glow ring when direction selected */}
                {selectedDirection && (
                  <circle cx="160" cy="214" r="14" fill="rgba(0,255,136,0.12)" stroke="rgba(0,255,136,0.5)" strokeWidth="1.5" />
                )}
                <text
                  x="160" y="219"
                  textAnchor="middle"
                  fontSize="18"
                  style={{
                    filter: selectedDirection
                      ? "drop-shadow(0 0 8px rgba(0,255,136,0.8))"
                      : "drop-shadow(0 0 4px rgba(255,255,255,0.3))",
                  }}
                >
                  &#9917;
                </text>
              </g>
            )}

            {/* === BALL arc on kick === */}
            {kicked && selectedDirection && (
              <text
                x="160"
                y="219"
                textAnchor="middle"
                fontSize="18"
                style={{
                  animation: `ballArcSvg_${selectedDirection} 0.65s cubic-bezier(0.22,0.61,0.36,1) forwards`,
                  transformOrigin: "160px 214px",
                }}
              >
                &#9917;
              </text>
            )}
          </svg>

          {/* === RESULT OVERLAY (HTML layer on top of SVG) === */}
          {penaltyResult && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20"
              style={{ paddingBottom: "60px" }}
            >
              {penaltyResult === "goal" && (
                <>
                  {/* Particle burst */}
                  <div className="relative flex items-center justify-center">
                    {Array.from({ length: 12 }, (_, i) => {
                      const angle = (i / 12) * 360;
                      return (
                        <div
                          key={i}
                          className="absolute rounded-full"
                          style={{
                            width: i % 2 === 0 ? "10px" : "6px",
                            height: i % 2 === 0 ? "10px" : "6px",
                            background:
                              i % 3 === 0 ? "#00FF88" : i % 3 === 1 ? "#FFD700" : "#ffffff",
                            animation: "particleBurst 0.8s ease-out forwards",
                            animationDelay: `${i * 0.035}s`,
                            "--burst-angle": `${angle}deg`,
                          } as React.CSSProperties}
                        />
                      );
                    })}
                    <p
                      className="text-5xl font-black"
                      style={{
                        color: "#00FF88",
                        textShadow:
                          "0 0 40px rgba(0,255,136,0.8), 0 0 80px rgba(0,255,136,0.4)",
                        animation: "goalCelebrate 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards",
                      }}
                    >
                      {t("game.goal")}
                    </p>
                  </div>
                  <p
                    className="font-black text-2xl mt-2"
                    style={{
                      color: "#00FF88",
                      animation: "scoreFloat 1.5s ease-out forwards",
                      animationDelay: "0.25s",
                      opacity: 0,
                    }}
                  >
                    +50 pts
                  </p>
                </>
              )}
              {penaltyResult === "saved" && (
                <p
                  className="text-4xl font-black"
                  style={{
                    color: "#f87171",
                    textShadow: "0 0 30px rgba(255,68,68,0.65)",
                    animation: "shakeX 0.5s ease-out forwards",
                  }}
                >
                  {t("game.saved")}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Kick button */}
      {!kicked && (
        <div className="px-2 pb-2 mt-auto">
          <button
            onClick={onKick}
            disabled={!selectedDirection}
            className="w-full font-black py-5 rounded-2xl text-xl active:scale-[0.95] transform transition-all disabled:opacity-20"
            style={{
              background: selectedDirection
                ? "linear-gradient(135deg, #00FF88, #00CC6A)"
                : "#222",
              color: selectedDirection ? "#000" : "#555",
              boxShadow: selectedDirection
                ? "0 0 30px rgba(0,255,136,0.35), 0 4px 15px rgba(0,0,0,0.3)"
                : "none",
            }}
          >
            {selectedDirection ? (
              <span className="flex items-center justify-center gap-2">
                <span className="text-2xl">&#9917;</span> {t("game.kick")}
              </span>
            ) : (
              t("game.chooseKick")
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
  const { t } = useLanguage();
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
              background: isMe
                ? "rgba(0, 253, 135, 0.1)"
                : "rgba(13, 17, 23, 0.5)",
              backdropFilter: "blur(20px)",
              border: isMe
                ? "1px solid rgba(0, 253, 135, 0.25)"
                : "1px solid rgba(70, 70, 92, 0.15)",
              borderLeft: i < 3 ? `4px solid ${i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : "#CD7F32"}` : undefined,
            }}
          >
            <span className="min-w-[28px] text-center">
              {i < 3 ? (
                <span className="text-lg">{medals[i]}</span>
              ) : (
                <span className="text-outline font-headline font-bold text-sm">
                  {i + 1}
                </span>
              )}
            </span>
            <span className="text-xl">{p.avatar}</span>
            <span
              className={`font-body font-semibold text-sm flex-1 truncate ${
                isMe ? "text-on-surface" : "text-on-surface/80"
              }`}
            >
              {p.nickname}
              {isMe && (
                <span className="text-primary text-xs ml-1">{t("game.you")}</span>
              )}
            </span>
            <span
              className={`font-headline font-bold tabular-nums text-sm ${
                isMe ? "text-primary-container" : "text-on-surface-variant"
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
  /* Legacy HTML arc keyframes — kept for backward compat if referenced elsewhere */
  @keyframes ballArc_left {
    0%   { left: 50%; top: 100%; transform: translate(-50%, 0) scale(1) rotate(0deg); }
    40%  { left: 35%; top: 40%;  transform: translate(-50%, -50%) scale(0.85) rotate(-180deg); }
    100% { left: 18%; top: 28%;  transform: translate(-50%, -50%) scale(0.7) rotate(-360deg); }
  }
  @keyframes ballArc_center {
    0%   { left: 50%; top: 100%; transform: translate(-50%, 0) scale(1) rotate(0deg); }
    40%  { left: 50%; top: 45%;  transform: translate(-50%, -50%) scale(0.9) rotate(-180deg); }
    100% { left: 50%; top: 18%;  transform: translate(-50%, -50%) scale(0.7) rotate(-360deg); }
  }
  @keyframes ballArc_right {
    0%   { left: 50%; top: 100%; transform: translate(-50%, 0) scale(1) rotate(0deg); }
    40%  { left: 65%; top: 40%;  transform: translate(-50%, -50%) scale(0.85) rotate(180deg); }
    100% { left: 82%; top: 28%;  transform: translate(-50%, -50%) scale(0.7) rotate(360deg); }
  }

  /* SVG-space ball arc keyframes (translate within SVG viewBox 0 0 320 240) */
  /* Ball starts at (160, 219) — penalty spot text anchor */
  /* Destination: left (60,65) center (160,52) right (260,65) */
  /* translate() moves the text; scale shrinks it; rotate spins it */
  @keyframes ballArcSvg_left {
    0%   { transform: translate(0px, 0px)    scale(1)    rotate(0deg); }
    35%  { transform: translate(-60px, -90px)  scale(0.88) rotate(-200deg); }
    100% { transform: translate(-100px, -154px) scale(0.72) rotate(-400deg); }
  }
  @keyframes ballArcSvg_center {
    0%   { transform: translate(0px, 0px)    scale(1)    rotate(0deg); }
    35%  { transform: translate(0px, -90px)   scale(0.9)  rotate(-200deg); }
    100% { transform: translate(0px, -167px)  scale(0.72) rotate(-400deg); }
  }
  @keyframes ballArcSvg_right {
    0%   { transform: translate(0px, 0px)    scale(1)    rotate(0deg); }
    35%  { transform: translate(60px, -90px)   scale(0.88) rotate(200deg); }
    100% { transform: translate(100px, -154px) scale(0.72) rotate(400deg); }
  }

  /* Ball idle float animation at penalty spot */
  @keyframes ballFloat {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-5px); }
  }

  /* Particle burst for GOAL celebration */
  @keyframes particleBurst {
    0%   { transform: rotate(var(--burst-angle, 0deg)) translateX(0px);   opacity: 1; }
    60%  { transform: rotate(var(--burst-angle, 0deg)) translateX(48px);  opacity: 0.8; }
    100% { transform: rotate(var(--burst-angle, 0deg)) translateX(72px);  opacity: 0; }
  }

  @keyframes gkGrab {
    0% { opacity: 0; transform: scale(0.5); }
    100% { opacity: 1; transform: scale(1.2); }
  }
  @keyframes netShake {
    0%   { transform: translateX(0); }
    10%  { transform: translateX(5px) translateY(-3px); }
    22%  { transform: translateX(-5px) translateY(3px); }
    34%  { transform: translateX(4px) translateY(-2px); }
    46%  { transform: translateX(-3px) translateY(2px); }
    58%  { transform: translateX(2px); }
    70%  { transform: translateX(-1px); }
    100% { transform: translateX(0); }
  }
  @keyframes gkDive {
    0%   { opacity: 0; transform: scale(0.3) rotate(-20deg); }
    60%  { transform: scale(1.3) rotate(5deg); }
    100% { opacity: 1; transform: scale(1) rotate(0deg); }
  }
  @keyframes goalCelebrate {
    0%   { opacity: 0; transform: scale(0.2); }
    55%  { transform: scale(1.25); }
    75%  { transform: scale(0.93); }
    100% { opacity: 1; transform: scale(1); }
  }
`;
