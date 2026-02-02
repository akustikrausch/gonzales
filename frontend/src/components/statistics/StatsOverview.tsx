import type { Statistics } from "../../api/types";
import { GlassCard } from "../ui/GlassCard";

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
            <p className="text-lg font-bold tabular-nums" style={{ color: "var(--g-text)" }}>
              {stat[key].toFixed(1)}
            </p>
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
            <p className="text-3xl font-bold" style={{ color: "var(--g-text)" }}>{stats.total_tests}</p>
          </div>
          <div className="text-right">
            <p className="text-sm" style={{ color: "var(--g-text-secondary)" }}>Threshold Violations</p>
            <div className="flex gap-4 mt-1">
              <span className="text-sm">
                <span className="font-bold" style={{ color: "var(--g-red)" }}>{stats.download_violations}</span>{" "}DL
              </span>
              <span className="text-sm">
                <span className="font-bold" style={{ color: "var(--g-red)" }}>{stats.upload_violations}</span>{" "}UL
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
