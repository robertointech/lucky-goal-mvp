"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PlayPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  const handleJoin = () => {
    const code = pin.toUpperCase().trim();
    if (code.length < 4) {
      setError(t("play.codeTooShort"));
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }
    router.push(`/play/join/${code}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-[#1a1a2e] relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-40%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-15 pointer-events-none"
        style={{ background: "radial-gradient(circle, #00FF88 0%, transparent 70%)" }} />
      <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #00FF88 0%, transparent 70%)" }} />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo with bounce */}
        <div className="text-center mb-10">
          <div className="text-7xl mb-4 animate-bounce" style={{ animationDuration: "2s" }}>
            <span className="drop-shadow-[0_0_20px_rgba(0,255,136,0.5)]">&#9917;</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Lucky <span className="text-[#00FF88] drop-shadow-[0_0_10px_rgba(0,255,136,0.5)]">Goal</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm">{t("play.enterCode")}</p>
        </div>

        {/* PIN Input - Big and glowing */}
        <div className={`mb-6 ${shaking ? "animate-shake" : ""}`}>
          <div className="relative">
            <input
              type="text"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.toUpperCase());
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="- - - - - -"
              maxLength={6}
              className="w-full bg-[#0D1117] border-2 rounded-2xl px-6 py-5 text-center text-white text-4xl font-mono font-black tracking-[0.4em] placeholder:text-gray-700 placeholder:tracking-[0.3em] placeholder:text-3xl focus:outline-none transition-all duration-300"
              style={{
                borderColor: error ? "#ef4444" : pin.length > 0 ? "#00FF88" : "#374151",
                boxShadow: pin.length > 0
                  ? "0 0 20px rgba(0,255,136,0.15), inset 0 0 20px rgba(0,255,136,0.05)"
                  : error
                    ? "0 0 20px rgba(239,68,68,0.2)"
                    : "none",
              }}
              autoFocus
              autoComplete="off"
            />
            {/* Character dots indicator */}
            <div className="flex justify-center gap-3 mt-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: i < pin.length ? "#00FF88" : "#374151",
                    boxShadow: i < pin.length ? "0 0 8px rgba(0,255,136,0.5)" : "none",
                    transform: i < pin.length ? "scale(1.2)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>
          {error && (
            <p className="text-red-400 text-center text-sm mt-3 font-medium">{error}</p>
          )}
        </div>

        {/* Join Button with glow */}
        <button
          onClick={handleJoin}
          disabled={pin.length < 4}
          className="w-full font-black py-5 px-6 rounded-2xl text-xl transition-all duration-300 active:scale-95 transform disabled:opacity-20 disabled:cursor-not-allowed disabled:shadow-none relative overflow-hidden"
          style={{
            backgroundColor: pin.length >= 4 ? "#00FF88" : "#00FF88",
            color: "#000",
            boxShadow: pin.length >= 4 ? "0 0 30px rgba(0,255,136,0.4), 0 4px 15px rgba(0,255,136,0.3)" : "none",
          }}
        >
          {/* Shimmer effect */}
          {pin.length >= 4 && (
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              <div className="absolute inset-0 animate-shimmer"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                  backgroundSize: "200% 100%",
                }} />
            </div>
          )}
          <span className="relative z-10">
            {pin.length >= 4 ? t("play.joinBtn") : t("play.enterTheCode")}
          </span>
        </button>

        <p className="text-gray-600 text-xs text-center mt-8">
          {t("play.askHost")}
        </p>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
      `}</style>
    </div>
  );
}
