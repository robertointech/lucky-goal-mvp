"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PlayPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleJoin = () => {
    const code = pin.toUpperCase().trim();
    if (code.length < 4) {
      setError("Codigo muy corto");
      return;
    }
    router.push(`/play/join/${code}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-[#1a1a2e]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">⚽</div>
          <h1 className="text-3xl font-bold text-white">Lucky Goal</h1>
          <p className="text-gray-400 mt-1">Ingresa el codigo del torneo</p>
        </div>

        {/* PIN Input */}
        <div className="mb-6">
          <input
            type="text"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.toUpperCase());
              setError("");
            }}
            placeholder="CODIGO"
            maxLength={6}
            className="w-full bg-[#0D1117] border-2 border-gray-700 rounded-xl px-4 py-4 text-center text-white text-3xl font-mono font-bold tracking-[0.3em] placeholder:text-gray-600 placeholder:tracking-normal placeholder:text-lg focus:border-[#00FF88] focus:outline-none transition-colors"
            autoFocus
            autoComplete="off"
          />
          {error && (
            <p className="text-red-500 text-center text-sm mt-2">{error}</p>
          )}
        </div>

        {/* Join Button */}
        <button
          onClick={handleJoin}
          disabled={pin.length < 4}
          className="w-full bg-[#00FF88] text-black font-bold py-4 px-6 rounded-xl text-lg hover:bg-green-400 transition-colors active:scale-95 transform disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Unirse
        </button>

        <p className="text-gray-600 text-xs text-center mt-6">
          Pide el codigo al organizador del torneo
        </p>
      </div>
    </div>
  );
}
