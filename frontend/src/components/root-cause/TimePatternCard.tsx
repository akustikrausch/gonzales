import { Clock, TrendingDown, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TimePattern } from "../../api/types";

interface TimePatternCardProps {
  pattern: TimePattern | null;
}

export function TimePatternCard({ pattern }: TimePatternCardProps) {
  const { t } = useTranslation();

  if (!pattern) {
    return (
      <div
        className="p-4 rounded-lg text-center"
        style={{ background: "var(--g-card-bg)" }}
      >
        <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--g-text-secondary)" }} />
        <p className="text-sm" style={{ color: "var(--g-text-secondary)" }}>
          {t("rootCause.notEnoughTimeData")}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--g-text-secondary)" }}>
          {t("rootCause.moreTimeMeasurementsNeeded")}
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
          {t(isDegradation ? "rootCause.peakHourDegradation" : "rootCause.peakHourImprovement")}
        </h4>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
            {t("rootCause.peakHours")}
          </p>
          <p className="text-lg font-semibold" style={{ color: isDegradation ? "var(--g-orange)" : "var(--g-text)" }}>
            {pattern.peak_avg_download_mbps.toFixed(1)} <span className="text-xs font-normal">{t("common.mbps")}</span>
          </p>
        </div>
        <div>
          <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
            {t("rootCause.offPeak")}
          </p>
          <p className="text-lg font-semibold" style={{ color: !isDegradation ? "var(--g-green)" : "var(--g-text)" }}>
            {pattern.offpeak_avg_download_mbps.toFixed(1)} <span className="text-xs font-normal">{t("common.mbps")}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: "var(--g-text-secondary)" }}>
            {t("rootCause.difference")}:
          </span>
          <span className="text-sm font-semibold" style={{ color }}>
            {isDegradation ? "-" : "+"}{Math.abs(pattern.degradation_pct).toFixed(1)}%
          </span>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{ background: "var(--g-card-bg)", color: "var(--g-text-secondary)" }}
        >
          {t("rootCause.confidence")}: {Math.round(pattern.confidence * 100)}%
        </span>
      </div>
    </div>
  );
}
