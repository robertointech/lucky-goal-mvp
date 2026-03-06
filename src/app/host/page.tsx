"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useActiveAccount, useSendTransaction, ConnectButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb";
import { avalancheFuji } from "thirdweb/chains";
import { createTournament } from "@/lib/gameLogic";
import { prepareCreateTournament } from "@/lib/escrow";

const PRIZE_PRESETS = ["0.05", "0.1", "0.25", "0.5", "1"];

export default function HostPage() {
  const account = useActiveAccount();
  const router = useRouter();
  const [prizeAmount, setPrizeAmount] = useState("0.1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { mutateAsync: sendTx } = useSendTransaction();

  const handleCreate = async () => {
    if (!account) return;
    setLoading(true);
    setError("");

    try {
      const tournament = await createTournament(
        account.address,
        parseFloat(prizeAmount) || 0
      );

      try {
        const tx = prepareCreateTournament(tournament.code, prizeAmount);
        await sendTx(tx);
      } catch (escrowErr) {
        console.warn("Escrow deposit skipped (contract not deployed?):", escrowErr);
      }

      router.push(`/host/lobby/${tournament.code}`);
    } catch (err) {
      setError("Error al crear torneo. Intenta de nuevo.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const prizeNum = parseFloat(prizeAmount) || 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-[#1a1a2e] relative overflow-hidden">
      <style>{styles}</style>

      {/* Background effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#00FF88]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#00FF88]/10 text-[#00FF88] text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-[#00FF88]/20">
            <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
            LUCKY GOAL
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
            Crear Torneo
          </h1>
          <p className="text-gray-400">
            Configura y lanza tu torneo de trivia + penales
          </p>
        </div>

        {!account ? (
          /* Connect wallet state */
          <div className="host-card p-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#1a1a2e] border border-gray-700/50 flex items-center justify-center mx-auto mb-5">
              <span className="text-4xl">&#128274;</span>
            </div>
            <h2 className="text-lg text-white font-bold mb-2">Conecta tu wallet</h2>
            <p className="text-gray-400 text-sm mb-6">
              Necesitas una wallet para depositar el premio del torneo
            </p>
            <div className="flex justify-center">
              <ConnectButton
                client={client}
                chain={avalancheFuji}
                connectButton={{
                  label: "Conectar Wallet",
                  style: {
                    background: "linear-gradient(135deg, #00FF88, #00CC6A)",
                    color: "#000",
                    fontWeight: "bold",
                    padding: "14px 28px",
                    borderRadius: "12px",
                    fontSize: "16px",
                    boxShadow: "0 0 20px rgba(0,255,136,0.3)",
                    border: "none",
                  },
                }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Prize Amount */}
            <div className="host-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Premio</h3>
                <span className="text-gray-500 text-xs">AVAX</span>
              </div>

              {/* Big prize input */}
              <div className="relative mb-4">
                <input
                  type="number"
                  value={prizeAmount}
                  onChange={(e) => setPrizeAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full bg-[#1a1a2e] border-2 border-gray-700/50 rounded-xl px-5 py-4 text-white text-3xl font-black text-center focus:border-[#00FF88] focus:outline-none transition-all focus:shadow-[0_0_20px_rgba(0,255,136,0.15)]"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">AVAX</span>
              </div>

              {/* Quick presets */}
              <div className="flex gap-2 flex-wrap">
                {PRIZE_PRESETS.map((val) => (
                  <button
                    key={val}
                    onClick={() => setPrizeAmount(val)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      prizeAmount === val
                        ? "bg-[#00FF88] text-black"
                        : "bg-[#1a1a2e] text-gray-400 border border-gray-700/50 hover:border-[#00FF88]/50 hover:text-white"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Tournament Preview Card */}
            <div className="host-card p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#00FF88]/5 rounded-full blur-[40px] pointer-events-none" />

              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span className="text-[#00FF88]">&#9889;</span>
                Preview del torneo
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-800/50">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center text-xs">&#127918;</span>
                    <span className="text-gray-400 text-sm">Formato</span>
                  </div>
                  <span className="text-white text-sm font-medium">Trivia + Penales</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-800/50">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center text-xs">&#10067;</span>
                    <span className="text-gray-400 text-sm">Preguntas</span>
                  </div>
                  <span className="text-white text-sm font-medium">5 trivia de futbol</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-800/50">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-yellow-500/15 flex items-center justify-center text-xs">&#9201;</span>
                    <span className="text-gray-400 text-sm">Tiempo</span>
                  </div>
                  <span className="text-white text-sm font-medium">20s por pregunta</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-800/50">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-green-500/15 flex items-center justify-center text-xs">&#9917;</span>
                    <span className="text-gray-400 text-sm">Penales</span>
                  </div>
                  <span className="text-white text-sm font-medium">1 por ronda</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center text-xs">&#11088;</span>
                    <span className="text-gray-400 text-sm">Puntuacion</span>
                  </div>
                  <span className="text-white text-sm font-medium">100 + bonus + 50 gol</span>
                </div>
              </div>

              {/* Prize highlight at bottom */}
              {prizeNum > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-800/50 flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Premio total</span>
                  <span className="text-[#00FF88] text-xl font-black">{prizeAmount} AVAX</span>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <p className="text-red-400 text-center text-sm">{error}</p>
              </div>
            )}

            {/* Create Button */}
            <button
              onClick={handleCreate}
              disabled={loading}
              className="host-btn w-full py-4 px-6 rounded-xl text-lg font-bold transition-all active:scale-[0.97] transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Creando torneo...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Crear Torneo
                  <span className="text-xl">&#9889;</span>
                </span>
              )}
            </button>

            {/* Connected wallet info */}
            <div className="text-center">
              <p className="text-gray-500 text-xs">
                Conectado: {account.address.slice(0, 6)}...{account.address.slice(-4)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = `
  .host-card {
    background: #0D1117;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
  }

  .host-btn {
    background: linear-gradient(135deg, #00FF88, #00CC6A);
    color: black;
    box-shadow: 0 0 25px rgba(0,255,136,0.3), 0 4px 15px rgba(0,0,0,0.3);
  }
  .host-btn:hover:not(:disabled) {
    box-shadow: 0 0 35px rgba(0,255,136,0.5), 0 4px 20px rgba(0,0,0,0.3);
    transform: translateY(-1px);
  }
`;
