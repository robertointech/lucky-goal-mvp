"use client";

import { useNearWallet } from "@/hooks/useNearWallet";

interface HomeProps {
  account: { address: string };
  onStartGame: () => void;
}

export default function Home({ account, onStartGame }: HomeProps) {
  const { connect } = useNearWallet();

  const shortAddress = account.address
    ? account.address.length > 20
      ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
      : account.address
    : "";

  return (
    <div className="min-h-screen flex flex-col items-center justify-between py-8 px-4">
      {/* Header */}
      <div className="w-full max-w-sm flex justify-between items-center">
        <div className="text-lucky-green font-bold">Lucky Goal</div>
        <button
          onClick={connect}
          className="text-xs px-3 py-2 rounded-lg border border-gray-700 text-white bg-[#0D1117]"
        >
          {shortAddress || "Connect"}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-4">&#9917;</div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Lucky Goal
        </h1>
        <p className="text-gray-400 mb-2">
          Wallet connected:
        </p>
        <code className="bg-lucky-card px-3 py-1 rounded text-lucky-green text-sm mb-8">
          {shortAddress}
        </code>

        {/* Play Button */}
        <button
          onClick={onStartGame}
          className="btn-primary text-xl px-12 py-4"
        >
          PLAY
        </button>

        <p className="text-gray-500 text-sm mt-4">
          5 questions + 5 penalties
        </p>
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-gray-600 text-xs">
          Multichain: Avalanche + Arbitrum + NEAR
        </p>
      </div>
    </div>
  );
}
