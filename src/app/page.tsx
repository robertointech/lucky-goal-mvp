"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#1a1a2e] relative overflow-hidden">
      {/* Hero background */}
      <div className="absolute inset-0">
        <img
          src="/hero.jpeg"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e]/70 via-[#1a1a2e]/60 to-[#1a1a2e]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <img
          src="/logo.jpeg"
          alt="Lucky Goal"
          className="w-24 h-24 rounded-2xl object-cover mb-6 shadow-lg shadow-black/30"
        />

        <h1 className="text-5xl md:text-6xl font-black text-white text-center mb-3 tracking-tight">
          Lucky Goal
        </h1>
        <p className="text-gray-300 text-lg md:text-xl text-center max-w-md mb-10">
          Trivia + Penales en vivo. Compite por premios en AVAX.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <Link
            href="/host"
            className="flex-1 text-center py-4 px-6 rounded-xl text-lg font-bold transition-all active:scale-95"
            style={{
              background: "linear-gradient(135deg, #00FF88, #00CC6A)",
              color: "#000",
              boxShadow: "0 0 25px rgba(0,255,136,0.3)",
            }}
          >
            Crear Torneo
          </Link>
          <Link
            href="/play"
            className="flex-1 text-center py-4 px-6 rounded-xl text-lg font-bold border-2 border-white/20 text-white transition-all active:scale-95 hover:border-[#00FF88]/50 hover:text-[#00FF88]"
          >
            Unirse
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center pb-6">
        <p className="text-gray-600 text-xs">
          Built on Avalanche
        </p>
      </div>
    </div>
  );
}
