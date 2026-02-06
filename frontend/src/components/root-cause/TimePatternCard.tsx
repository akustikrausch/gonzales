import { Clock, TrendingDown, TrendingUp } from "lucide-react";
import type { TimePattern } from "../../api/types";

interface TimePatternCardProps {
  pattern: TimePattern | null;
}

export function TimePatternCard({ pattern }: TimePatternCardProps) {
  if (!pattern) {
    return (
      <div
        className="p-4 rounded-lg text-center"
        style={{ background: "var(--g-card-bg)" }}
      >
        <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--g-text-secondary)" }} />
        <p className="text-sm" style={{ color: "var(--g-text-secondary)" }}>
          Not enough data to detect time-based patterns.
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--g-text-secondary)" }}>
          More measurements during different times of day are needed.
        </p>
      </div>
    );
  }

  const isDegradation = pattern.degradation_pct > 0;
  const Icon = isDegradation ? TrendingDown : TrendingUp;
  const color = isDegradation ? "var(--g-orange)" : "var(--g-green)";

  return (
    <div
      className="p-4 rounded-lg"
      style={{ background: isDegradation ? "var(--g-orange-tint)" : "var(--g-green-tint)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5" style={{ color }} />
        <h4 className="text-sm font-medium" style={{ color: "var(--g-text)" }}>
          {isDegradation ? "Peak Hour Degradation" : "Peak Hour Improvement"}
        </h4>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
            Peak Hours (18:00-23:00)
          </p>
          <p className="text-lg font-semibold" style={{ color: isDegradation ? "var(--g-orange)" : "var(--g-text)" }}>
            {pattern.peak_avg_download_mbps.toFixed(1)} <span className="text-xs font-normal">Mbps</span>
          </p>
        </div>
        <div>
          <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
            Off-Peak (02:00-08:00)
          </p>
          <p className="text-lg font-semibold" style={{ color: !isDegradation ? "var(--g-green)" : "var(--g-text)" }}>
            {pattern.offpeak_avg_download_mbps.toFixed(1)} <span className="text-xs font-normal">Mbps</span>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: "var(--g-text-secondary)" }}>
            Difference:
          </span>
          <span className="text-sm font-semibold" style={{ color }}>
            {isDegradation ? "-" : "+"}{Math.abs(pattern.degradation_pct).toFixed(1)}%
          </span>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{ background: "var(--g-card-bg)", color: "var(--g-text-secondary)" }}
        >
          Confidence: {Math.round(pattern.confidence * 100)}%
        </span>
      </div>
    </div>
  );
}
