"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getInboxMessages, markAllAsRead } from "@/lib/messages";
import type { Message } from "@/lib/messages";
import { useLanguage } from "@/contexts/LanguageContext";

export default function InboxPage() {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("lucky_goal_wallet");
    setWallet(stored);

    if (!stored) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const msgs = await getInboxMessages(stored);
        setMessages(msgs);
        await markAllAsRead(stored);
      } catch (err) {
        console.error("Inbox load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateWallet = (w: string) => `${w.slice(0, 6)}...${w.slice(-4)}`;

  return (
    <div className="min-h-screen flex flex-col bg-[#1a1a2e]">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-[-20%] left-[50%] translate-x-[-50%] w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #00FF88 0%, transparent 70%)" }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-4 px-4 py-5 border-b border-white/5">
        <Link
          href="/"
          className="text-gray-500 hover:text-[#00FF88] transition-colors text-sm font-semibold"
        >
          ← {t("inbox.back")}
        </Link>
        <div className="flex-1" />
        <h1 className="text-white font-black text-xl">{t("inbox.title")}</h1>
        <div className="flex-1" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center px-4 py-6 max-w-lg mx-auto w-full">
        <p className="text-gray-500 text-sm mb-6 text-center">{t("inbox.subtitle")}</p>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#00FF88]/30 border-t-[#00FF88] rounded-full animate-spin" />
          </div>
        ) : !wallet ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-400 text-base">No wallet connected</p>
            <p className="text-gray-600 text-sm mt-2">
              Win a tournament and claim your prize to connect a wallet.
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-400 text-base">{t("inbox.noMessages")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="bg-[#0D1117] border border-white/8 rounded-xl p-4 relative"
              >
                {/* Unread dot — show for messages that were unread on load */}
                {!msg.read && (
                  <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-[#00FF88]" />
                )}
                <div className="flex items-start gap-3">
                  <div className="text-2xl mt-0.5">📩</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-gray-500 text-xs uppercase tracking-wider">
                        {t("inbox.from")}
                      </span>
                      <span className="text-[#00FF88] font-mono text-xs">
                        {truncateWallet(msg.sender_wallet)}
                      </span>
                      <span className="text-gray-600 text-xs">·</span>
                      <span className="text-gray-500 text-xs uppercase tracking-wider">
                        {t("inbox.tournament")}
                      </span>
                      <span className="text-white font-bold text-xs">
                        {msg.tournament_code}
                      </span>
                    </div>
                    <p className="text-white text-sm leading-relaxed">{msg.message_text}</p>
                    <p className="text-gray-600 text-xs mt-2">{formatDate(msg.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
