"use client";

import { useEffect, useState } from "react";

interface WinnerBannerProps {
  nickname: string;
  avatar: string;
  score: number;
  prizeAmount: number;
  onClaim?: () => void;
  isSelf?: boolean;
}

function Confetti() {
  const [particles, setParticles] = useState<
    { id: number; x: number; color: string; delay: number; size: number }[]
  >([]);

  useEffect(() => {
    const colors = ["#00FF88", "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFFFFF"];
    const items = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2,
      size: 4 + Math.random() * 8,
    }));
    setParticles(items);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-bounce"
          style={{
            left: `${p.x}%`,
            top: "-20px",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            animation: `confetti-fall ${2 + Math.random() * 3}s ${p.delay}s linear infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function WinnerBanner({
  nickname,
  avatar,
  score,
  prizeAmount,
  onClaim,
  isSelf,
}: WinnerBannerProps) {
  return (
    <>
      <Confetti />
      <div className="flex flex-col items-center text-center gap-4 py-8">
        <div className="text-7xl animate-bounce">{avatar}</div>
        <div>
          <h2 className="text-3xl font-bold text-white">
            {isSelf ? "Ganaste!" : `${nickname} gano!`}
          </h2>
          <p className="text-[#00FF88] text-xl font-semibold mt-1">
            {score} puntos
          </p>
        </div>

        {prizeAmount > 0 && (
          <div className="bg-[#1a1a2e] border border-[#00FF88] rounded-xl px-6 py-4 mt-2">
            <p className="text-gray-400 text-sm">Premio</p>
            <p className="text-[#00FF88] text-2xl font-bold">{prizeAmount} AVAX</p>
          </div>
        )}

        {isSelf && onClaim && (
          <button
            onClick={onClaim}
            className="mt-4 bg-[#00FF88] text-black font-bold py-4 px-8 rounded-xl text-lg hover:bg-green-400 transition-colors active:scale-95 transform animate-pulse"
          >
            Reclamar Premio
          </button>
        )}
      </div>
    </>
  );
}
