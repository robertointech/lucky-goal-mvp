"use client";

import { useState, useEffect, useCallback } from "react";

export function useCountdown(initialTime: number, autoStart = false) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev <= 1 ? 0 : prev - 1;
        console.log("[COUNTDOWN] tick:", prev, "→", next);
        if (next === 0) setIsRunning(false);
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const reset = useCallback((time?: number) => {
    setTimeLeft(time ?? initialTime);
    setIsRunning(false);
  }, [initialTime]);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const restart = useCallback((time?: number) => {
    setTimeLeft(time ?? initialTime);
    setIsRunning(true);
  }, [initialTime]);

  return { timeLeft, isRunning, isFinished: timeLeft === 0, start, stop, reset, restart };
}
