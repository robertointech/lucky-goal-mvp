"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useActiveAccount, ConnectButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb";
import { avalancheFuji } from "thirdweb/chains";
import { createTournament } from "@/lib/gameLogic";

export default function HostPage() {
  const account = useActiveAccount();
  const router = useRouter();
  const [prizeAmount, setPrizeAmount] = useState("0.1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!account) return;
    setLoading(true);
    setError("");

    try {
      const tournament = await createTournament(
        account.address,
        parseFloat(prizeAmount) || 0
      );
      router.push(`/host/lobby/${tournament.code}`);
    } catch (err) {
      setError("Error al crear torneo. Intenta de nuevo.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-[#1a1a2e]">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Crear Torneo</h1>
          <p className="text-gray-400">
            Configura tu torneo de Lucky Goal
          </p>
        </div>

        {!account ? (
          <div className="text-center">
            <p className="text-gray-400 mb-4">Conecta tu wallet para crear un torneo</p>
            <div className="flex justify-center">
              <ConnectButton
                client={client}
                chain={avalancheFuji}
                connectButton={{
                  label: "Conectar Wallet",
                  style: {
                    backgroundColor: "#00FF88",
                    color: "#000",
                    fontWeight: "bold",
                    padding: "12px 24px",
                    borderRadius: "12px",
                    fontSize: "16px",
                  },
                }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Prize Amount */}
            <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-6">
              <label className="text-gray-400 text-sm block mb-2">
                Premio (AVAX)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={prizeAmount}
                  onChange={(e) => setPrizeAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="flex-1 bg-[#1a1a2e] border border-gray-700 rounded-lg px-4 py-3 text-white text-2xl font-bold focus:border-[#00FF88] focus:outline-none transition-colors"
                />
                <span className="text-gray-400 text-lg">AVAX</span>
              </div>
              <p className="text-gray-500 text-xs mt-2">
                El ganador recibira este premio en su wallet
              </p>
            </div>

            {/* Game Info */}
            <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-6 space-y-3">
              <h3 className="text-white font-semibold">Reglas del torneo</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Preguntas</span>
                <span className="text-white">5 trivia de futbol</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tiempo por pregunta</span>
                <span className="text-white">20 segundos</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Penales</span>
                <span className="text-white">1 por pregunta</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Puntuacion</span>
                <span className="text-white">100pts + bonus velocidad + 50pts gol</span>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-center text-sm">{error}</p>
            )}

            {/* Create Button */}
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-[#00FF88] text-black font-bold py-4 px-6 rounded-xl text-lg hover:bg-green-400 transition-colors active:scale-95 transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creando..." : "Crear Torneo"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
