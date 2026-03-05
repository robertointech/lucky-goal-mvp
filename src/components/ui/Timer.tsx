"use client";

interface TimerProps {
  timeLeft: number;
  totalTime: number;
}

export default function Timer({ timeLeft, totalTime }: TimerProps) {
  const progress = timeLeft / totalTime;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const color =
    timeLeft > totalTime * 0.5
      ? "#00FF88"
      : timeLeft > totalTime * 0.25
        ? "#FFD700"
        : "#FF4444";

  return (
    <div className="relative w-[72px] h-[72px] flex items-center justify-center">
      <svg width="72" height="72" className="-rotate-90">
        {/* Background circle */}
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="#333"
          strokeWidth="4"
        />
        {/* Progress circle */}
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 0.3s ease" }}
        />
      </svg>
      <span
        className="absolute text-xl font-bold"
        style={{ color }}
      >
        {timeLeft}
      </span>
    </div>
  );
}
