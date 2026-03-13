"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { MEDAL_META } from "@/types/game";
import type { MedalType, Medal } from "@/types/game";
import { getMedalsForPlayer } from "@/lib/globalPlayers";
import { supabase } from "@/lib/supabase";

const MEDAL_TYPES = Object.keys(MEDAL_META) as MedalType[];

export default function MedalsPage() {
  const { t } = useLanguage();
  const [earnedMedals, setEarnedMedals] = useState<Medal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const wallet = localStorage.getItem("lucky_goal_wallet");
        if (!wallet) return;

        const { data: globalPlayer } = await supabase
          .from("global_players")
          .select("id")
          .eq("wallet_address", wallet)
          .maybeSingle();

        if (globalPlayer) {
          const medals = await getMedalsForPlayer(globalPlayer.id);
          setEarnedMedals(medals);
        }
      } catch (err) {
        console.error("Medals load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Count how many times each medal type was earned
  const earnedCountByType = earnedMedals.reduce<Record<string, number>>((acc, m) => {
    acc[m.medal_type] = (acc[m.medal_type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col">
      {/* Header */}
      <div className="px-4 pt-8 pb-4 flex items-center gap-3">
        <Link
          href="/"
          className="text-gray-400 hover:text-[#00FF88] transition-colors text-sm font-semibold"
        >
          &larr; {t("medals.back")}
        </Link>
      </div>

      <div className="flex-1 px-4 pb-12 max-w-2xl mx-auto w-full">
        <h1 className="text-3xl md:text-4xl font-black text-white text-center mb-2">
          {t("medals.title")}
        </h1>
        <p className="text-gray-500 text-center mb-8">
          {t("medals.subtitle")}
        </p>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-[#00FF88] text-xl animate-pulse font-bold">
              {t("medals.title")}...
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MEDAL_TYPES.map((type) => {
              const meta = MEDAL_META[type];
              const count = earnedCountByType[type] ?? 0;
              const earned = count > 0;

              return (
                <div
                  key={type}
                  className="rounded-2xl p-5 flex items-center gap-4 transition-all"
                  style={{
                    backgroundColor: earned
                      ? "rgba(0, 255, 136, 0.08)"
                      : "rgba(13, 17, 23, 0.6)",
                    border: earned
                      ? "1px solid rgba(0, 255, 136, 0.25)"
                      : "1px solid rgba(255, 255, 255, 0.05)",
                    opacity: earned ? 1 : 0.4,
                  }}
                >
                  {/* Icon */}
                  <span
                    className="text-5xl shrink-0"
                    style={{
                      filter: earned
                        ? "drop-shadow(0 0 10px rgba(0,255,136,0.4))"
                        : "grayscale(1)",
                    }}
                  >
                    {meta.icon}
                  </span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-white text-lg">
                        {meta.label}
                      </span>
                      {earned && (
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: "rgba(0,255,136,0.15)",
                            color: "#00FF88",
                          }}
                        >
                          {t("medals.earned")}
                        </span>
                      )}
                      {!earned && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 text-gray-500">
                          {t("medals.locked")}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm leading-snug">
                      {meta.description}
                    </p>
                    {earned && count > 1 && (
                      <p className="text-[#00FF88]/60 text-xs mt-1 font-semibold">
                        {count} {t("medals.timesEarned")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pb-6">
        <p className="text-gray-600 text-xs">{t("landing.builtOn")}</p>
      </div>
    </div>
  );
}
