"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTournament, updateTournamentStatus } from "@/lib/gameLogic";
import { useGameSync } from "@/hooks/useGameSync";
import { QRCodeSVG } from "qrcode.react";
import type { Tournament } from "@/types/game";

export default function HostLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const prevCountRef = useRef(0);

  useEffect(() => {
    const load = async () => {
      const t = await getTournament(code);
      setTournament(t);
      setLoading(false);
    };
    load();
  }, [code]);

  const { players } = useGameSync({
    tournamentId: tournament?.id ?? null,
  });

  // Track new players joining for flash effect
  const [flashCount, setFlashCount] = useState(false);
  useEffect(() => {
    if (players.length > prevCountRef.current && prevCountRef.current > 0) {
      setFlashCount(true);
      const t = setTimeout(() => setFlashCount(false), 600);
      return () => clearTimeout(t);
    }
    prevCountRef.current = players.length;
  }, [players.length]);

  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/play/join/${code}`
      : "";

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleStart = async () => {
    if (!tournament) return;
    await updateTournamentStatus(tournament.id, "question", 0);
    router.push(`/host/game/${code}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e]">
        <div className="text-[#00FF88] text-2xl animate-pulse font-bold">
          Cargando torneo...
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e]">
        <div className="text-red-500 text-2xl font-bold">
          Torneo no encontrado
        </div>
      </div>
    );
  }

  const canStart = players.length >= 2;

  return (
    <div className="min-h-screen flex flex-col bg-[#1a1a2e] relative overflow-hidden">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-[-20%] left-[50%] translate-x-[-50%] w-[800px] h-[800px] rounded-full opacity-[0.07]"
          style={{
            background:
              "radial-gradient(circle, #00FF88 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.04]"
          style={{
            background:
              "radial-gradient(circle, #00FF88 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚽</span>
          <span className="text-white font-bold text-2xl tracking-tight">
            Lucky Goal
          </span>
        </div>
        {tournament.prize_amount > 0 && (
          <div className="flex items-center gap-2 bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-full px-5 py-2">
            <span className="text-[#00FF88] text-lg">💎</span>
            <span className="text-[#00FF88] font-bold text-lg">
              {tournament.prize_amount} AVAX
            </span>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex">
        {/* Left: QR + Code */}
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          {/* Title */}
          <h1 className="text-white text-3xl font-bold mb-2 text-center">
            Escanea para unirte
          </h1>
          <p className="text-gray-400 text-lg mb-8 text-center">
            Usa tu celular para jugar
          </p>

          {/* QR Code - large */}
          <div
            className="bg-white p-5 rounded-3xl shadow-2xl mb-8"
            style={{
              boxShadow:
                "0 0 60px rgba(0, 255, 136, 0.15), 0 25px 50px rgba(0, 0, 0, 0.4)",
            }}
          >
            <QRCodeSVG
              value={joinUrl}
              size={300}
              bgColor="#ffffff"
              fgColor="#1a1a2e"
              level="H"
            />
          </div>

          {/* Code display - copiable */}
          <p className="text-gray-500 text-sm mb-2 uppercase tracking-widest">
            O ingresa el codigo
          </p>
          <button
            onClick={handleCopyCode}
            className="group relative bg-[#0D1117] border-2 border-[#00FF88]/40 rounded-2xl px-8 py-4 transition-all hover:border-[#00FF88] hover:shadow-[0_0_30px_rgba(0,255,136,0.15)] active:scale-95"
          >
            <span className="text-[#00FF88] text-5xl font-mono font-bold tracking-[0.4em]">
              {code}
            </span>
            <span
              className={`absolute -top-8 left-1/2 -translate-x-1/2 text-sm px-3 py-1 rounded-lg transition-all ${
                copied
                  ? "opacity-100 bg-[#00FF88] text-black"
                  : "opacity-0 group-hover:opacity-100 bg-gray-800 text-gray-300"
              }`}
            >
              {copied ? "Copiado!" : "Click para copiar"}
            </span>
          </button>

          {/* URL hint */}
          <p className="text-gray-600 text-xs mt-4 font-mono">
            {typeof window !== "undefined" ? window.location.origin : ""}/play
          </p>
        </div>

        {/* Right: Players */}
        <div className="w-[420px] flex flex-col border-l border-white/5 bg-[#0D1117]/50">
          {/* Player count header */}
          <div className="px-6 py-5 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center w-14 h-14 rounded-2xl font-bold text-2xl transition-all ${
                  flashCount
                    ? "bg-[#00FF88] text-black scale-110"
                    : "bg-[#00FF88]/15 text-[#00FF88]"
                }`}
                style={{
                  boxShadow: flashCount
                    ? "0 0 30px rgba(0, 255, 136, 0.5)"
                    : "none",
                }}
              >
                {players.length}
              </div>
              <div>
                <h2 className="text-white font-bold text-xl">
                  Jugadores
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse" />
                  <span className="text-gray-400 text-sm">
                    Sala abierta
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Player list */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {players.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="text-5xl mb-4 opacity-30">📱</div>
                <p className="text-gray-500 text-lg">
                  Esperando jugadores...
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  Los jugadores aparecen aqui al escanear el QR
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {players.map((player, i) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 bg-[#1a1a2e] border border-gray-800/50 rounded-xl px-4 py-3 animate-[slideIn_0.4s_ease-out]"
                    style={{
                      animationDelay: `${i * 0.05}s`,
                      animationFillMode: "backwards",
                    }}
                  >
                    <span className="text-3xl">{player.avatar}</span>
                    <span className="text-white font-semibold text-lg truncate flex-1">
                      {player.nickname}
                    </span>
                    <span className="text-[#00FF88] text-sm font-medium opacity-60">
                      #{i + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Start button area */}
          <div className="px-4 pb-5 pt-3 border-t border-white/5">
            {canStart ? (
              <button
                onClick={handleStart}
                className="w-full relative overflow-hidden bg-[#00FF88] text-black font-bold py-5 px-6 rounded-2xl text-xl tracking-wide active:scale-[0.97] transform transition-transform"
                style={{
                  boxShadow:
                    "0 0 40px rgba(0, 255, 136, 0.3), 0 4px 20px rgba(0, 0, 0, 0.3)",
                }}
              >
                <span className="relative z-10">
                  Iniciar Juego
                </span>
                {/* Shimmer effect */}
                <div className="absolute inset-0 animate-[shimmer_2s_ease-in-out_infinite]">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_ease-in-out_infinite]" />
                </div>
              </button>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">
                  Minimo 2 jugadores para iniciar
                </p>
                <div className="flex justify-center gap-1 mt-3">
                  {[0, 1].map((i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-all ${
                        i < players.length
                          ? "bg-[#00FF88] shadow-[0_0_8px_rgba(0,255,136,0.5)]"
                          : "bg-gray-700"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
