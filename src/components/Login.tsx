"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb";
import { avalancheFuji } from "thirdweb/chains";
import { inAppWallet } from "thirdweb/wallets";

export default function Login() {
  const wallets = [
    inAppWallet({
      auth: {
        options: ["email", "google"],
      },
    }),
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          ⚽ Lucky Goal
        </h1>
        <p className="text-gray-400 text-lg">
          Trivia + Penalties = Engagement
        </p>
      </div>

      {/* Card */}
      <div className="card w-full max-w-sm text-center">
        <h2 className="text-xl font-semibold mb-2">¡Bienvenido!</h2>
        <p className="text-gray-400 text-sm mb-6">
          Inicia sesión para jugar
        </p>

        {/* Thirdweb Connect Button */}
        <div className="flex justify-center">
          <ConnectButton
            client={client}
            wallets={wallets}
            chain={avalancheFuji}
            connectButton={{
              label: "Iniciar Sesión",
              style: {
                backgroundColor: "#00FF7F",
                color: "#000",
                fontWeight: "bold",
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: "16px",
                width: "100%",
              },
            }}
            connectModal={{
              title: "Lucky Goal",
              titleIcon: "⚽",
              size: "compact",
            }}
          />
        </div>

        <p className="text-gray-500 text-xs mt-4">
          No necesitas wallet ni crypto
        </p>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 text-sm">
          Built on Avalanche 🔺
        </p>
      </div>
    </div>
  );
}
