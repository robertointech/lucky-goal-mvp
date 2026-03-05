"use client";

import { useState } from "react";

interface PenaltyKickProps {
  wasCorrect: boolean;
  onResult: (scored: boolean) => void;
}

type Direction = "left" | "center" | "right";

export default function PenaltyKick({ wasCorrect, onResult }: PenaltyKickProps) {
  const [selectedDirection, setSelectedDirection] = useState<Direction | null>(null);
  const [isKicking, setIsKicking] = useState(false);
  const [result, setResult] = useState<"goal" | "saved" | null>(null);
  const [goalkeeperDirection, setGoalkeeperDirection] = useState<Direction | null>(null);

  // Goal probability based on correct answer
  const goalProbability = wasCorrect ? 0.7 : 0.35;

  const handleDirectionSelect = (direction: Direction) => {
    if (isKicking) return;
    setSelectedDirection(direction);
  };

  const handleKick = () => {
    if (!selectedDirection || isKicking) return;

    setIsKicking(true);

    // Simulate goalkeeper diving
    const directions: Direction[] = ["left", "center", "right"];
    const randomGkDirection = directions[Math.floor(Math.random() * directions.length)];
    setGoalkeeperDirection(randomGkDirection);

    // Calculate if goal scored
    // If goalkeeper dives same direction AND probability check fails = saved
    // Otherwise = goal
    const sameDirection = selectedDirection === randomGkDirection;
    const probabilityCheck = Math.random() < goalProbability;

    // If different direction = goal
    // If same direction = depends on probability
    const scored = !sameDirection || probabilityCheck;

    setTimeout(() => {
      setResult(scored ? "goal" : "saved");

      // Wait and proceed
      setTimeout(() => {
        onResult(scored);
      }, 2000);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col px-4 py-6">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-white">¡Patea el Penal!</h2>
        <p className="text-gray-400 text-sm mt-1">
          {wasCorrect ? (
            <span className="text-lucky-green">✅ Respuesta correcta: 70% probabilidad</span>
          ) : (
            <span className="text-yellow-500">⚠️ Respuesta incorrecta: 35% probabilidad</span>
          )}
        </p>
      </div>

      {/* Goal visualization */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Goal frame */}
        <div className="relative w-full max-w-sm">
          {/* Goal posts */}
          <div className="border-4 border-white rounded-t-lg bg-gray-900/50 p-4">
            {/* Net pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10px, #fff 10px, #fff 11px), repeating-linear-gradient(90deg, transparent, transparent 10px, #fff 10px, #fff 11px)',
              }} />
            </div>

            {/* Goal zones */}
            <div className="flex gap-2 relative z-10">
              {(["left", "center", "right"] as Direction[]).map((direction) => (
                <button
                  key={direction}
                  onClick={() => handleDirectionSelect(direction)}
                  disabled={isKicking}
                  className={`goal-zone ${
                    selectedDirection === direction ? "selected" : ""
                  } ${isKicking ? "cursor-not-allowed" : ""}`}
                >
                  {/* Show goalkeeper if kicking */}
                  {isKicking && goalkeeperDirection === direction && (
                    <span className="text-4xl">🧤</span>
                  )}

                  {/* Show ball if this is where player kicked */}
                  {isKicking && selectedDirection === direction && (
                    <span className="text-4xl">⚽</span>
                  )}

                  {/* Direction label when not kicking */}
                  {!isKicking && (
                    <span className="text-gray-500 text-sm uppercase">
                      {direction === "left" ? "Izq" : direction === "center" ? "Centro" : "Der"}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Grass line */}
          <div className="h-4 bg-green-800 rounded-b-lg" />
        </div>

        {/* Ball position indicator */}
        {!isKicking && (
          <div className="mt-8 text-6xl animate-bounce">⚽</div>
        )}

        {/* Result message */}
        {result && (
          <div className={`mt-8 text-center ${
            result === "goal" ? "text-lucky-green" : "text-red-500"
          }`}>
            <div className="text-6xl mb-4">
              {result === "goal" ? "🎉" : "😔"}
            </div>
            <div className="text-3xl font-bold">
              {result === "goal" ? "¡¡¡GOOOOL!!!" : "¡Atajada!"}
            </div>
          </div>
        )}
      </div>

      {/* Kick button */}
      {!isKicking && (
        <button
          onClick={handleKick}
          disabled={!selectedDirection}
          className={`btn-primary text-xl py-4 w-full ${
            !selectedDirection ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {selectedDirection ? "⚽ ¡PATEAR!" : "Selecciona dirección"}
        </button>
      )}
    </div>
  );
}
