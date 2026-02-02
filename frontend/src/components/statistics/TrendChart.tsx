import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendAnalysis, PredictiveTrend } from "../../api/types";
import { GlassCard } from "../ui/GlassCard";
import { GlassBadge } from "../ui/GlassBadge";
import { formatShortDate } from "../../utils/format";

interface TrendChartProps {
  trend: TrendAnalysis;
  predictions?: PredictiveTrend | null;
}

export function TrendChart({ trend, predictions }: TrendChartProps) {
  if (trend.points.length === 0) return null;

  const data = trend.points.map((p) => ({
    time: formatShortDate(p.timestamp),
    download: Number(p.download_mbps.toFixed(1)),
    upload: Number(p.upload_mbps.toFixed(1)),
  }));

  // Append prediction points with separate keys
  if (predictions && predictions.points.length > 0) {
    // Connect prediction to last actual point
    const lastActual = data[data.length - 1];
    data.push({
      ...lastActual,
      pred_download: lastActual.download,
      pred_upload: lastActual.upload,
    } as typeof data[number] & { pred_download?: number; pred_upload?: number });

    for (const p of predictions.points) {
      data.push({
        time: formatShortDate(p.timestamp),
        pred_download: Number(p.download_mbps.toFixed(1)),
        pred_upload: Number(p.upload_mbps.toFixed(1)),
      } as typeof data[number] & { pred_download?: number; pred_upload?: number });
    }
  }

  const slopeLabel = (slope: number, label: string) => {
    const dir = slope > 0 ? "+" : "";
    return `${label}: ${dir}${slope.toFixed(2)} Mbps/day`;
  };

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold" style={{ color: "var(--g-text)" }}>
            Speed Trend
          </h4>
          {predictions && (
            <GlassBadge color="var(--g-teal)">
              7-day forecast ({predictions.confidence})
            </GlassBadge>
          )}
        </div>
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
          <Tooltip
            contentStyle={{
              background: "var(--g-card-bg)",
              border: "1px solid var(--g-card-border)",
              borderRadius: "var(--g-radius-sm)",
              backdropFilter: "blur(20px)",
              fontSize: "var(--g-text-xs)",
            }}
          />
          <Area
            type="monotone"
            dataKey="download"
            stroke="var(--g-blue)"
            fill="url(#dlGrad)"
            strokeWidth={2}
            name="Download"
            animationDuration={1000}
            animationBegin={0}
            animationEasing="ease-out"
            connectNulls={false}
          />
          <Area
            type="monotone"
            dataKey="upload"
            stroke="var(--g-green)"
            fill="url(#ulGrad)"
            strokeWidth={2}
            name="Upload"
            animationDuration={1000}
            animationBegin={200}
            animationEasing="ease-out"
            connectNulls={false}
          />
          {/* Prediction lines (dashed) */}
          <Line
            type="monotone"
            dataKey="pred_download"
            stroke="var(--g-blue)"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            name="DL Forecast"
            animationDuration={800}
            animationBegin={400}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="pred_upload"
            stroke="var(--g-green)"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            name="UL Forecast"
            animationDuration={800}
            animationBegin={600}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
