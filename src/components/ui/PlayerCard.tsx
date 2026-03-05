"use client";

interface PlayerCardProps {
  avatar: string;
  nickname: string;
  score?: number;
  rank?: number;
  isWinner?: boolean;
  compact?: boolean;
}

export default function PlayerCard({
  avatar,
  nickname,
  score,
  rank,
  isWinner,
  compact,
}: PlayerCardProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-[#1a1a2e] rounded-lg px-3 py-2 border border-gray-800">
        <span className="text-xl">{avatar}</span>
        <span className="text-white text-sm font-medium truncate">{nickname}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all ${
        isWinner
          ? "bg-[#00FF88]/10 border-[#00FF88]"
          : "bg-[#1a1a2e] border-gray-800"
      }`}
    >
      {rank !== undefined && (
        <span
          className={`text-lg font-bold min-w-[24px] ${
            rank === 1
              ? "text-[#FFD700]"
              : rank === 2
                ? "text-gray-300"
                : rank === 3
                  ? "text-amber-600"
                  : "text-gray-500"
          }`}
        >
          {rank}
        </span>
      )}
      <span className="text-2xl">{avatar}</span>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{nickname}</p>
      </div>
      {score !== undefined && (
        <span className="text-[#00FF88] font-bold text-lg">{score}</span>
      )}
      {isWinner && <span className="text-xl">👑</span>}
    </div>
  );
}
