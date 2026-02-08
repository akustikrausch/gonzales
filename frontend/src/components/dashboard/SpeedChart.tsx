import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Measurement } from "../../api/types";
import { formatShortDate } from "../../utils/format";
import { GlassCard } from "../ui/GlassCard";

interface SpeedChartProps {
  measurements: Measurement[];
  downloadThreshold?: number;
  uploadThreshold?: number;
}

export const SpeedChart = memo(function SpeedChart({ measurements, downloadThreshold, uploadThreshold }: SpeedChartProps) {
  const { t } = useTranslation();
  const data = useMemo(
    () =>
      [...measurements].reverse().map((m) => ({
        time: formatShortDate(m.timestamp),
        download: Number(m.download_mbps.toFixed(1)),
        upload: Number(m.upload_mbps.toFixed(1)),
      })),
    [measurements],
  );

  return (
    <GlassCard>
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--g-text)" }}>
        {t("dashboard.download")} / {t("dashboard.upload")}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--g-border)" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="var(--g-text-tertiary)" />
          <YAxis tick={{ fontSize: 11 }} stroke="var(--g-text-tertiary)" unit={` ${t("common.mbps")}`} />
          <Tooltip
            contentStyle={{
              background: "var(--g-card-bg)",
              border: "1px solid var(--g-card-border)",
              borderRadius: "var(--g-radius-sm)",
              backdropFilter: "blur(20px)",
              fontSize: "var(--g-text-xs)",
            }}
          />
          <Legend />
          {downloadThreshold && (
            <ReferenceLine
              y={downloadThreshold}
              stroke="var(--g-blue)"
              strokeDasharray="5 5"
              strokeOpacity={0.7}
              label={{
                value: t("dashboard.minThreshold", { value: downloadThreshold }),
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
              strokeOpacity={0.7}
              label={{
                value: t("dashboard.minThreshold", { value: uploadThreshold }),
                position: "right",
                fill: "var(--g-green)",
                fontSize: 10,
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="download"
            stroke="var(--g-blue)"
            strokeWidth={2}
            dot={false}
            name={t("speedtest.download")}
            animationDuration={800}
            animationBegin={0}
            animationEasing="ease-out"
          />
          <Line
            type="monotone"
            dataKey="upload"
            stroke="var(--g-green)"
            strokeWidth={2}
            dot={false}
            name={t("speedtest.upload")}
            animationDuration={800}
            animationBegin={200}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </GlassCard>
  );
});
