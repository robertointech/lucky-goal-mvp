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
    <div className="min-h-screen flex flex-col bg-surface font-body px-4 py-6 relative overflow-hidden">
      <style>{styles}</style>

      {/* Background effects */}
      <div className="fixed inset-0 hex-bg pointer-events-none" />
      <div className="absolute top-[10%] left-[-10%] w-[250px] h-[250px] rounded-full opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #00fd87 0%, transparent 70%)",
          animation: "float 6s ease-in-out infinite",
        }} />
      <div className="absolute bottom-[5%] right-[-15%] w-[300px] h-[300px] rounded-full opacity-[0.08] pointer-events-none"
        style={{
          background: "radial-gradient(circle, #00fd87 0%, transparent 70%)",
          animation: "float 8s ease-in-out infinite reverse",
        }} />

      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col relative z-10">
        {/* My Profile Card */}
        {myAvatar && myNickname && (
          <div className="text-center mb-6 pt-2">
            <div className="inline-block relative">
              <div className="text-7xl mb-2" style={{ filter: "drop-shadow(0 0 15px rgba(0,253,135,0.3))" }}>
                {myAvatar}
              </div>
              <div className="absolute inset-0 rounded-full opacity-20 pointer-events-none"
                style={{
                  background: "radial-gradient(circle, #00fd87 0%, transparent 70%)",
                  animation: "pulse-glow 2s ease-in-out infinite",
                }} />
            </div>
            <h2 className="text-2xl font-headline font-black text-on-surface">{myNickname}</h2>
            <div className="inline-flex items-center gap-2 mt-2 bg-surface-container-low border border-outline-variant/20 rounded-full px-4 py-1.5">
              <div className="w-2 h-2 bg-primary-container rounded-full pulse-green" />
              <span className="text-primary font-mono text-sm font-bold">{code}</span>
            </div>
          </div>
        )}

        {/* Waiting Animation */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 bg-primary-container rounded-full"
                style={{
                  animation: "bounce-dot 1.4s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`,
                  boxShadow: "0 0 8px rgba(0,253,135,0.5)",
                }}
              />
            ))}
          </div>
          <p className="text-on-surface font-headline font-bold text-lg">{t("lobby.waitingForHostLong")}</p>
          <p className="text-on-surface-variant text-sm mt-1 font-body">{t("lobby.startSoon")}</p>
        </div>

        {/* Tips Carousel */}
        <div className="glass-card border border-outline-variant/20 rounded-2xl px-5 py-4 mb-6 min-h-[72px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1 font-bold">{t("lobby.tip")}</p>
            <p className="text-on-surface text-sm transition-opacity duration-500 font-body" key={showTip}>
              {tips[showTip]}
            </p>
          </div>
        </div>

        {/* Players Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-on-surface-variant text-xs uppercase tracking-widest font-bold font-body">
              {t("lobby.players")}
            </p>
            <div className="flex items-center gap-1.5 bg-primary-container/10 border border-primary/30 rounded-full px-3 py-1"
              style={{ boxShadow: "0 0 10px rgba(0,253,135,0.1)" }}>
              <span className="text-primary font-headline font-black text-sm">{players.length}</span>
              <span className="text-primary/60 text-xs font-body">{t("lobby.online")}</span>
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
                    backgroundColor: player.id === playerId ? "rgba(0,253,135,0.15)" : "rgba(32,38,47,0.6)",
                    border: player.id === playerId ? "2px solid #00fd87" : "2px solid rgba(70,70,92,0.3)",
                    boxShadow: player.id === playerId ? "0 0 15px rgba(0,253,135,0.2)" : "none",
                  }}
                >
                  {player.avatar}
                </div>
                <span className={`text-[10px] font-bold truncate max-w-[56px] text-center font-body ${
                  player.id === playerId ? "text-primary" : "text-on-surface-variant"
                }`}>
                  {player.id === playerId ? t("lobby.you") : player.nickname}
                </span>
              </div>
            ))}

            {/* Empty slots with pulse */}
            {players.length < 8 && Array.from({ length: Math.min(3, 8 - players.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-outline-variant/30 flex items-center justify-center animate-pulse">
                  <span className="text-outline-variant text-lg">?</span>
                </div>
                <span className="text-[10px] text-outline-variant font-body">...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t border-outline-variant/15">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-primary-container rounded-full pulse-green" />
            <span className="text-on-surface-variant text-xs font-medium font-body">{t("lobby.connectionActive")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = `
  .glass-card {
    background: rgba(13, 17, 23, 0.7);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
  .hex-bg {
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-opacity='0.03' fill='%2300FF88' fill-rule='evenodd'/%3E%3C/svg%3E");
  }
  .pulse-green {
    box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.7);
    animation: pulse-animation 2s infinite;
  }
  @keyframes pulse-animation {
    0% { box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(0, 255, 136, 0); }
    100% { box-shadow: 0 0 0 0 rgba(0, 255, 136, 0); }
  }
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
`;
