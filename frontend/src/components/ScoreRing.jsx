import React, { useEffect, useState } from "react";

export default function ScoreRing({ score = 0, size = 160, strokeWidth = 12, label = "Match Score", sublabel = "" }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.min(100, Math.max(0, Math.round(score)));
    if (end === 0) {
      setAnimatedScore(0);
      return;
    }
    const duration = 1000; // 1s animation
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = end / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setAnimatedScore(end);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (animatedScore / 100) * circumference;
  const strokeDashoffset = circumference - progress;

  let color = "#10b981"; // green >= 75
  let bgGlow = "rgba(16, 185, 129, 0.15)";
  if (score < 50) {
    color = "#ef4444"; // red
    bgGlow = "rgba(239, 68, 68, 0.15)";
  } else if (score < 75) {
    color = "#f59e0b"; // amber
    bgGlow = "rgba(245, 158, 11, 0.15)";
  }

  return (
    <div className="score-ring-wrapper" style={{ width: size, height: size, position: "relative" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="score-ring-svg">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--ring-track, rgba(120, 120, 120, 0.15))"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.1s ease-out" }}
        />
      </svg>
      <div className="score-ring-center" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span className="score-number" style={{ fontSize: size * 0.28, fontWeight: 700, color, lineHeight: 1 }}>
          {animatedScore}
        </span>
        {label && <span className="score-label" style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>}
        {sublabel && <span className="score-sublabel" style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{sublabel}</span>}
      </div>
    </div>
  );
}
