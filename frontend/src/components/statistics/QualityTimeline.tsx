import type { HourlyAverage } from "../../api/types";
import { GlassCard } from "../ui/GlassCard";

interface QualityTimelineProps {
  data: HourlyAverage[];
  downloadThreshold: number;
}

function getQualityColor(avgDownload: number, threshold: number, count: number): string {
  if (count === 0) return "var(--g-border)";
  const ratio = avgDownload / threshold;
  if (ratio >= 0.9) return "var(--g-green)";
  if (ratio >= 0.7) return "var(--g-teal)";
  if (ratio >= 0.5) return "var(--g-orange)";
  return "var(--g-red)";
}

function getQualityLabel(avgDownload: number, threshold: number, count: number): string {
  if (count === 0) return "No data";
  const ratio = avgDownload / threshold;
  if (ratio >= 0.9) return "Excellent";
  if (ratio >= 0.7) return "Good";
  if (ratio >= 0.5) return "Fair";
  return "Poor";
}

export function QualityTimeline({ data, downloadThreshold }: QualityTimelineProps) {
  return (
    <GlassCard padding="md" className="g-animate-in">
      <h3
        className="text-sm font-semibold mb-4"
        style={{ color: "var(--g-text)" }}
      >
        Network Quality by Hour
      </h3>

      <div className="flex gap-0.5">
        {data.map((hour) => {
          const color = getQualityColor(hour.avg_download_mbps, downloadThreshold, hour.count);
          const label = getQualityLabel(hour.avg_download_mbps, downloadThreshold, hour.count);
          return (
            <div key={hour.hour} className="flex-1 group relative">
              <div
                className="h-8 rounded-sm transition-all duration-300 hover:scale-y-125 hover:brightness-110 cursor-default"
                style={{
                  background: color,
                  opacity: hour.count === 0 ? 0.2 : 0.7 + Math.min(0.3, hour.count * 0.05),
                }}
              />
              <span
                className="text-[8px] block text-center mt-1 tabular-nums"
                style={{ color: "var(--g-text-tertiary)" }}
              >
                {hour.hour.toString().padStart(2, "0")}
              </span>

              {/* Tooltip */}
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 rounded-lg
                           opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap"
                style={{
                  background: "var(--g-glass-bg)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid var(--g-border)",
                  boxShadow: "var(--g-shadow-elevated)",
                }}
              >
                <div className="text-[10px] font-medium" style={{ color: "var(--g-text)" }}>
                  {hour.hour.toString().padStart(2, "0")}:00 - {label}
                </div>
                {hour.count > 0 && (
                  <div className="text-[9px] mt-0.5" style={{ color: "var(--g-text-secondary)" }}>
                    {hour.avg_download_mbps.toFixed(0)} Mbps / {hour.avg_ping_ms.toFixed(0)} ms / {hour.count} tests
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-2" style={{ borderTop: "1px solid var(--g-border)" }}>
        {[
          { label: "Excellent", color: "var(--g-green)" },
          { label: "Good", color: "var(--g-teal)" },
          { label: "Fair", color: "var(--g-orange)" },
          { label: "Poor", color: "var(--g-red)" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: item.color, opacity: 0.8 }} />
            <span className="text-[10px]" style={{ color: "var(--g-text-tertiary)" }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
