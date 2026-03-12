"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === "en" ? "es" : "en")}
      className="fixed top-3 right-3 z-50 bg-[#0D1117]/80 border border-white/10 rounded-full w-10 h-10 flex items-center justify-center text-lg hover:border-[#00FF88]/50 transition-all backdrop-blur-sm"
      title={lang === "en" ? "Cambiar a Español" : "Switch to English"}
    >
      {lang === "en" ? "🇪🇸" : "🇺🇸"}
    </button>
  );
}
