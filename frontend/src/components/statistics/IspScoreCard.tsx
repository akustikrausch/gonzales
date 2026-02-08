import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { IspScore } from "../../api/types";
import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";
import { GlassCard } from "../ui/GlassCard";
import { ProgressRing } from "../speedtest/ProgressRing";

interface IspScoreCardProps {
  score: IspScore;
}

const gradeColors: Record<string, string> = {
  "A+": "var(--g-green)",
  A: "var(--g-green)",
  B: "var(--g-teal)",
  C: "var(--g-orange)",
  D: "var(--g-red)",
  F: "var(--g-red)",
};

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  const animated = useAnimatedNumber(value, 800);
  return (
    <div className="flex items-center gap-3">
      <span
        className="text-xs w-24 text-right shrink-0"
        style={{ color: "var(--g-text-secondary)" }}
      >
        {label}
      </span>
      <div className="flex-1 h-2 rounded-full" style={{ background: "var(--g-border)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(100, animated)}%`,
            background: color,
            boxShadow: `0 0 8px ${color}40`,
          }}
        />
      </div>
      <span className="text-xs tabular-nums w-10" style={{ color: "var(--g-text-secondary)" }}>
        {animated.toFixed(0)}
      </span>
    </div>
  );
}

export function IspScoreCard({ score }: IspScoreCardProps) {
  const { t } = useTranslation();
  const color = gradeColors[score.grade] || "var(--g-blue)";
  const animated = useAnimatedNumber(score.composite, 1000);

  return (
    <GlassCard padding="lg" depth="elevated" className="g-animate-in">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4" style={{ color }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--g-text)" }}>
          {t("statistics.ispScore")}
        </h3>
      </div>

      <div className="flex items-center gap-6">
        <ProgressRing value={score.composite} max={100} size={120} strokeWidth={6} color={color} glow>
          <div className="text-center">
            <span
              className="text-3xl font-bold tabular-nums"
              style={{ color, textShadow: `0 0 16px ${color}30` }}
            >
              {animated.toFixed(0)}
            </span>
            <span className="text-xs block" style={{ color: "var(--g-text-secondary)" }}>
              / 100
            </span>
          </div>
        </ProgressRing>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-2xl font-bold"
              style={{ color, textShadow: `0 0 12px ${color}30` }}
            >
              {score.grade}
            </span>
            <span className="text-xs" style={{ color: "var(--g-text-tertiary)" }}>
              {t("statistics.ispGrade")}
            </span>
          </div>
          <ScoreBar label={t("connectionHealth.speed")} value={score.breakdown.speed_score} color="var(--g-blue)" />
          <ScoreBar label={t("connectionHealth.latency")} value={score.breakdown.latency_score} color="var(--g-orange)" />
          <ScoreBar label={t("connectionHealth.reliability")} value={score.breakdown.reliability_score} color="var(--g-green)" />
          <ScoreBar label={t("connectionHealth.consistency")} value={score.breakdown.consistency_score} color="var(--g-teal)" />
        </div>
      </div>
    </GlassCard>
  );
}
