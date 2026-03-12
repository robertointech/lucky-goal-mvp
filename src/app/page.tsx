"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLeaderboard } from "@/lib/globalPlayers";
import { ACHIEVEMENT_META } from "@/types/game";
import type { GlobalPlayer, Achievement } from "@/types/game";

type LeaderboardEntry = GlobalPlayer & { achievements: Achievement[] };

export default function LandingPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard(10)
      .then(setLeaderboard)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="min-h-screen flex flex-col bg-[#1a1a2e] relative overflow-hidden">
      {/* Hero background */}
      <div className="absolute inset-0">
        <img
          src="/hero.jpeg"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e]/70 via-[#1a1a2e]/60 to-[#1a1a2e]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center px-4 py-12">
        {/* Logo */}
        <img
          src="/logo.jpeg"
          alt="Lucky Goal"
          className="w-24 h-24 rounded-2xl object-cover mb-6 shadow-lg shadow-black/30"
        />

        <h1 className="text-5xl md:text-6xl font-black text-white text-center mb-3 tracking-tight">
          Lucky Goal
        </h1>
        <p className="text-gray-300 text-lg md:text-xl text-center max-w-md mb-10">
          Live Trivia + Penalty Kicks. Compete for AVAX prizes.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm mb-16">
          <Link
            href="/host"
            className="flex-1 text-center py-4 px-6 rounded-xl text-lg font-bold transition-all active:scale-95"
            style={{
              background: "linear-gradient(135deg, #00FF88, #00CC6A)",
              color: "#000",
              boxShadow: "0 0 25px rgba(0,255,136,0.3)",
            }}
          >
            Create Tournament
          </Link>
          <Link
            href="/play"
            className="flex-1 text-center py-4 px-6 rounded-xl text-lg font-bold border-2 border-white/20 text-white transition-all active:scale-95 hover:border-[#00FF88]/50 hover:text-[#00FF88]"
          >
            Join
          </Link>
        </div>

        {/* ─── Global Leaderboard ─── */}
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#00FF88]/30" />
            <h2 className="text-2xl md:text-3xl font-black text-white text-center tracking-tight">
              Global Ranking
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#00FF88]/30" />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-[#00FF88] text-xl animate-pulse font-bold">Loading...</div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No players yet. Be the first!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {leaderboard.map((player, i) => {
                const isTop3 = i < 3;
                return (
                  <div
                    key={player.id}
                    className="group flex items-center gap-3 md:gap-4 rounded-2xl px-4 md:px-6 py-3 md:py-4 transition-all hover:scale-[1.02]"
                    style={{
                      backgroundColor: isTop3
                        ? "rgba(0, 255, 136, 0.08)"
                        : "rgba(13, 17, 23, 0.6)",
                      border: isTop3
                        ? "1px solid rgba(0, 255, 136, 0.2)"
                        : "1px solid rgba(255, 255, 255, 0.05)",
                      boxShadow: i === 0
                        ? "0 0 30px rgba(0, 255, 136, 0.15), inset 0 1px 0 rgba(0, 255, 136, 0.1)"
                        : "none",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    {/* Rank */}
                    <span className="text-2xl md:text-3xl min-w-[40px] text-center">
                      {isTop3 ? medals[i] : (
                        <span className="text-gray-600 font-bold text-xl">
                          {i + 1}
                        </span>
                      )}
                    </span>

                    {/* Avatar */}
                    <span
                      className="text-3xl md:text-4xl"
                      style={{
                        filter: i === 0 ? "drop-shadow(0 0 8px rgba(0, 255, 136, 0.5))" : "none",
                      }}
                    >
                      {player.avatar}
                    </span>

                    {/* Name + badges */}
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-lg md:text-xl font-bold truncate block ${
                          isTop3 ? "text-white" : "text-gray-300"
                        }`}
                      >
                        {player.nickname}
                      </span>
                      {/* Achievement badges */}
                      {player.achievements && player.achievements.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {player.achievements.map((a) => (
                            <span
                              key={a.id}
                              className="text-sm"
                              title={ACHIEVEMENT_META[a.achievement_type as keyof typeof ACHIEVEMENT_META]?.description}
                            >
                              {ACHIEVEMENT_META[a.achievement_type as keyof typeof ACHIEVEMENT_META]?.icon}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 md:gap-4 shrink-0">
                      <div className="hidden md:flex flex-col items-center">
                        <span className="text-gray-500 text-xs uppercase">Games</span>
                        <span className="text-white font-bold">{player.total_games}</span>
                      </div>
                      <div className="hidden md:flex flex-col items-center">
                        <span className="text-gray-500 text-xs uppercase">Wins</span>
                        <span className="text-[#FFD700] font-bold">{player.total_wins}</span>
                      </div>

                      {/* XP */}
                      <div
                        className="flex flex-col items-end"
                      >
                        <span
                          className={`text-xl md:text-2xl font-black tabular-nums ${
                            isTop3 ? "text-[#00FF88]" : "text-gray-400"
                          }`}
                          style={{
                            textShadow: i === 0 ? "0 0 12px rgba(0, 255, 136, 0.5)" : "none",
                          }}
                        >
                          {player.total_xp.toLocaleString()}
                        </span>
                        <span className="text-[#00FF88]/60 text-xs font-bold uppercase">XP</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center pb-6">
        <p className="text-gray-600 text-xs">
          Built on Avalanche
        </p>
      </div>
    </div>
  );
}
