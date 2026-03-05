"use client";

import type { Player } from "@/types/game";
import PlayerCard from "./PlayerCard";

interface LeaderboardProps {
  players: Player[];
  highlightId?: string;
}

export default function Leaderboard({ players, highlightId }: LeaderboardProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">
        Ranking
      </h3>
      {sorted.map((player, i) => (
        <PlayerCard
          key={player.id}
          avatar={player.avatar}
          nickname={player.nickname}
          score={player.score}
          rank={i + 1}
          isWinner={player.id === highlightId}
        />
      ))}
      {sorted.length === 0 && (
        <p className="text-gray-500 text-center py-4">Esperando jugadores...</p>
      )}
    </div>
  );
}
