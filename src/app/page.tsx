"use client";

import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import { getLeaderboard } from "@/lib/globalPlayers";
import { getUnreadCount } from "@/lib/messages";
import { ACHIEVEMENT_META, MEDAL_META } from "@/types/game";
import type { GlobalPlayer, Achievement, Medal, MedalType } from "@/types/game";
import { useLanguage } from "@/contexts/LanguageContext";

type LeaderboardEntry = GlobalPlayer & { achievements: Achievement[]; medals: Medal[] };

function useInView(): [(node: HTMLElement | null) => void, boolean] {
  const [visible, setVisible] = useState(false);
  const obsRef = useRef<IntersectionObserver | null>(null);
  const cbRef = useCallback((node: HTMLElement | null) => {
    if (obsRef.current) obsRef.current.disconnect();
    if (!node) return;
    obsRef.current = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obsRef.current?.disconnect(); } },
      { threshold: 0.15 }
    );
    obsRef.current.observe(node);
  }, []);
  return [cbRef, visible];
}

export default function LandingPage() {
  const { t } = useLanguage();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const [howRef, howVis] = useInView();
  const [featRef, featVis] = useInView();
  const [rankRef, rankVis] = useInView();
  const [medalRef, medalVis] = useInView();

  useEffect(() => {
    getLeaderboard(10)
      .then(setLeaderboard)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const wallet = localStorage.getItem("lucky_goal_wallet");
    if (!wallet) return;
    getUnreadCount(wallet)
      .then(setUnreadCount)
      .catch(console.error);
  }, []);

  const podiumMedals = ["🥇", "🥈", "🥉"];

  const steps = [
    { icon: "🎮", titleKey: "landing.step1Title" as const, descKey: "landing.step1Desc" as const },
    { icon: "📱", titleKey: "landing.step2Title" as const, descKey: "landing.step2Desc" as const },
    { icon: "🏆", titleKey: "landing.step3Title" as const, descKey: "landing.step3Desc" as const },
  ];

  const features = [
    { icon: "⚡", titleKey: "landing.feat1Title" as const, descKey: "landing.feat1Desc" as const },
    { icon: "🔐", titleKey: "landing.feat2Title" as const, descKey: "landing.feat2Desc" as const },
    { icon: "💎", titleKey: "landing.feat3Title" as const, descKey: "landing.feat3Desc" as const },
    { icon: "📝", titleKey: "landing.feat4Title" as const, descKey: "landing.feat4Desc" as const },
  ];

  const allMedals = Object.entries(MEDAL_META) as [MedalType, typeof MEDAL_META[MedalType]][];

  return (
    <div className="min-h-screen flex flex-col bg-[#1a1a2e]">
      {/* ─── HERO ─── */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/hero.jpeg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e]/80 via-[#1a1a2e]/60 to-[#1a1a2e]" />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <img
            src="/logo.jpeg"
            alt="Lucky Goal"
            className="w-24 h-24 rounded-2xl object-cover mb-6 shadow-lg shadow-black/40 animate-[fadeInDown_0.8s_ease-out]"
          />
          <h1 className="text-5xl md:text-7xl font-black text-white text-center mb-3 tracking-tight animate-[fadeInUp_0.8s_ease-out]">
            Lucky Goal
          </h1>
          <p className="text-gray-300 text-lg md:text-xl text-center max-w-md mb-10 animate-[fadeInUp_0.8s_ease-out_0.2s_backwards]">
            {t("landing.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm animate-[fadeInUp_0.8s_ease-out_0.4s_backwards]">
            <Link
              href="/host"
              className="flex-1 text-center py-4 px-6 rounded-xl text-lg font-bold transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, #00FF88, #00CC6A)",
                color: "#000",
                boxShadow: "0 0 25px rgba(0,255,136,0.3)",
              }}
            >
              {t("landing.createTournament")}
            </Link>
            <Link
              href="/play"
              className="flex-1 text-center py-4 px-6 rounded-xl text-lg font-bold border-2 border-white/20 text-white transition-all active:scale-95 hover:border-[#00FF88]/50 hover:text-[#00FF88]"
            >
              {t("landing.join")}
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M7 13l5 5 5-5M7 6l5 5 5-5"/></svg>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section
        ref={howRef}
        className="px-4 py-20 transition-all duration-700"
        style={{ opacity: howVis ? 1 : 0, transform: howVis ? "translateY(0)" : "translateY(40px)" }}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-white text-center mb-12">
            {t("landing.howItWorks")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div
                key={i}
                className="relative rounded-2xl p-6 text-center"
                style={{
                  background: "rgba(13, 17, 23, 0.6)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#00FF88] text-black font-black text-sm flex items-center justify-center">
                  {i + 1}
                </div>
                <span className="text-4xl block mb-4 mt-2">{step.icon}</span>
                <h3 className="text-white font-bold text-lg mb-2">{t(step.titleKey)}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{t(step.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section
        ref={featRef}
        className="px-4 py-20 transition-all duration-700"
        style={{ opacity: featVis ? 1 : 0, transform: featVis ? "translateY(0)" : "translateY(40px)" }}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-white text-center mb-12">
            {t("landing.features")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {features.map((feat, i) => (
              <div
                key={i}
                className="rounded-2xl p-6"
                style={{
                  background: "rgba(13, 17, 23, 0.6)",
                  border: "1px solid rgba(0, 255, 136, 0.1)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <span className="text-3xl block mb-3">{feat.icon}</span>
                <h3 className="text-white font-bold text-lg mb-1">{t(feat.titleKey)}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{t(feat.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── GLOBAL RANKING ─── */}
      <section
        ref={rankRef}
        className="px-4 py-20 transition-all duration-700"
        style={{ opacity: rankVis ? 1 : 0, transform: rankVis ? "translateY(0)" : "translateY(40px)" }}
      >
        <div className="w-full max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#00FF88]/30" />
            <h2 className="text-2xl md:text-3xl font-black text-white text-center tracking-tight">
              {t("landing.globalRanking")}
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#00FF88]/30" />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-[#00FF88] text-xl animate-pulse font-bold">{t("landing.loading")}</div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">{t("landing.noPlayers")}</p>
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
                    <span className="text-2xl md:text-3xl min-w-[40px] text-center">
                      {isTop3 ? podiumMedals[i] : (
                        <span className="text-gray-600 font-bold text-xl">{i + 1}</span>
                      )}
                    </span>
                    <span
                      className="text-3xl md:text-4xl"
                      style={{ filter: i === 0 ? "drop-shadow(0 0 8px rgba(0, 255, 136, 0.5))" : "none" }}
                    >
                      {player.avatar}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className={`text-lg md:text-xl font-bold truncate block ${isTop3 ? "text-white" : "text-gray-300"}`}>
                        {player.nickname}
                      </span>
                      {player.achievements && player.achievements.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {player.achievements.map((a) => (
                            <span key={a.id} className="text-sm" title={ACHIEVEMENT_META[a.achievement_type as keyof typeof ACHIEVEMENT_META]?.description}>
                              {ACHIEVEMENT_META[a.achievement_type as keyof typeof ACHIEVEMENT_META]?.icon}
                            </span>
                          ))}
                        </div>
                      )}
                      {player.medals && player.medals.length > 0 && (
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {[...new Map(player.medals.map((m) => [m.medal_type, m])).values()].map((m) => (
                            <span key={m.id} className="text-xs opacity-80" title={MEDAL_META[m.medal_type as keyof typeof MEDAL_META]?.description}>
                              {MEDAL_META[m.medal_type as keyof typeof MEDAL_META]?.icon}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 md:gap-4 shrink-0">
                      <div className="hidden md:flex flex-col items-center">
                        <span className="text-gray-500 text-xs uppercase">{t("landing.games")}</span>
                        <span className="text-white font-bold">{player.total_games}</span>
                      </div>
                      <div className="hidden md:flex flex-col items-center">
                        <span className="text-gray-500 text-xs uppercase">{t("landing.wins")}</span>
                        <span className="text-[#FFD700] font-bold">{player.total_wins}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span
                          className={`text-xl md:text-2xl font-black tabular-nums ${isTop3 ? "text-[#00FF88]" : "text-gray-400"}`}
                          style={{ textShadow: i === 0 ? "0 0 12px rgba(0, 255, 136, 0.5)" : "none" }}
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
      </section>

      {/* ─── MEDALS SHOWCASE ─── */}
      <section
        ref={medalRef}
        className="px-4 py-20 transition-all duration-700"
        style={{ opacity: medalVis ? 1 : 0, transform: medalVis ? "translateY(0)" : "translateY(40px)" }}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-white text-center mb-3">
            {t("landing.medallasShowcase")}
          </h2>
          <p className="text-gray-400 text-center mb-10">{t("landing.medallasDesc")}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {allMedals.map(([key, meta]) => (
              <div
                key={key}
                className="rounded-2xl p-4 text-center"
                style={{
                  background: "rgba(13, 17, 23, 0.6)",
                  border: "1px solid rgba(0, 255, 136, 0.15)",
                }}
              >
                <span className="text-4xl block mb-2">{meta.icon}</span>
                <h4 className="text-white font-bold text-sm mb-1">{meta.label}</h4>
                <p className="text-gray-500 text-xs leading-snug">{meta.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="px-4 py-10 border-t border-white/5">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-5 flex-wrap">
            <Link href="/faq" className="text-gray-400 text-sm hover:text-[#00FF88] transition-colors font-semibold">
              FAQ
            </Link>
            <Link href="/medals" className="text-gray-400 text-sm hover:text-[#00FF88] transition-colors font-semibold">
              {t("medals.title")}
            </Link>
            <Link href="/inbox" className="relative text-gray-400 text-sm hover:text-[#00FF88] transition-colors font-semibold">
              {t("inbox.title")}
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-[#00FF88] text-black text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <a href="https://github.com/robertointech/lucky-goal-mvp" target="_blank" rel="noopener noreferrer" className="text-gray-400 text-sm hover:text-[#00FF88] transition-colors font-semibold">
              {t("landing.footerGithub")}
            </a>
            <a href="https://testnet.snowtrace.io" target="_blank" rel="noopener noreferrer" className="text-gray-400 text-sm hover:text-[#00FF88] transition-colors font-semibold">
              {t("landing.footerExplorer")}
            </a>
          </div>
          <p className="text-gray-600 text-xs">{t("landing.builtOn")}</p>
        </div>
      </footer>

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
