"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb";
import { avalancheFuji } from "thirdweb/chains";
import type { Account } from "thirdweb/wallets";

interface HomeProps {
  account: Account;
  onStartGame: () => void;
}

export default function Home({ account, onStartGame }: HomeProps) {
  // Get shortened address
  const shortAddress = account.address
    ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
    : "";

  return (
    <div className="min-h-screen flex flex-col items-center justify-between py-8 px-4">
      {/* Header */}
      <div className="w-full max-w-sm flex justify-between items-center">
        <div className="text-lucky-green font-bold">⚽ Lucky Goal</div>
        <ConnectButton
          client={client}
          chain={avalancheFuji}
          connectButton={{
            style: {
              backgroundColor: "#0D1117",
              color: "#fff",
              fontSize: "12px",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #30363D",
            },
          }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-4">⚽</div>
        <h1 className="text-3xl font-bold text-white mb-2">
          ¡Hola!
        </h1>
        <p className="text-gray-400 mb-2">
          Wallet conectada:
        </p>
        <code className="bg-lucky-card px-3 py-1 rounded text-lucky-green text-sm mb-8">
          {shortAddress}
        </code>

        {/* Play Button */}
        <button
          onClick={onStartGame}
          className="btn-primary text-xl px-12 py-4"
        >
          🎮 JUGAR
        </button>

        <p className="text-gray-500 text-sm mt-4">
          5 preguntas • 5 penales
        </p>
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-gray-600 text-xs">
          Avalanche Fuji Testnet
        </p>
      </div>
    </div>
  );
}
