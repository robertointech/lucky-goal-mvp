"use client";

import { useNearWallet } from "@/hooks/useNearWallet";

export default function Login() {
  const { connect } = useNearWallet();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Lucky Goal
        </h1>
        <p className="text-gray-400 text-lg">
          Trivia + Penalties = Engagement
        </p>
      </div>

      {/* Card */}
      <div className="card w-full max-w-sm text-center">
        <h2 className="text-xl font-semibold mb-2">Welcome!</h2>
        <p className="text-gray-400 text-sm mb-6">
          Connect your wallet to play
        </p>

        {/* NEAR Wallet Selector Button */}
        <div className="flex justify-center">
          <button
            onClick={connect}
            className="font-bold px-6 py-3 rounded-lg text-base w-full transition-all"
            style={{
              backgroundColor: "#00FF7F",
              color: "#000",
            }}
          >
            Connect Wallet
          </button>
        </div>

        <p className="text-gray-500 text-xs mt-4">
          Supports NEAR, Ethereum wallets & more
        </p>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 text-sm">
          Multichain: Avalanche + Arbitrum + NEAR
        </p>
      </div>
    </div>
  );
}
