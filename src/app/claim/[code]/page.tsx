"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { inAppWallet } from "thirdweb/wallets";
import { useConnect } from "thirdweb/react";
import { avalancheFuji } from "thirdweb/chains";
import { client } from "@/lib/thirdweb";
import { getTournament, getPlayers, setPlayerWallet } from "@/lib/gameLogic";
import { getEscrowTournament } from "@/lib/escrow";
import type { Tournament, Player } from "@/types/game";

type ClaimStep = "loading" | "ready" | "creating" | "success" | "error" | "not-winner";

export default function ClaimPage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();

  const [step, setStep] = useState<ClaimStep>("loading");
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [prizeReceived, setPrizeReceived] = useState(false);

  const { connect } = useConnect();

  useEffect(() => {
    const load = async () => {
      const t = await getTournament(code);
      if (!t) {
        setErrorMsg("Tournament not found");
        setStep("error");
        return;
      }
      setTournament(t);

      const players = await getPlayers(t.id);
      const w = players.find((p) => p.is_winner);

      if (!w) {
        setStep("not-winner");
        return;
      }

      setWinner(w);

      const storedPlayerId =
        typeof window !== "undefined"
          ? sessionStorage.getItem(`player_${code}`)
          : null;

      if (storedPlayerId !== w.id) {
        setStep("not-winner");
        return;
      }

      if (w.wallet_address) {
        setWalletAddress(w.wallet_address);
        setStep("success");
        return;
      }

      setStep("ready");
    };
    load();
  }, [code]);

  const handleCreateWallet = async () => {
    if (!winner) return;
    setStep("creating");
    setErrorMsg("");

    try {
      const wallet = inAppWallet({
        auth: {
          options: ["passkey"],
          passkeyDomain:
            typeof window !== "undefined" ? window.location.hostname : "localhost",
        },
      });

      await connect(async () => {
        try {
          // Try sign-in first (returning users)
          await wallet.connect({
            client,
            chain: avalancheFuji,
            strategy: "passkey",
            type: "sign-in",
          });
        } catch {
          // Fallback to sign-up (new users)
          await wallet.connect({
            client,
            chain: avalancheFuji,
            strategy: "passkey",
            type: "sign-up",
          });
        }
        return wallet;
      });

      const account = await wallet.getAccount();

      if (account?.address) {
        await setPlayerWallet(winner.id, account.address);
        setWalletAddress(account.address);
        setStep("success");
      } else {
        throw new Error("Could not get wallet address");
      }
    } catch (err) {
      console.error("Passkey wallet error:", err);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Error creating wallet. Try again."
      );
      setStep("ready");
    }
  };

  useEffect(() => {
    if (step !== "success" || prizeReceived) return;
    const check = async () => {
      try {
        const escrow = await getEscrowTournament(code);
        if (escrow.claimed) setPrizeReceived(true);
      } catch {
        // Contract not deployed yet
      }
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [step, prizeReceived, code]);

  // Current active step index for the progress tracker
  const activeStep =
    step === "ready" || step === "creating" ? 0
    : step === "success" && !prizeReceived ? 1
    : step === "success" && prizeReceived ? 2
    : -1;

  // --- Render ---

  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e]">
        <style>{styles}</style>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#00FF88]/30 border-t-[#00FF88] rounded-full animate-spin" />
          <p className="text-[#00FF88] text-lg font-medium animate-pulse">Loading prize...</p>
        </div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a1a2e] px-4">
        <style>{styles}</style>
        <div className="claim-card p-8 text-center max-w-sm w-full">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">!</span>
          </div>
          <h2 className="text-xl text-white font-bold mb-2">Error</h2>
          <p className="text-gray-400">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (step === "not-winner") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a1a2e] px-4">
        <style>{styles}</style>
        <div className="claim-card p-8 text-center max-w-sm w-full">
          <div className="text-5xl mb-4">&#9917;</div>
          <h2 className="text-xl text-white font-bold mb-2">Nice try!</h2>
          <p className="text-gray-400 text-sm mb-6">
            Only the tournament winner can claim the prize.
          </p>
          {winner && (
            <div className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-700/50">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Winner</p>
              <div className="text-3xl mb-1">{winner.avatar}</div>
              <p className="text-white font-bold">{winner.nickname}</p>
              <p className="text-[#00FF88] text-sm font-medium">{winner.score} pts</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a1a2e] px-4 py-8 relative overflow-hidden">
      <style>{styles}</style>

      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00FF88]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Confetti only when prize received */}
      {prizeReceived && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                width: `${4 + Math.random() * 8}px`,
                height: `${4 + Math.random() * 8}px`,
                backgroundColor: ["#00FF88", "#FFD700", "#FF6B6B", "#4ECDC4", "#A855F7"][
                  Math.floor(Math.random() * 5)
                ],
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2.5 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="w-full max-w-sm relative z-10">
        {/* Trophy / Status header */}
        <div className="text-center mb-6">
          {prizeReceived ? (
            <div className="trophy-bounce inline-block">
              <div className="text-7xl mb-2 drop-shadow-[0_0_20px_rgba(255,215,0,0.5)]">&#127942;</div>
            </div>
          ) : step === "success" ? (
            <div className="text-6xl mb-2 animate-pulse">&#9203;</div>
          ) : (
            <div className="prize-glow inline-block">
              <div className="text-6xl mb-2">&#127881;</div>
            </div>
          )}
          <h1 className="text-2xl font-bold text-white mb-1">
            {prizeReceived
              ? "Prize received!"
              : step === "success"
              ? "Waiting for prize..."
              : "Congratulations!"}
          </h1>
          <p className="text-gray-400 text-sm">
            {prizeReceived
              ? "The AVAX is now in your wallet"
              : step === "success"
              ? "The host is sending your prize"
              : "You have a prize waiting for you"}
          </p>
        </div>

        {/* Prize card */}
        {tournament && tournament.prize_amount > 0 && (
          <div className={`claim-card p-5 text-center mb-5 ${prizeReceived ? "border-[#00FF88] glow-border" : ""}`}>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Prize</p>
            <p className={`text-4xl font-black ${prizeReceived ? "text-[#00FF88]" : "text-white"}`}>
              {tournament.prize_amount} AVAX
            </p>
            <p className="text-gray-500 text-xs mt-1">Avalanche Network</p>
            {prizeReceived && (
              <div className="mt-3 inline-flex items-center gap-1.5 bg-[#00FF88]/10 text-[#00FF88] text-xs font-semibold px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
                Transferred
              </div>
            )}
          </div>
        )}

        {/* Progress steps */}
        {(step === "ready" || step === "creating" || step === "success") && (
          <div className="claim-card p-5 mb-5">
            <div className="space-y-0">
              {[
                { label: "Create wallet", desc: "Passkey (Face ID / fingerprint)", icon: "\uD83D\uDD10" },
                { label: "Waiting for prize", desc: "The host sends the AVAX", icon: "\uD83D\uDCE8" },
                { label: "Prize received", desc: "AVAX in your wallet", icon: "\u2705" },
              ].map((s, i) => {
                const isDone = i < activeStep;
                const isCurrent = i === activeStep;
                return (
                  <div key={i} className="flex items-start gap-3">
                    {/* Step indicator line + circle */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 transition-all duration-500 ${
                          isDone
                            ? "bg-[#00FF88] text-black"
                            : isCurrent
                            ? "bg-[#00FF88]/20 text-[#00FF88] border-2 border-[#00FF88] step-pulse"
                            : "bg-gray-800 text-gray-500 border border-gray-700"
                        }`}
                      >
                        {isDone ? "\u2713" : s.icon}
                      </div>
                      {i < 2 && (
                        <div
                          className={`w-0.5 h-8 transition-all duration-500 ${
                            isDone ? "bg-[#00FF88]" : "bg-gray-700"
                          }`}
                        />
                      )}
                    </div>
                    {/* Step text */}
                    <div className="pt-1">
                      <p
                        className={`text-sm font-semibold ${
                          isDone || isCurrent ? "text-white" : "text-gray-500"
                        }`}
                      >
                        {s.label}
                      </p>
                      <p className="text-xs text-gray-500">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Winner card */}
        {winner && (
          <div className="claim-card p-4 mb-5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#1a1a2e] flex items-center justify-center text-2xl border border-gray-700/50">
              {winner.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold truncate">{winner.nickname}</p>
              <p className="text-[#00FF88] text-sm font-medium">{winner.score} points</p>
            </div>
            <div className="text-2xl crown-float">&#128081;</div>
          </div>
        )}

        {/* Wallet address (when created) */}
        {walletAddress && (
          <div className="claim-card p-4 mb-5">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Your wallet</p>
            <p className="text-[#00FF88] font-mono text-sm">{shortAddress}</p>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-5">
            <p className="text-red-400 text-center text-sm">{errorMsg}</p>
          </div>
        )}

        {/* Claim Button */}
        {(step === "ready" || step === "creating") && (
          <>
            <button
              onClick={handleCreateWallet}
              disabled={step === "creating"}
              className="claim-btn w-full py-4 px-6 rounded-xl text-lg font-bold transition-all active:scale-95 transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === "creating" ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Creating wallet...
                </span>
              ) : (
                "Create wallet and receive prize"
              )}
            </button>
            <p className="text-gray-500 text-xs text-center mt-4 max-w-xs mx-auto leading-relaxed">
              You'll use Face ID, fingerprint, or your device's passkey.
              No need to remember any secret phrase.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const styles = `
  .claim-card {
    background: #0D1117;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
  }

  .claim-btn {
    background: linear-gradient(135deg, #00FF88, #00CC6A);
    color: black;
    box-shadow: 0 0 20px rgba(0,255,136,0.3), 0 4px 15px rgba(0,0,0,0.3);
  }
  .claim-btn:hover:not(:disabled) {
    box-shadow: 0 0 30px rgba(0,255,136,0.5), 0 4px 20px rgba(0,0,0,0.3);
  }

  .glow-border {
    border-color: #00FF88 !important;
    box-shadow: 0 0 15px rgba(0,255,136,0.15), inset 0 0 15px rgba(0,255,136,0.05);
  }

  .step-pulse {
    animation: stepPulse 2s ease-in-out infinite;
  }
  @keyframes stepPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(0,255,136,0.4); }
    50% { box-shadow: 0 0 0 8px rgba(0,255,136,0); }
  }

  .trophy-bounce {
    animation: trophyBounce 1s ease-out;
  }
  @keyframes trophyBounce {
    0% { transform: scale(0) rotate(-20deg); }
    50% { transform: scale(1.3) rotate(10deg); }
    70% { transform: scale(0.9) rotate(-5deg); }
    100% { transform: scale(1) rotate(0deg); }
  }

  .prize-glow {
    animation: prizeGlow 2s ease-in-out infinite;
  }
  @keyframes prizeGlow {
    0%, 100% { filter: drop-shadow(0 0 8px rgba(0,255,136,0.3)); }
    50% { filter: drop-shadow(0 0 20px rgba(0,255,136,0.6)); }
  }

  .crown-float {
    animation: crownFloat 3s ease-in-out infinite;
  }
  @keyframes crownFloat {
    0%, 100% { transform: translateY(0) rotate(-5deg); }
    50% { transform: translateY(-4px) rotate(5deg); }
  }

  .confetti-piece {
    top: -10px;
    animation: confettiFall 3s linear infinite;
  }
  @keyframes confettiFall {
    0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }
`;
