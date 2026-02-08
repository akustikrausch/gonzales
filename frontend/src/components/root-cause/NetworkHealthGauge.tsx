import { Activity } from "lucide-react";
import { useTranslation } from "react-i18next";

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

function getScoreLabelKey(score: number): string {
  if (score >= 90) return "rootCause.excellent";
  if (score >= 80) return "rootCause.good";
  if (score >= 60) return "rootCause.fair";
  if (score >= 40) return "rootCause.poor";
  return "rootCause.critical";
}

export function NetworkHealthGauge({ score, className = "" }: NetworkHealthGaugeProps) {
  const { t } = useTranslation();
  const color = getScoreColor(score);
  const labelKey = getScoreLabelKey(score);
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
          {t(labelKey)}
        </span>
      </div>
      <p className="text-xs mt-1" style={{ color: "var(--g-text-secondary)" }}>
        {t("rootCause.networkHealthScore")}
      </p>
    </div>
  );
}
