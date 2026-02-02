import type { Statistics } from "../../api/types";
import { GlassCard } from "../ui/GlassCard";
import { AnimatedNumber } from "../common/AnimatedNumber";

interface StatsOverviewProps {
  stats: Statistics;
}

function StatRow({
  label,
  stat,
  unit,
  color,
}: {
  label: string;
  stat: { min: number; max: number; avg: number; median: number; stddev: number } | null;
  unit: string;
  color: string;
}) {
  if (!stat) return null;
  return (
    <GlassCard>
      <h4 className="text-sm font-semibold mb-3" style={{ color }}>
        {label}
      </h4>
      <div className="grid grid-cols-5 gap-3 text-center">
        {(["min", "max", "avg", "median", "stddev"] as const).map((key) => (
          <div key={key}>
            <p className="text-xs uppercase" style={{ color: "var(--g-text-secondary)" }}>{key}</p>
            <AnimatedNumber
              value={stat[key]}
              decimals={1}
              className="text-lg font-bold block"
              style={{ color: "var(--g-text)" }}
            />
            <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>{unit}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color: "var(--g-text-secondary)" }}>Total Tests</p>
            <AnimatedNumber
              value={stats.total_tests}
              decimals={0}
              className="text-3xl font-bold block"
              style={{ color: "var(--g-text)" }}
            />
          </div>
          <div className="text-right">
            <p className="text-sm" style={{ color: "var(--g-text-secondary)" }}>Threshold Violations</p>
            <div className="flex gap-4 mt-1">
              <span className="text-sm">
                <AnimatedNumber
                  value={stats.download_violations}
                  decimals={0}
                  className="font-bold"
                  style={{ color: "var(--g-red)" }}
                />{" "}DL
              </span>
              <span className="text-sm">
                <AnimatedNumber
                  value={stats.upload_violations}
                  decimals={0}
                  className="font-bold"
                  style={{ color: "var(--g-red)" }}
                />{" "}UL
              </span>
            </div>
          </div>
        </div>
      </GlassCard>
      <StatRow label="Download" stat={stats.download} unit="Mbps" color="var(--g-blue)" />
      <StatRow label="Upload" stat={stats.upload} unit="Mbps" color="var(--g-green)" />
      <StatRow label="Ping" stat={stats.ping} unit="ms" color="var(--g-orange)" />
    </div>
  );
}
