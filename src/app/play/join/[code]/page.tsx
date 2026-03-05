"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTournament, joinTournament } from "@/lib/gameLogic";
import AvatarPicker from "@/components/ui/AvatarPicker";
import type { Avatar } from "@/types/game";
import type { Tournament } from "@/types/game";

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
      // Store player ID for this session
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
        <div className="text-[#00FF88] text-xl animate-pulse">Buscando torneo...</div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a1a2e] px-4">
        <div className="text-4xl mb-4">😕</div>
        <h2 className="text-xl text-white font-bold mb-2">Torneo no encontrado</h2>
        <p className="text-gray-400 mb-6">El codigo "{code}" no existe</p>
        <button
          onClick={() => router.push("/play")}
          className="bg-[#00FF88] text-black font-bold py-3 px-6 rounded-xl"
        >
          Intentar otro codigo
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#1a1a2e] px-4 py-6">
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">Unirse al Torneo</h1>
          <p className="text-[#00FF88] font-mono text-lg mt-1">{code}</p>
          {tournament.prize_amount > 0 && (
            <span className="inline-block mt-2 bg-[#00FF88]/10 text-[#00FF88] px-3 py-1 rounded-full text-sm border border-[#00FF88]/30">
              Premio: {tournament.prize_amount} AVAX
            </span>
          )}
        </div>

        {/* Avatar */}
        <div className="mb-6">
          <label className="text-gray-400 text-sm block mb-3">
            Elige tu avatar
          </label>
          <AvatarPicker selected={avatar} onSelect={setAvatar} />
        </div>

        {/* Nickname */}
        <div className="mb-6">
          <label className="text-gray-400 text-sm block mb-2">
            Tu nombre
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Ej: Messi Jr"
            maxLength={20}
            className="w-full bg-[#0D1117] border-2 border-gray-700 rounded-xl px-4 py-3 text-white text-lg focus:border-[#00FF88] focus:outline-none transition-colors"
            autoComplete="off"
          />
        </div>

        {/* Preview */}
        {avatar && nickname && (
          <div className="flex items-center gap-3 bg-[#0D1117] border border-gray-800 rounded-xl px-4 py-3 mb-6">
            <span className="text-3xl">{avatar}</span>
            <span className="text-white font-medium">{nickname}</span>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-center text-sm mb-4">{error}</p>
        )}

        {/* Join */}
        <div className="mt-auto">
          <button
            onClick={handleJoin}
            disabled={!nickname.trim() || !avatar || joining}
            className="w-full bg-[#00FF88] text-black font-bold py-4 px-6 rounded-xl text-lg hover:bg-green-400 transition-colors active:scale-95 transform disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {joining ? "Uniendose..." : "Entrar al Torneo"}
          </button>
        </div>
      </div>
    </div>
  );
}
