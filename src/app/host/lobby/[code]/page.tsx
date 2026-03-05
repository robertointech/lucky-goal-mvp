"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTournament, updateTournamentStatus } from "@/lib/gameLogic";
import { useGameSync } from "@/hooks/useGameSync";
import QRCodeDisplay from "@/components/ui/QRCode";
import PlayerCard from "@/components/ui/PlayerCard";
import type { Tournament } from "@/types/game";

export default function HostLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch tournament
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

  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/play/join/${code}`
      : "";

  const handleStart = async () => {
    if (!tournament) return;
    await updateTournamentStatus(tournament.id, "question", 0);
    router.push(`/host/game/${code}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e]">
        <div className="text-[#00FF88] text-xl animate-pulse">Cargando...</div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e]">
        <div className="text-red-500 text-xl">Torneo no encontrado</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#1a1a2e] px-4 py-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white">Lobby del Torneo</h1>
        <p className="text-gray-400 text-sm mt-1">
          Esperando jugadores...
        </p>
      </div>

      {/* QR Code */}
      <div className="flex justify-center mb-8">
        <QRCodeDisplay code={code} url={joinUrl} />
      </div>

      {/* Prize */}
      {tournament.prize_amount > 0 && (
        <div className="text-center mb-6">
          <span className="bg-[#00FF88]/10 text-[#00FF88] px-4 py-2 rounded-full text-sm font-medium border border-[#00FF88]/30">
            Premio: {tournament.prize_amount} AVAX
          </span>
        </div>
      )}

      {/* Players List */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold">
            Jugadores ({players.length})
          </h2>
          <div className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse" />
        </div>
        <div className="space-y-2 mb-6">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              avatar={player.avatar}
              nickname={player.nickname}
              compact
            />
          ))}
          {players.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-4xl mb-2">📱</p>
              <p>Escanea el QR para unirte</p>
            </div>
          )}
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={players.length < 1}
        className="w-full bg-[#00FF88] text-black font-bold py-4 px-6 rounded-xl text-lg hover:bg-green-400 transition-colors active:scale-95 transform disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {players.length < 1
          ? "Esperando jugadores..."
          : `Iniciar con ${players.length} jugador${players.length > 1 ? "es" : ""}`}
      </button>
    </div>
  );
}
