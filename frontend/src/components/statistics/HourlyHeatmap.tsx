import { useTranslation } from "react-i18next";
import type { HourlyAverage } from "../../api/types";
import { GlassCard } from "../ui/GlassCard";

interface HourlyHeatmapProps {
  data: HourlyAverage[];
}

export function HourlyHeatmap({ data }: HourlyHeatmapProps) {
  const { t } = useTranslation();
  const maxSpeed = Math.max(...data.map((d) => d.avg_download_mbps), 1);

  const getColor = (value: number) => {
    const intensity = value / maxSpeed;
    if (intensity === 0) return "var(--g-border)";
    const alpha = 0.15 + intensity * 0.85;
    return `rgba(0, 122, 255, ${alpha})`;
  };

  return (
    <GlassCard>
      <h4 className="text-sm font-semibold mb-4" style={{ color: "var(--g-text)" }}>
        {t("statistics.hourlyHeatmap")}
      </h4>
      <div className="grid grid-cols-8 sm:grid-cols-12 gap-1">
        {data.map((h) => (
          <div
            key={h.hour}
            className="flex flex-col items-center gap-1"
            title={`${h.hour}:00 - Avg: ${h.avg_download_mbps.toFixed(1)} Mbps (${h.count} tests)`}
          >
            <div
              className="w-full aspect-square rounded"
              style={{
                background: getColor(h.avg_download_mbps),
                minWidth: "20px",
              }}
            />
            <span className="text-[9px] sm:text-[10px] tabular-nums" style={{ color: "var(--g-text-tertiary)" }}>
              {h.hour}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-[10px]" style={{ color: "var(--g-text-tertiary)" }}>
          0 {t("common.mbps")}
        </span>
        <div className="flex gap-0.5">
          {[0.2, 0.4, 0.6, 0.8, 1.0].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-sm"
              style={{ background: `rgba(0, 122, 255, ${i})` }}
            />
          ))}
        </div>
        <span className="text-[10px]" style={{ color: "var(--g-text-tertiary)" }}>
          {maxSpeed.toFixed(0)} {t("common.mbps")}
        </span>
      </div>
    </GlassCard>
  );
}
