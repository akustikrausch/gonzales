import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendAnalysis, PredictiveTrend, EnhancedPredictiveTrend } from "../../api/types";
import { GlassCard } from "../ui/GlassCard";
import { GlassBadge } from "../ui/GlassBadge";
import { formatShortDate } from "../../utils/format";

interface TrendChartProps {
  trend: TrendAnalysis;
  predictions?: PredictiveTrend | null;
  enhancedPredictions?: EnhancedPredictiveTrend | null;
  downloadThreshold?: number;
  uploadThreshold?: number;
}

export function TrendChart({ trend, predictions, enhancedPredictions, downloadThreshold, uploadThreshold }: TrendChartProps) {
  if (trend.points.length === 0) return null;

  const data = trend.points.map((p) => ({
    time: formatShortDate(p.timestamp),
    download: Number(p.download_mbps.toFixed(1)),
    upload: Number(p.upload_mbps.toFixed(1)),
  }));

  // Append prediction points with separate keys
  const usedPredictions = enhancedPredictions || predictions;
  if (usedPredictions && usedPredictions.points.length > 0) {
    // Connect prediction to last actual point
    const lastActual = data[data.length - 1];
    data.push({
      ...lastActual,
      pred_download: lastActual.download,
      pred_upload: lastActual.upload,
      ...(enhancedPredictions ? {
        dl_upper: lastActual.download,
        dl_lower: lastActual.download,
        ul_upper: lastActual.upload,
        ul_lower: lastActual.upload,
      } : {}),
    } as typeof data[number]);

    for (const p of usedPredictions.points) {
      const point: Record<string, unknown> = {
        time: formatShortDate(p.timestamp),
        pred_download: Number(p.download_mbps.toFixed(1)),
        pred_upload: Number(p.upload_mbps.toFixed(1)),
      };

      // Add confidence intervals if available
      if (enhancedPredictions && "download_interval" in p) {
        const ep = p as (typeof enhancedPredictions.points)[number];
        point.dl_upper = Number(ep.download_interval.upper.toFixed(1));
        point.dl_lower = Number(ep.download_interval.lower.toFixed(1));
        point.ul_upper = Number(ep.upload_interval.upper.toFixed(1));
        point.ul_lower = Number(ep.upload_interval.lower.toFixed(1));
      }

      data.push(point as typeof data[number]);
    }
  }

  const slopeLabel = (slope: number, label: string) => {
    const dir = slope > 0 ? "+" : "";
    return `${label}: ${dir}${slope.toFixed(2)} Mbps/day`;
  };

  const confidenceLevel = enhancedPredictions?.confidence_level || predictions?.confidence;

  return (
    <GlassCard>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold" style={{ color: "var(--g-text)" }}>
            Speed Trend
          </h4>
          {confidenceLevel && (
            <GlassBadge color="var(--g-teal)">
              7-day forecast ({confidenceLevel})
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
          {downloadThreshold && (
            <ReferenceLine
              y={downloadThreshold}
              stroke="var(--g-blue)"
              strokeDasharray="5 5"
              strokeOpacity={0.6}
              label={{
                value: `Min ${downloadThreshold} Mbps`,
                position: "right",
                fill: "var(--g-blue)",
                fontSize: 10,
              }}
            />
          )}
          {uploadThreshold && (
            <ReferenceLine
              y={uploadThreshold}
              stroke="var(--g-green)"
              strokeDasharray="5 5"
              strokeOpacity={0.6}
              label={{
                value: `Min ${uploadThreshold} Mbps`,
                position: "right",
                fill: "var(--g-green)",
                fontSize: 10,
              }}
            />
          )}
          {/* Confidence bands (shaded areas behind prediction lines) */}
          {enhancedPredictions && (
            <>
              <Area
                type="monotone"
                dataKey="dl_upper"
                stroke="none"
                fill="var(--g-blue)"
                fillOpacity={0.08}
                connectNulls
                activeDot={false}
                name="DL Upper"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="dl_lower"
                stroke="none"
                fill="var(--g-bg, #fff)"
                fillOpacity={1}
                connectNulls
                activeDot={false}
                name="DL Lower"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="ul_upper"
                stroke="none"
                fill="var(--g-green)"
                fillOpacity={0.08}
                connectNulls
                activeDot={false}
                name="UL Upper"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="ul_lower"
                stroke="none"
                fill="var(--g-bg, #fff)"
                fillOpacity={1}
                connectNulls
                activeDot={false}
                name="UL Lower"
                isAnimationActive={false}
              />
            </>
          )}
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
      {/* Seasonal factors */}
      {enhancedPredictions?.seasonal_factors && enhancedPredictions.seasonal_factors.length > 0 && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: "var(--g-border)" }}>
          <span className="text-[10px] shrink-0" style={{ color: "var(--g-text-tertiary)" }}>
            Day patterns:
          </span>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {enhancedPredictions.seasonal_factors.map((sf) => {
              const factor = sf.download_factor;
              const color = factor >= 1.02 ? "var(--g-green)" : factor <= 0.98 ? "var(--g-red)" : "var(--g-text-tertiary)";
              return (
                <span
                  key={sf.day}
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
                  style={{ color, background: `${color}10` }}
                  title={`${sf.day_name}: DL ${(factor * 100 - 100).toFixed(1)}%`}
                >
                  {sf.day_name.slice(0, 3)}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
