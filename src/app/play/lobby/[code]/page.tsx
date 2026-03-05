"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTournament } from "@/lib/gameLogic";
import { useGameSync } from "@/hooks/useGameSync";
import PlayerCard from "@/components/ui/PlayerCard";
import type { Tournament } from "@/types/game";

export default function PlayerLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const [localTournament, setLocalTournament] = useState<Tournament | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    const pid = sessionStorage.getItem(`player_${code}`);
    setPlayerId(pid);

    const load = async () => {
      const t = await getTournament(code);
      setLocalTournament(t);
    };
    load();
  }, [code]);

  const { tournament, players } = useGameSync({
    tournamentId: localTournament?.id ?? null,
    playerId,
  });

  const currentTournament = tournament || localTournament;

  // When game starts, redirect to game page
  useEffect(() => {
    if (
      currentTournament?.status &&
      currentTournament.status !== "waiting"
    ) {
      router.push(`/play/game/${code}`);
    }
  }, [currentTournament?.status, code, router]);

  const myNickname = typeof window !== "undefined" ? sessionStorage.getItem(`player_nickname_${code}`) : null;
  const myAvatar = typeof window !== "undefined" ? sessionStorage.getItem(`player_avatar_${code}`) : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#1a1a2e] px-4 py-6">
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 animate-pulse">⏳</div>
          <h1 className="text-2xl font-bold text-white">Esperando al Host</h1>
          <p className="text-gray-400 text-sm mt-2">
            El torneo comenzara pronto...
          </p>
          <p className="text-[#00FF88] font-mono text-sm mt-1">{code}</p>
        </div>

        {/* My Card */}
        {myAvatar && myNickname && (
          <div className="mb-6">
            <p className="text-gray-500 text-xs mb-2 uppercase tracking-wider">Tu perfil</p>
            <PlayerCard avatar={myAvatar} nickname={myNickname} />
          </div>
        )}

        {/* Other Players */}
        <div className="flex-1">
          <p className="text-gray-500 text-xs mb-2 uppercase tracking-wider">
            Jugadores ({players.length})
          </p>
          <div className="space-y-2">
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                avatar={player.avatar}
                nickname={player.nickname}
                compact
                isWinner={player.id === playerId}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
            <div className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse" />
            Conectado
          </div>
        </div>
      </div>
    </div>
  );
}
