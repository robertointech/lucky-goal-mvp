"use client";

import { useState, useEffect, useCallback } from "react";

export function useCountdown(initialTime: number, autoStart = false) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
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
