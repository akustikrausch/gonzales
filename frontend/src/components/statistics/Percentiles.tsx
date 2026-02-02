import { useEffect, useState } from "react";
import type { SpeedStatistics } from "../../api/types";
import { GlassCard } from "../ui/GlassCard";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <GlassCard>
      <h4 className="text-sm font-semibold mb-4" style={{ color }}>
        {label} Percentiles
      </h4>
      <div className="space-y-2">
        {bars.map((bar, i) => (
          <div key={bar.label} className="flex items-center gap-3">
            <span className="w-8 text-xs font-medium text-right" style={{ color: "var(--g-text-secondary)" }}>
              {bar.label}
            </span>
            <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: "var(--g-glass-bg)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: mounted ? `${(bar.value / max) * 100}%` : "0%",
                  backgroundColor: color,
                  transition: `width 600ms ${150 + i * 80}ms cubic-bezier(0.16, 1, 0.3, 1)`,
                }}
              />
            </div>
            <span className="w-20 text-xs font-medium tabular-nums text-right" style={{ color: "var(--g-text)" }}>
              {bar.value.toFixed(1)} {unit}
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
