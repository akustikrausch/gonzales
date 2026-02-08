import { useTranslation } from "react-i18next";
import type { IspScore } from "../../api/types";
import { GlassCard } from "../ui/GlassCard";

interface ConnectionHealthProps {
  score: IspScore | null | undefined;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "var(--g-green)";
  if (score >= 60) return "var(--g-blue)";
  if (score >= 40) return "var(--g-orange)";
  return "var(--g-red)";
}

function getScoreLabel(grade: string, t: (key: string) => string): string {
  switch (grade) {
    case "A+":
    case "A":
      return t("connectionHealth.excellent");
    case "B":
      return t("connectionHealth.good");
    case "C":
      return t("connectionHealth.fair");
    case "D":
      return t("connectionHealth.poor");
    default:
      return t("connectionHealth.bad");
  }
}

function getSummary(score: number, t: (key: string) => string): string {
  if (score >= 85) return t("connectionHealth.excellent");
  if (score >= 70) return t("connectionHealth.good");
  if (score >= 50) return t("connectionHealth.fair");
  if (score >= 30) return t("connectionHealth.poor");
  return t("connectionHealth.bad");
}

function BreakdownBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px]" style={{ color: "var(--g-text-secondary)" }}>
          {label}
        </span>
        <span className="text-[10px] font-medium tabular-nums" style={{ color: "var(--g-text)" }}>
          {value.toFixed(0)}
        </span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: "var(--g-border)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(value, 100)}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function ConnectionHealth({ score }: ConnectionHealthProps) {
  const { t } = useTranslation();
  if (!score) return null;

  const color = getScoreColor(score.composite);
  const label = getScoreLabel(score.grade, t);
  const summary = getSummary(score.composite, t);

  // SVG gauge parameters
  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score.composite / 100) * circumference;

  return (
    <GlassCard>
      <div className="flex items-center gap-6">
        {/* Circular gauge */}
        <div className="shrink-0 relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--g-border)"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold" style={{ color }}>{score.grade}</span>
            <span className="text-[9px]" style={{ color: "var(--g-text-tertiary)" }}>
              {score.composite.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Info + breakdown */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold" style={{ color: "var(--g-text)" }}>
              {t("connectionHealth.title")}
            </h3>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ color, background: `${color}15` }}
            >
              {label}
            </span>
          </div>
          <p className="text-xs mb-3" style={{ color: "var(--g-text-secondary)" }}>
            {summary}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <BreakdownBar label={t("connectionHealth.speed")} value={score.breakdown.speed_score} color="var(--g-blue)" />
            <BreakdownBar label={t("connectionHealth.reliability")} value={score.breakdown.reliability_score} color="var(--g-green)" />
            <BreakdownBar label={t("connectionHealth.latency")} value={score.breakdown.latency_score} color="var(--g-orange)" />
            <BreakdownBar label={t("connectionHealth.consistency")} value={score.breakdown.consistency_score} color="var(--g-teal)" />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
