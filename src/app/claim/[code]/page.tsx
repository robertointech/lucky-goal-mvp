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

  // Load tournament and verify winner
  useEffect(() => {
    const load = async () => {
      const t = await getTournament(code);
      if (!t) {
        setErrorMsg("Torneo no encontrado");
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

      // Check if this is the winner (via sessionStorage)
      const storedPlayerId =
        typeof window !== "undefined"
          ? sessionStorage.getItem(`player_${code}`)
          : null;

      if (storedPlayerId !== w.id) {
        setStep("not-winner");
        return;
      }

      // If wallet already claimed
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
        await wallet.connect({
          client,
          chain: avalancheFuji,
          strategy: "passkey",
          type: "sign-up",
        });
        return wallet;
      });

      // Get the account from the connected wallet
      const account = await wallet.getAccount();

      if (account?.address) {
        await setPlayerWallet(winner.id, account.address);
        setWalletAddress(account.address);
        setStep("success");
      } else {
        throw new Error("No se pudo obtener la direccion de la wallet");
      }
    } catch (err) {
      console.error("Passkey wallet error:", err);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Error al crear la wallet. Intenta de nuevo."
      );
      setStep("ready");
    }
  };

  // Poll escrow contract to check if prize has been sent
  useEffect(() => {
    if (step !== "success" || prizeReceived) return;
    const check = async () => {
      try {
        const escrow = await getEscrowTournament(code);
        if (escrow.claimed) setPrizeReceived(true);
      } catch {
        // Contract not deployed yet — ignore
      }
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [step, prizeReceived, code]);

  // --- Render ---

  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e]">
        <div className="text-[#00FF88] text-xl animate-pulse">Cargando premio...</div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a1a2e] px-4">
        <div className="text-4xl mb-4">❌</div>
        <h2 className="text-xl text-white font-bold mb-2">Error</h2>
        <p className="text-gray-400">{errorMsg}</p>
      </div>
    );
  }

  if (step === "not-winner") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a1a2e] px-4">
        <div className="text-4xl mb-4">🏟️</div>
        <h2 className="text-xl text-white font-bold mb-2">Buen intento!</h2>
        <p className="text-gray-400 text-center">
          Solo el ganador del torneo puede reclamar el premio.
        </p>
        {winner && (
          <div className="mt-4 bg-[#0D1117] border border-gray-800 rounded-xl px-6 py-4 text-center">
            <p className="text-gray-400 text-sm">Ganador</p>
            <p className="text-2xl mt-1">{winner.avatar}</p>
            <p className="text-white font-bold">{winner.nickname}</p>
            <p className="text-[#00FF88]">{winner.score} pts</p>
          </div>
        )}
      </div>
    );
  }

  if (step === "success") {
    const shortAddress = walletAddress
      ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
      : "";

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a1a2e] px-4">
        {/* Confetti effect */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: "-10px",
                width: `${4 + Math.random() * 8}px`,
                height: `${4 + Math.random() * 8}px`,
                backgroundColor: ["#00FF88", "#FFD700", "#FF6B6B", "#4ECDC4"][
                  Math.floor(Math.random() * 4)
                ],
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                animation: `confetti-fall ${2 + Math.random() * 3}s ${
                  Math.random() * 2
                }s linear infinite`,
              }}
            />
          ))}
          <style>{`
            @keyframes confetti-fall {
              0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
          `}</style>
        </div>

        <div className="text-6xl mb-4">{prizeReceived ? "🎉" : "⏳"}</div>
        <h2 className="text-2xl text-white font-bold mb-2">
          {prizeReceived ? "Premio recibido!" : "Wallet creada!"}
        </h2>
        <p className="text-gray-400 mb-4">
          {prizeReceived
            ? "El AVAX ya esta en tu wallet"
            : "Esperando a que el host envie el premio..."}
        </p>

        <div className={`bg-[#0D1117] border ${prizeReceived ? "border-[#00FF88]" : "border-gray-800"} rounded-xl px-6 py-4 text-center mb-6`}>
          <p className="text-gray-400 text-sm mb-1">Tu wallet</p>
          <p className="text-[#00FF88] font-mono text-sm">{shortAddress}</p>
          {tournament && tournament.prize_amount > 0 && (
            <>
              <div className="border-t border-gray-800 my-3" />
              <p className="text-gray-400 text-sm mb-1">Premio</p>
              <p className="text-[#00FF88] text-2xl font-bold">
                {tournament.prize_amount} AVAX
              </p>
              {prizeReceived && (
                <p className="text-green-400 text-xs mt-1 font-semibold">Transferido</p>
              )}
            </>
          )}
        </div>

        <p className="text-gray-500 text-xs text-center max-w-xs">
          Tu wallet fue creada con Passkey (Face ID / huella digital).
          Puedes acceder a ella desde cualquier dispositivo con la misma passkey.
        </p>
      </div>
    );
  }

  // --- Ready to claim ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a1a2e] px-4">
      <div className="w-full max-w-sm">
        {/* Winner info */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Felicidades!
          </h1>
          <p className="text-gray-400">Tienes un premio esperandote</p>
        </div>

        {/* Prize display */}
        {tournament && tournament.prize_amount > 0 && (
          <div className="bg-[#0D1117] border border-[#00FF88] rounded-xl px-6 py-6 text-center mb-6">
            <p className="text-gray-400 text-sm mb-2">Tu premio</p>
            <p className="text-[#00FF88] text-4xl font-bold">
              {tournament.prize_amount} AVAX
            </p>
            <p className="text-gray-500 text-xs mt-2">Avalanche Network</p>
          </div>
        )}

        {/* Winner Card */}
        {winner && (
          <div className="flex items-center gap-3 bg-[#0D1117] border border-gray-800 rounded-xl px-4 py-3 mb-6">
            <span className="text-3xl">{winner.avatar}</span>
            <div>
              <p className="text-white font-bold">{winner.nickname}</p>
              <p className="text-[#00FF88] text-sm">{winner.score} puntos</p>
            </div>
            <span className="ml-auto text-xl">👑</span>
          </div>
        )}

        {errorMsg && (
          <p className="text-red-500 text-center text-sm mb-4">{errorMsg}</p>
        )}

        {/* Claim Button */}
        <button
          onClick={handleCreateWallet}
          disabled={step === "creating"}
          className="w-full bg-[#00FF88] text-black font-bold py-4 px-6 rounded-xl text-lg hover:bg-green-400 transition-colors active:scale-95 transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {step === "creating" ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Creando wallet...
            </span>
          ) : (
            "Crear cuenta y recibir premio"
          )}
        </button>

        <p className="text-gray-500 text-xs text-center mt-4 max-w-xs mx-auto">
          Usaras Face ID, huella digital o passkey de tu dispositivo.
          No necesitas recordar ninguna frase secreta.
        </p>
      </div>
    </div>
  );
}
