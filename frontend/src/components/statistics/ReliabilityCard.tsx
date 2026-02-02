import type { ReliabilityScore } from "../../api/types";
import { GlassCard } from "../ui/GlassCard";
import { ProgressRing } from "../speedtest/ProgressRing";

interface ReliabilityCardProps {
  reliability: ReliabilityScore;
}

export function ReliabilityCard({ reliability }: ReliabilityCardProps) {
  const score = reliability.composite_score;
  const color = score >= 80 ? "var(--g-green)" : score >= 50 ? "var(--g-orange)" : "var(--g-red)";

  return (
    <GlassCard>
      <h4 className="text-sm font-semibold mb-4" style={{ color: "var(--g-text)" }}>
        Reliability Score
      </h4>
      <div className="flex flex-col items-center gap-3">
        <ProgressRing value={score} size={110} strokeWidth={8} color={color}>
          <span className="text-2xl font-bold tabular-nums" style={{ color }}>
            {score.toFixed(0)}
          </span>
        </ProgressRing>
        <div className="grid grid-cols-3 gap-4 text-center w-full mt-2">
          <div>
            <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>DL CV</p>
            <p className="text-sm font-medium tabular-nums" style={{ color: "var(--g-text)" }}>
              {(reliability.download_cv * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>UL CV</p>
            <p className="text-sm font-medium tabular-nums" style={{ color: "var(--g-text)" }}>
              {(reliability.upload_cv * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>Ping CV</p>
            <p className="text-sm font-medium tabular-nums" style={{ color: "var(--g-text)" }}>
              {(reliability.ping_cv * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
