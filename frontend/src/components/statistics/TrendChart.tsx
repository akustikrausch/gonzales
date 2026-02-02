import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendAnalysis } from "../../api/types";
import { GlassCard } from "../ui/GlassCard";
import { formatShortDate } from "../../utils/format";

interface TrendChartProps {
  trend: TrendAnalysis;
}

export function TrendChart({ trend }: TrendChartProps) {
  if (trend.points.length === 0) return null;

  const data = trend.points.map((p) => ({
    time: formatShortDate(p.timestamp),
    download: Number(p.download_mbps.toFixed(1)),
    upload: Number(p.upload_mbps.toFixed(1)),
  }));

  const slopeLabel = (slope: number, label: string) => {
    const dir = slope > 0 ? "+" : "";
    return `${label}: ${dir}${slope.toFixed(2)} Mbps/day`;
  };

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold" style={{ color: "var(--g-text)" }}>
          Speed Trend
        </h4>
        <div className="flex gap-4">
          <span className="text-xs" style={{ color: "var(--g-blue)" }}>
            {slopeLabel(trend.download_slope, "DL")}
          </span>
          <span className="text-xs" style={{ color: "var(--g-green)" }}>
            {slopeLabel(trend.upload_slope, "UL")}
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="dlGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--g-blue)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--g-blue)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="ulGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--g-green)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--g-green)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--g-border)" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="var(--g-text-tertiary)" />
          <YAxis tick={{ fontSize: 11 }} stroke="var(--g-text-tertiary)" unit=" Mbps" />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="download"
            stroke="var(--g-blue)"
            fill="url(#dlGrad)"
            strokeWidth={2}
            name="Download"
          />
          <Area
            type="monotone"
            dataKey="upload"
            stroke="var(--g-green)"
            fill="url(#ulGrad)"
            strokeWidth={2}
            name="Upload"
          />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
