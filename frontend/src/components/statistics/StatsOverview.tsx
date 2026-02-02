import type { Statistics } from "../../api/types";
import { Card } from "../common/Card";

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
    <Card>
      <h4 className="text-sm font-semibold mb-3" style={{ color }}>
        {label}
      </h4>
      <div className="grid grid-cols-5 gap-3 text-center">
        {(["min", "max", "avg", "median", "stddev"] as const).map((key) => (
          <div key={key}>
            <p className="text-xs text-[#86868B] uppercase">{key}</p>
            <p className="text-lg font-bold tabular-nums">{stat[key].toFixed(1)}</p>
            <p className="text-xs text-[#86868B]">{unit}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#86868B]">Total Tests</p>
            <p className="text-3xl font-bold">{stats.total_tests}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[#86868B]">Threshold Violations</p>
            <div className="flex gap-4 mt-1">
              <span className="text-sm">
                <span className="text-[#FF3B30] font-bold">{stats.download_violations}</span>{" "}
                DL
              </span>
              <span className="text-sm">
                <span className="text-[#FF3B30] font-bold">{stats.upload_violations}</span>{" "}
                UL
              </span>
            </div>
          </div>
        </div>
      </Card>
      <StatRow label="Download" stat={stats.download} unit="Mbps" color="#007AFF" />
      <StatRow label="Upload" stat={stats.upload} unit="Mbps" color="#34C759" />
      <StatRow label="Ping" stat={stats.ping} unit="ms" color="#FF9500" />
    </div>
  );
}
