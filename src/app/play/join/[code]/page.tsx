"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTournament, joinTournament } from "@/lib/gameLogic";
import type { Avatar } from "@/types/game";
import type { Tournament } from "@/types/game";
import { AVATARS } from "@/types/game";

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"avatar" | "nickname">("avatar");

  useEffect(() => {
    const load = async () => {
      const t = await getTournament(code);
      setTournament(t);
      setLoading(false);
      if (!t) setError("Torneo no encontrado");
    };
    load();
  }, [code]);

  const handleJoin = async () => {
    if (!tournament || !nickname.trim() || !avatar) return;
    setJoining(true);
    setError("");

    try {
      const player = await joinTournament(tournament.id, nickname.trim(), avatar);
      sessionStorage.setItem(`player_${code}`, player.id);
      sessionStorage.setItem(`player_nickname_${code}`, player.nickname);
      sessionStorage.setItem(`player_avatar_${code}`, player.avatar);
      router.push(`/play/lobby/${code}`);
    } catch (err) {
      setError("Error al unirse. Intenta de nuevo.");
      console.error(err);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e]">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-spin" style={{ animationDuration: "2s" }}>&#9917;</div>
          <div className="text-[#00FF88] text-lg font-bold animate-pulse">Buscando torneo...</div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a1a2e] px-4">
        <div className="text-6xl mb-4">&#128533;</div>
        <h2 className="text-2xl text-white font-black mb-2">Torneo no encontrado</h2>
        <p className="text-gray-400 mb-6">El codigo &quot;{code}&quot; no existe</p>
        <button
          onClick={() => router.push("/play")}
          className="bg-[#00FF88] text-black font-bold py-3 px-8 rounded-2xl text-lg"
          style={{ boxShadow: "0 0 20px rgba(0,255,136,0.3)" }}
        >
          Intentar otro codigo
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#1a1a2e] px-4 py-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-30%] right-[-20%] w-[400px] h-[400px] rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #00FF88 0%, transparent 70%)" }} />

      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col relative z-10">
        {/* Header with tournament info */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-[#0D1117] border border-gray-800 rounded-full px-4 py-1.5 mb-3">
            <div className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse" />
            <span className="text-[#00FF88] font-mono text-sm font-bold">{code}</span>
          </div>
          <h1 className="text-2xl font-black text-white">
            {step === "avatar" ? "Elige tu avatar" : "Tu nombre"}
          </h1>
          {tournament.prize_amount > 0 && (
            <div className="mt-2 inline-flex items-center gap-1.5 bg-[#00FF88]/10 text-[#00FF88] px-4 py-1.5 rounded-full text-sm font-bold border border-[#00FF88]/30"
              style={{ boxShadow: "0 0 15px rgba(0,255,136,0.1)" }}>
              <span>&#127942;</span> Premio: {tournament.prize_amount} AVAX
            </div>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === "avatar" ? "w-8 bg-[#00FF88]" : "w-4 bg-[#00FF88]/40"}`}
            style={step === "avatar" ? { boxShadow: "0 0 8px rgba(0,255,136,0.5)" } : {}} />
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === "nickname" ? "w-8 bg-[#00FF88]" : "w-4 bg-gray-700"}`}
            style={step === "nickname" ? { boxShadow: "0 0 8px rgba(0,255,136,0.5)" } : {}} />
        </div>

        {/* Avatar Step */}
        {step === "avatar" && (
          <div className="flex-1 flex flex-col">
            <div className="grid grid-cols-4 gap-3">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAvatar(a)}
                  className="aspect-square rounded-2xl flex items-center justify-center text-4xl transition-all duration-200 active:scale-90"
                  style={{
                    backgroundColor: avatar === a ? "rgba(0,255,136,0.15)" : "#0D1117",
                    border: avatar === a ? "2px solid #00FF88" : "2px solid #1f2937",
                    boxShadow: avatar === a ? "0 0 20px rgba(0,255,136,0.2), inset 0 0 15px rgba(0,255,136,0.1)" : "none",
                    transform: avatar === a ? "scale(1.08)" : "scale(1)",
                  }}
                >
                  {a}
                </button>
              ))}
            </div>

            {/* Selected preview */}
            {avatar && (
              <div className="text-center mt-6">
                <div className="inline-block text-7xl animate-bounce" style={{ animationDuration: "1.5s" }}>
                  {avatar}
                </div>
              </div>
            )}

            <div className="mt-auto pt-6">
              <button
                onClick={() => avatar && setStep("nickname")}
                disabled={!avatar}
                className="w-full font-black py-4 px-6 rounded-2xl text-lg transition-all duration-300 active:scale-95 transform disabled:opacity-20 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: "#00FF88",
                  color: "#000",
                  boxShadow: avatar ? "0 0 25px rgba(0,255,136,0.3)" : "none",
                }}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* Nickname Step */}
        {step === "nickname" && (
          <div className="flex-1 flex flex-col">
            {/* Avatar recap */}
            <div className="flex items-center justify-center mb-6">
              <button
                onClick={() => setStep("avatar")}
                className="flex items-center gap-2 bg-[#0D1117] border border-gray-800 rounded-2xl px-5 py-3 transition-all hover:border-gray-600"
              >
                <span className="text-4xl">{avatar}</span>
                <span className="text-gray-500 text-sm">&#9998; cambiar</span>
              </button>
            </div>

            <div className="mb-6">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="Tu nombre de jugador"
                maxLength={20}
                className="w-full bg-[#0D1117] border-2 rounded-2xl px-5 py-4 text-white text-xl text-center font-bold focus:outline-none transition-all duration-300"
                style={{
                  borderColor: nickname.length > 0 ? "#00FF88" : "#374151",
                  boxShadow: nickname.length > 0 ? "0 0 20px rgba(0,255,136,0.15)" : "none",
                }}
                autoFocus
                autoComplete="off"
              />
              <p className="text-gray-600 text-xs text-center mt-2">Max 20 caracteres</p>
            </div>

            {/* Live preview card */}
            {nickname.trim() && (
              <div className="flex items-center gap-4 bg-[#0D1117] border-2 border-[#00FF88]/30 rounded-2xl px-5 py-4 mb-6"
                style={{ boxShadow: "0 0 20px rgba(0,255,136,0.1)" }}>
                <span className="text-4xl">{avatar}</span>
                <div>
                  <p className="text-white font-bold text-lg">{nickname}</p>
                  <p className="text-[#00FF88] text-xs font-medium">Listo para jugar</p>
                </div>
              </div>
            )}

            {error && (
              <p className="text-red-400 text-center text-sm mb-4 font-medium">{error}</p>
            )}

            <div className="mt-auto">
              <button
                onClick={handleJoin}
                disabled={!nickname.trim() || joining}
                className="w-full font-black py-5 px-6 rounded-2xl text-xl transition-all duration-300 active:scale-95 transform disabled:opacity-20 disabled:cursor-not-allowed relative overflow-hidden"
                style={{
                  backgroundColor: "#00FF88",
                  color: "#000",
                  boxShadow: nickname.trim() ? "0 0 30px rgba(0,255,136,0.4)" : "none",
                }}
              >
                {/* Shimmer */}
                {nickname.trim() && !joining && (
                  <div className="absolute inset-0 overflow-hidden rounded-2xl">
                    <div className="absolute inset-0"
                      style={{
                        background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                        backgroundSize: "200% 100%",
                        animation: "shimmer 2s infinite linear",
                      }} />
                  </div>
                )}
                <span className="relative z-10">
                  {joining ? "Entrando..." : "ENTRAR AL TORNEO"}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
