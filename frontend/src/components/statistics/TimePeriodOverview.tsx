import { Sun, Sunrise, Cloud, Moon, Star } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import type { TimePeriodAnalysis } from "../../api/types";

interface TimePeriodOverviewProps {
  data: TimePeriodAnalysis;
}

const periodIcons: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  morning: Sunrise,
  midday: Sun,
  afternoon: Cloud,
  evening: Moon,
  night: Star,
};

const periodColors: Record<string, string> = {
  morning: "var(--g-orange)",
  midday: "var(--g-yellow)",
  afternoon: "var(--g-blue)",
  evening: "var(--g-purple)",
  night: "var(--g-text-tertiary)",
};

function getComplianceColor(pct: number): string {
  if (pct >= 95) return "var(--g-green)";
  if (pct >= 80) return "var(--g-yellow)";
  return "var(--g-red)";
}

export function TimePeriodOverview({ data }: TimePeriodOverviewProps) {
  return (
    <GlassCard>
      <h3
        className="text-sm font-semibold mb-4"
        style={{ color: "var(--g-text)" }}
      >
        Time of Day Analysis
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {data.periods.map((period) => {
          const Icon = periodIcons[period.period] || Sun;
          const isBest = period.period === data.best_period;
          const isWorst = period.period === data.worst_period && data.best_period !== data.worst_period;
          const hasData = period.test_count > 0;

          return (
            <div
              key={period.period}
              className="relative p-3 rounded-lg transition-all"
              style={{
                background: isBest
                  ? "var(--g-green)12"
                  : isWorst
                  ? "var(--g-red)08"
                  : "var(--g-glass)",
                border: isBest
                  ? "1px solid var(--g-green)"
                  : isWorst
                  ? "1px solid var(--g-red)"
                  : "1px solid var(--g-border)",
              }}
            >
              {isBest && (
                <span
                  className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: "var(--g-green)", color: "white" }}
                >
                  Best
                </span>
              )}
              {isWorst && (
                <span
                  className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: "var(--g-red)", color: "white" }}
                >
                  Worst
                </span>
              )}

              <div className="flex items-center gap-2 mb-2">
                <Icon
                  className="w-4 h-4"
                  style={{ color: periodColors[period.period] }}
                />
                <span
                  className="text-xs font-medium truncate"
                  style={{ color: "var(--g-text)" }}
                >
                  {period.period_label.split(" ")[0]}
                </span>
              </div>

              <div
                className="text-[10px] mb-2"
                style={{ color: "var(--g-text-tertiary)" }}
              >
                {period.hours}
              </div>

              {hasData ? (
                <>
                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "var(--g-text-secondary)" }}>DL</span>
                      <span className="font-medium" style={{ color: "var(--g-blue)" }}>
                        {period.avg_download_mbps.toFixed(0)} Mbps
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "var(--g-text-secondary)" }}>UL</span>
                      <span className="font-medium" style={{ color: "var(--g-green)" }}>
                        {period.avg_upload_mbps.toFixed(0)} Mbps
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "var(--g-text-secondary)" }}>Ping</span>
                      <span className="font-medium" style={{ color: "var(--g-orange)" }}>
                        {period.avg_ping_ms.toFixed(1)} ms
                      </span>
                    </div>
                  </div>

                  <div
                    className="text-center py-1 rounded text-xs font-medium"
                    style={{
                      background: `${getComplianceColor(period.compliance_pct)}15`,
                      color: getComplianceColor(period.compliance_pct),
                    }}
                  >
                    {period.compliance_pct.toFixed(0)}% OK
                  </div>

                  <div
                    className="text-center text-[10px] mt-1"
                    style={{ color: "var(--g-text-tertiary)" }}
                  >
                    {period.test_count} tests
                  </div>
                </>
              ) : (
                <div
                  className="text-center text-xs py-4"
                  style={{ color: "var(--g-text-tertiary)" }}
                >
                  No data
                </div>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
