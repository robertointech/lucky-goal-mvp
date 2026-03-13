"use client";

import { useState, useCallback, useRef, useEffect } from "react";

const KICK_ANIMATIONS = [
  { transform: "translateY(-80px) rotate(360deg)", duration: 500 },
  { transform: "translateY(-120px) rotate(-180deg) scale(1.2)", duration: 600 },
  { transform: "translateY(-60px) translateX(20px) rotate(720deg)", duration: 450 },
  { transform: "translateY(-100px) translateX(-15px) rotate(-360deg)", duration: 550 },
  { transform: "translateY(-90px) scale(0.8) rotate(540deg)", duration: 500 },
  { transform: "translateY(-110px) rotate(180deg) scale(1.1)", duration: 650 },
];

const FACES = ["😝", "😜", "🤪", "😵‍💫", "🥴", "😤"];

export default function JuggleBall() {
  const [juggles, setJuggles] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [currentAnim, setCurrentAnim] = useState(0);
  const [legKick, setLegKick] = useState(false);
  const [faceIndex, setFaceIndex] = useState(-1);
  const [headBounce, setHeadBounce] = useState(false);
  const faceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trigger headBounce when ball lands (animating goes false)
  useEffect(() => {
    if (!animating && juggles > 0) {
      setHeadBounce(true);
      const t = setTimeout(() => setHeadBounce(false), 300);
      return () => clearTimeout(t);
    }
  }, [animating, juggles]);

  const handleTap = useCallback(() => {
    if (animating) return;
    const animIdx = juggles % KICK_ANIMATIONS.length;
    setCurrentAnim(animIdx);
    setAnimating(true);
    setLegKick(true);
    setJuggles((j) => {
      const next = j + 1;
      setFaceIndex(next % FACES.length);
      return next;
    });

    if (faceTimeout.current) clearTimeout(faceTimeout.current);
    faceTimeout.current = setTimeout(() => setFaceIndex(-1), 1000);

    setTimeout(() => setLegKick(false), 200);
    setTimeout(
      () => setAnimating(false),
      KICK_ANIMATIONS[animIdx].duration
    );
  }, [animating, juggles]);

  const anim = KICK_ANIMATIONS[currentAnim];
  const face = faceIndex >= 0 ? FACES[faceIndex] : "🙂";

  return (
    <div
      className="flex flex-col items-center justify-center select-none cursor-pointer"
      onClick={handleTap}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === " " && handleTap()}
    >
      {/* Juggle counter */}
      {juggles > 0 && (
        <div
          className="text-[#00FF88] font-black text-lg mb-2 tabular-nums transition-all"
          style={{
            textShadow: "0 0 10px rgba(0,255,136,0.4)",
            animation: animating ? "popCount 0.3s ease-out" : "none",
          }}
        >
          {juggles} juggle{juggles !== 1 ? "s" : ""}!
        </div>
      )}

      {/* Ball */}
      <div
        className="text-5xl mb-1"
        style={{
          transition: animating
            ? `transform ${anim.duration}ms cubic-bezier(0.22, 1, 0.36, 1)`
            : "transform 0.3s ease-in",
          transform: animating ? anim.transform : "translateY(0) rotate(0deg)",
        }}
      >
        ⚽
      </div>

      {/* Player */}
      <div className="relative" style={{ fontSize: "4rem", lineHeight: 1 }}>
        {/* Face with impact bounce */}
        <span
          className="block text-center"
          style={{
            fontSize: "2rem",
            lineHeight: 1,
            transform: headBounce ? "scale(1.3)" : "scale(1)",
            transition: headBounce
              ? "transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)"
              : "transform 0.15s ease-out",
          }}
        >
          {face}
        </span>

        {/* Kicking leg effect */}
        <span
          className="inline-block transition-transform"
          style={{
            transform: legKick ? "scaleX(-1) rotate(-15deg)" : "none",
            transitionDuration: "150ms",
          }}
        >
          🧑‍🦱
        </span>
      </div>

      {/* Tap hint */}
      <p className="text-gray-600 text-xs mt-3 animate-pulse">
        Tap to juggle!
      </p>

      <style jsx>{`
        @keyframes popCount {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.4);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
