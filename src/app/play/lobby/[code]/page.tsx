"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTournament } from "@/lib/gameLogic";
import { useGameSync } from "@/hooks/useGameSync";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Tournament } from "@/types/game";

export default function PlayerLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const [localTournament, setLocalTournament] = useState<Tournament | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [showTip, setShowTip] = useState(0);
  const { t } = useLanguage();

  const tips = [
    t("lobby.tip1"),
    t("lobby.tip2"),
    t("lobby.tip3"),
    t("lobby.tip4"),
    t("lobby.tip5"),
  ];

  useEffect(() => {
    const pid = sessionStorage.getItem(`player_${code}`);
    setPlayerId(pid);

    const load = async () => {
      const t = await getTournament(code);
      setLocalTournament(t);
    };
    load();
  }, [code]);

  // Rotate tips
  useEffect(() => {
    const interval = setInterval(() => {
      setShowTip((prev) => (prev + 1) % tips.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [tips.length]);

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
    <div className="min-h-screen flex flex-col bg-[#1a1a2e] px-4 py-6 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-[10%] left-[-10%] w-[250px] h-[250px] rounded-full opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #00FF88 0%, transparent 70%)",
          animation: "float 6s ease-in-out infinite",
        }} />
      <div className="absolute bottom-[5%] right-[-15%] w-[300px] h-[300px] rounded-full opacity-8 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #00FF88 0%, transparent 70%)",
          animation: "float 8s ease-in-out infinite reverse",
        }} />

      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col relative z-10">
        {/* My Profile Card - Hero */}
        {myAvatar && myNickname && (
          <div className="text-center mb-6 pt-2">
            <div className="inline-block relative">
              <div className="text-7xl mb-2" style={{ filter: "drop-shadow(0 0 15px rgba(0,255,136,0.3))" }}>
                {myAvatar}
              </div>
              {/* Glow ring behind avatar */}
              <div className="absolute inset-0 rounded-full opacity-20 pointer-events-none"
                style={{
                  background: "radial-gradient(circle, #00FF88 0%, transparent 70%)",
                  animation: "pulse-glow 2s ease-in-out infinite",
                }} />
            </div>
            <h2 className="text-2xl font-black text-white">{myNickname}</h2>
            <div className="inline-flex items-center gap-2 mt-2 bg-[#0D1117] border border-gray-800 rounded-full px-4 py-1.5">
              <div className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse" />
              <span className="text-[#00FF88] font-mono text-sm font-bold">{code}</span>
            </div>
          </div>
        )}

        {/* Waiting Animation */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 bg-[#00FF88] rounded-full"
                style={{
                  animation: "bounce-dot 1.4s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`,
                  boxShadow: "0 0 8px rgba(0,255,136,0.5)",
                }}
              />
            ))}
          </div>
          <p className="text-white font-bold text-lg">{t("lobby.waitingForHostLong")}</p>
          <p className="text-gray-500 text-sm mt-1">{t("lobby.startSoon")}</p>
        </div>

        {/* Tips Carousel */}
        <div className="bg-[#0D1117] border border-gray-800 rounded-2xl px-5 py-4 mb-6 min-h-[72px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 font-bold">{t("lobby.tip")}</p>
            <p className="text-gray-300 text-sm transition-opacity duration-500" key={showTip}>
              {tips[showTip]}
            </p>
          </div>
        </div>

        {/* Players Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">
              {t("lobby.players")}
            </p>
            <div className="flex items-center gap-1.5 bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-full px-3 py-1"
              style={{ boxShadow: "0 0 10px rgba(0,255,136,0.1)" }}>
              <span className="text-[#00FF88] font-black text-sm">{players.length}</span>
              <span className="text-[#00FF88]/60 text-xs">{t("lobby.online")}</span>
            </div>
          </div>

          {/* Player bubbles grid */}
          <div className="grid grid-cols-4 gap-3">
            {players.map((player, index) => (
              <div
                key={player.id}
                className="flex flex-col items-center gap-1 transition-all"
                style={{
                  animation: `pop-in 0.4s ease-out ${index * 0.1}s both`,
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all"
                  style={{
                    backgroundColor: player.id === playerId ? "rgba(0,255,136,0.15)" : "#0D1117",
                    border: player.id === playerId ? "2px solid #00FF88" : "2px solid #1f2937",
                    boxShadow: player.id === playerId ? "0 0 15px rgba(0,255,136,0.2)" : "none",
                  }}
                >
                  {player.avatar}
                </div>
                <span className={`text-[10px] font-bold truncate max-w-[56px] text-center ${
                  player.id === playerId ? "text-[#00FF88]" : "text-gray-400"
                }`}>
                  {player.id === playerId ? t("lobby.you") : player.nickname}
                </span>
              </div>
            ))}

            {/* Empty slots with pulse */}
            {players.length < 8 && Array.from({ length: Math.min(3, 8 - players.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-gray-800 flex items-center justify-center animate-pulse">
                  <span className="text-gray-800 text-lg">?</span>
                </div>
                <span className="text-[10px] text-gray-800">...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t border-gray-800/50">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-[#00FF88] rounded-full"
              style={{ boxShadow: "0 0 6px rgba(0,255,136,0.5)", animation: "pulse-glow 2s ease-in-out infinite" }} />
            <span className="text-gray-500 text-xs font-medium">{t("lobby.connectionActive")}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes bounce-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
        @keyframes pop-in {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
