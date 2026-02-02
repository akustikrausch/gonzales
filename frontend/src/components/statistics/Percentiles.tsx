import type { SpeedStatistics } from "../../api/types";
import { Card } from "../common/Card";

interface PercentilesProps {
  label: string;
  stat: SpeedStatistics;
  unit: string;
  color: string;
}

export function Percentiles({ label, stat, unit, color }: PercentilesProps) {
  const percentiles = stat.percentiles;
  const bars = [
    { label: "P5", value: percentiles.p5 },
    { label: "P25", value: percentiles.p25 },
    { label: "P50", value: percentiles.p50 },
    { label: "P75", value: percentiles.p75 },
    { label: "P95", value: percentiles.p95 },
  ];
  const max = Math.max(...bars.map((b) => b.value), 1);

  return (
    <Card>
      <h4 className="text-sm font-semibold mb-4" style={{ color }}>
        {label} Percentiles
      </h4>
      <div className="space-y-2">
        {bars.map((bar) => (
          <div key={bar.label} className="flex items-center gap-3">
            <span className="w-8 text-xs text-[#86868B] font-medium text-right">
              {bar.label}
            </span>
            <div className="flex-1 bg-[#F5F5F7] rounded-full h-5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(bar.value / max) * 100}%`,
                  backgroundColor: color,
                }}
              />
            </div>
            <span className="w-20 text-xs font-medium tabular-nums text-right">
              {bar.value.toFixed(1)} {unit}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
