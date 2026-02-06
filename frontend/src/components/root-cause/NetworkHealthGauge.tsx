import { Activity } from "lucide-react";

interface NetworkHealthGaugeProps {
  score: number;
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "var(--g-green)";
  if (score >= 60) return "var(--g-blue)";
  if (score >= 40) return "var(--g-orange)";
  return "var(--g-red)";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 40) return "Poor";
  return "Critical";
}

export function NetworkHealthGauge({ score, className = "" }: NetworkHealthGaugeProps) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative w-32 h-32">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="var(--g-card-bg)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>
            {Math.round(score)}
          </span>
          <span className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
            / 100
          </span>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <Activity className="w-4 h-4" style={{ color }} />
        <span className="text-sm font-medium" style={{ color }}>
          {label}
        </span>
      </div>
      <p className="text-xs mt-1" style={{ color: "var(--g-text-secondary)" }}>
        Network Health Score
      </p>
    </div>
  );
}
