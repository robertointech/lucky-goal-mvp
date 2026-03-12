"use client";

import Link from "next/link";
import { useState } from "react";

const faqs = [
  {
    q: "What is Lucky Goal?",
    a: "Lucky Goal is a live trivia and penalty kick game where players compete in real-time tournaments. Answer trivia questions correctly to earn penalty kick attempts, score goals, and climb the leaderboard — all while competing for AVAX crypto prizes.",
  },
  {
    q: "How do I join a tournament?",
    a: "Tap 'Join' on the home screen, enter the 6-character game code shared by the host, choose a nickname and avatar, and you're in! Wait in the lobby until the host starts the tournament.",
  },
  {
    q: "Do I need a wallet?",
    a: "No! Lucky Goal uses Passkey wallets powered by Thirdweb. A wallet is automatically created for you using your device's biometric authentication (Face ID, fingerprint, etc.). No seed phrases, no extensions — just play.",
  },
  {
    q: "How do prizes work?",
    a: "The host sets an AVAX prize pool when creating a tournament. The winner at the end of all rounds can claim the prize directly to their Passkey wallet. Prizes are paid on the Avalanche blockchain.",
  },
  {
    q: "What is a Passkey wallet?",
    a: "A Passkey wallet is a crypto wallet secured by your device's biometrics (fingerprint or face scan) instead of a traditional seed phrase. It's created automatically when you play, making Web3 completely frictionless.",
  },
  {
    q: "Is it free to play?",
    a: "Yes! Joining and playing tournaments is completely free. Only the host needs AVAX to fund the prize pool. Players never pay gas fees or entry costs.",
  },
  {
    q: "How does the penalty kick work?",
    a: "After each trivia question, you take a penalty kick. If you answered correctly, you get to shoot — pick a direction (left, center, or right) and try to beat the goalkeeper. If you answered wrong, the goalkeeper automatically saves your shot. There's always a 30% chance the keeper dives the same direction you kick!",
  },
  {
    q: "What blockchain does it use?",
    a: "Lucky Goal runs on Avalanche (AVAX), a fast and low-cost blockchain. Tournaments and prize claims happen on the Avalanche Fuji testnet, with plans to move to mainnet.",
  },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col">
      {/* Header */}
      <div className="px-4 pt-8 pb-4 flex items-center gap-3">
        <Link
          href="/"
          className="text-gray-400 hover:text-[#00FF88] transition-colors text-sm font-semibold"
        >
          &larr; Back
        </Link>
      </div>

      <div className="flex-1 px-4 pb-12 max-w-2xl mx-auto w-full">
        <h1 className="text-3xl md:text-4xl font-black text-white text-center mb-2">
          FAQ
        </h1>
        <p className="text-gray-500 text-center mb-8">
          Everything you need to know about Lucky Goal
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
        <p className="text-gray-600 text-xs">Built on Avalanche</p>
      </div>
    </div>
  );
}
