"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FAQPage() {
  const { t } = useLanguage();
  const [open, setOpen] = useState<number | null>(null);

  const faqs = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
    { q: t("faq.q5"), a: t("faq.a5") },
    { q: t("faq.q6"), a: t("faq.a6") },
    { q: t("faq.q7"), a: t("faq.a7") },
    { q: t("faq.q8"), a: t("faq.a8") },
  ];

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col">
      {/* Header */}
      <div className="px-4 pt-8 pb-4 flex items-center gap-3">
        <Link
          href="/"
          className="text-gray-400 hover:text-[#00FF88] transition-colors text-sm font-semibold"
        >
          &larr; {t("faq.back")}
        </Link>
      </div>

      <div className="flex-1 px-4 pb-12 max-w-2xl mx-auto w-full">
        <h1 className="text-3xl md:text-4xl font-black text-white text-center mb-2">
          {t("faq.title")}
        </h1>
        <p className="text-gray-500 text-center mb-8">
          {t("faq.subtitle")}
        </p>

        <div className="flex flex-col gap-2">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <button
                key={i}
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full text-left rounded-xl transition-all"
                style={{
                  backgroundColor: isOpen
                    ? "rgba(0, 255, 136, 0.06)"
                    : "rgba(13, 17, 23, 0.6)",
                  border: isOpen
                    ? "1px solid rgba(0, 255, 136, 0.25)"
                    : "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                <div className="flex items-center justify-between px-5 py-4">
                  <span
                    className={`font-bold text-base md:text-lg ${
                      isOpen ? "text-[#00FF88]" : "text-white"
                    }`}
                  >
                    {faq.q}
                  </span>
                  <span
                    className={`text-xl transition-transform duration-200 shrink-0 ml-3 ${
                      isOpen ? "rotate-45 text-[#00FF88]" : "text-gray-600"
                    }`}
                  >
                    +
                  </span>
                </div>
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    maxHeight: isOpen ? "200px" : "0px",
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <p className="px-5 pb-4 text-gray-400 text-sm md:text-base leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-6">
        <p className="text-gray-600 text-xs">{t("landing.builtOn")}</p>
      </div>
    </div>
  );
}
