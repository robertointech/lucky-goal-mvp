"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTournament, updateTournamentStatus } from "@/lib/gameLogic";
import { useGameSync } from "@/hooks/useGameSync";
import { QRCodeSVG } from "qrcode.react";
import type { Tournament } from "@/types/game";
import { useLanguage } from "@/contexts/LanguageContext";

export default function HostLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();
  const { t } = useLanguage();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
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

  const shareText = `Join my Lucky Goal tournament! Code: ${code}\n${joinUrl}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const handleShareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const handleStart = async () => {
    if (!tournament || starting) return;
    setStarting(true);
    try {
      await updateTournamentStatus(tournament.id, "question", 0);
    } catch {
      // navigate anyway — game page will re-fetch current status
    } finally {
      router.push(`/host/game/${code}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-primary text-2xl animate-pulse font-headline font-bold">
          {t("hostLobby.loading")}
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-error text-2xl font-headline font-bold">
          {t("hostLobby.notFound")}
        </div>
      </div>
    );
  }

  const canStart = players.length >= 2;

  return (
    <div className="min-h-screen flex flex-col bg-surface font-body relative overflow-hidden">
      <style>{styles}</style>

      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none hex-bg" />
      <div className="fixed top-[-20%] left-[50%] translate-x-[-50%] w-[800px] h-[800px] rounded-full opacity-[0.07] pointer-events-none"
        style={{ background: "radial-gradient(circle, #00fd87 0%, transparent 70%)" }} />

      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-surface-container-low shadow-[0px_4px_20px_rgba(0,255,136,0.1)] flex items-center justify-between px-6 py-4 w-full">
        <div className="flex items-center gap-3">
          <span className="text-primary-container text-2xl">&#9917;</span>
          <span className="font-headline font-bold tracking-tighter text-lg text-primary-container italic uppercase">
            LUCKY GOAL
          </span>
        </div>
        <div className="flex items-center gap-3">
          {tournament.prize_amount > 0 && (
            <div className="flex items-center gap-2 bg-primary-container/10 border border-primary/30 rounded-full px-4 py-1.5">
              <span className="text-primary font-headline font-black text-sm">
                {tournament.prize_amount} AVAX
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high">
            <span className="w-2 h-2 rounded-full bg-primary-container pulse-green" />
            <span className="font-body text-xs font-medium text-on-surface uppercase tracking-wider">Live Lobby</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row max-w-5xl mx-auto w-full">
        {/* Left: QR + Code */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <p className="font-body text-on-surface-variant text-sm tracking-widest uppercase mb-4">
            Tournament Room
          </p>

          {/* Tournament Code Card */}
          <div className="glass-card rounded-xl p-6 border border-primary/20 neon-border-glow relative overflow-hidden group mb-6 w-full max-w-sm">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />
            <h2 className="font-headline text-5xl font-black tracking-widest text-primary-container text-center neon-glow font-mono relative z-10">
              {code}
            </h2>
            <button
              onClick={handleCopyCode}
              className="mt-4 flex items-center justify-center gap-2 w-full text-xs font-body text-primary/80 uppercase tracking-wider relative z-10 hover:text-primary transition-colors"
            >
              {copied ? "Copied!" : "Tap to copy code"}
            </button>
          </div>

          {/* QR Code */}
          <div className="relative p-2 rounded-2xl bg-black border border-primary/30 neon-border-glow mb-6">
            <div className="p-4 bg-white rounded-xl">
              <QRCodeSVG
                value={joinUrl}
                size={200}
                bgColor="#ffffff"
                fgColor="#0a0e14"
                level="H"
              />
            </div>
            {/* Corner accents */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg" />
          </div>

          <p className="font-body text-on-surface-variant text-center text-sm px-8 leading-relaxed mb-6">
            {t("hostLobby.scanToJoin")} — {t("hostLobby.usePhone")}
          </p>

          {/* Share buttons */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white font-body font-bold text-sm transition-transform active:scale-95 shadow-lg shadow-[#25D366]/20"
            >
              WhatsApp
            </button>
            <button
              onClick={handleShareTwitter}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1DA1F2] text-white font-body font-bold text-sm transition-transform active:scale-95 shadow-lg shadow-[#1DA1F2]/20"
            >
              Twitter/X
            </button>
          </div>
        </div>

        {/* Right: Players */}
        <div className="w-full lg:w-[420px] flex flex-col border-t lg:border-t-0 lg:border-l border-outline-variant/15 bg-surface-container-low/50">
          {/* Player count header */}
          <div className="px-6 py-5 border-b border-outline-variant/15">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-14 h-14 rounded-2xl font-headline font-bold text-2xl transition-all ${
                    flashCount
                      ? "bg-primary-container text-on-primary scale-110"
                      : "bg-primary-container/15 text-primary"
                  }`}
                  style={{
                    boxShadow: flashCount ? "0 0 30px rgba(0, 253, 135, 0.5)" : "none",
                  }}
                >
                  {players.length}
                </div>
                <div>
                  <h2 className="text-on-surface font-headline font-bold text-xl">
                    {t("hostLobby.players")}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-2 h-2 bg-primary-container rounded-full animate-pulse" />
                    <span className="text-on-surface-variant text-sm font-body">
                      {t("hostLobby.roomOpen")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-error-container/20 border border-error/20">
                <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
                <span className="font-body text-[10px] text-error font-bold uppercase tracking-widest">
                  Waiting for host
                </span>
              </div>
            </div>
          </div>

          {/* Player list */}
          <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
            {players.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
                <div className="text-5xl mb-4 opacity-30">&#128241;</div>
                <p className="text-on-surface-variant text-lg font-body">
                  {t("hostLobby.waitingPlayers")}
                </p>
                <p className="text-outline text-sm mt-2 font-body">
                  {t("hostLobby.playersAppear")}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {players.map((player, i) => (
                  <div
                    key={player.id}
                    className="glass-card flex items-center justify-between p-4 rounded-xl border border-outline-variant/20 hover:border-primary/30 transition-colors animate-[slideIn_0.4s_ease-out]"
                    style={{
                      animationDelay: `${i * 0.05}s`,
                      animationFillMode: "backwards",
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-2xl">
                        {player.avatar}
                      </div>
                      <div>
                        <p className="font-body font-bold text-on-surface">{player.nickname}</p>
                        <span className="text-[10px] font-body text-on-surface-variant uppercase tracking-widest">
                          {i === 0 ? "Host" : "Ready"}
                        </span>
                      </div>
                    </div>
                    <span className="text-primary/60 text-sm font-headline font-bold">
                      #{i + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Start button area */}
          <div className="px-4 pb-5 pt-3 border-t border-outline-variant/15 bg-gradient-to-t from-surface via-surface/90 to-transparent">
            {canStart ? (
              <button
                onClick={handleStart}
                disabled={starting}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-primary-container to-primary-dim text-on-primary font-headline font-black text-xl uppercase tracking-widest shadow-[0px_0px_30px_rgba(0,255,136,0.3)] transition-all active:scale-95 active:shadow-none flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {starting && (
                  <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                )}
                {t("hostLobby.startGame")}
              </button>
            ) : (
              <div className="text-center py-4">
                <p className="text-on-surface-variant text-sm font-body">
                  {t("hostLobby.minPlayers")}
                </p>
                <div className="flex justify-center gap-1 mt-3">
                  {[0, 1].map((i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-all ${
                        i < players.length
                          ? "bg-primary-container shadow-[0_0_8px_rgba(0,253,135,0.5)]"
                          : "bg-outline-variant"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            <p className="text-center mt-3 text-[10px] font-body text-on-surface-variant uppercase tracking-wider">
              Minimum 2 players required to begin
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = `
  .glass-card {
    background: rgba(13, 17, 23, 0.7);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
  .neon-glow {
    text-shadow: 0 0 10px rgba(0, 255, 136, 0.6), 0 0 20px rgba(0, 255, 136, 0.4);
  }
  .neon-border-glow {
    box-shadow: 0 0 15px rgba(0, 255, 136, 0.3), inset 0 0 10px rgba(0, 255, 136, 0.1);
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
  .hex-bg {
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-opacity='0.03' fill='%2300FF88' fill-rule='evenodd'/%3E%3C/svg%3E");
  }
  .custom-scrollbar::-webkit-scrollbar { width: 4px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,255,136,0.2); border-radius: 10px; }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(40px); }
    to { opacity: 1; transform: translateX(0); }
  }
`;
