import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useTranslation } from "react-i18next";
import type { DayOfWeekAverage } from "../../api/types";
import { GlassCard } from "../ui/GlassCard";

interface DayOfWeekChartProps {
  data: DayOfWeekAverage[];
}

export function DayOfWeekChart({ data }: DayOfWeekChartProps) {
  const { t } = useTranslation();
  const chartData = data.map((d) => ({
    day: d.day_name.slice(0, 3),
    download: d.avg_download_mbps,
    upload: d.avg_upload_mbps,
  }));

  return (
    <GlassCard>
      <h4 className="text-sm font-semibold mb-4" style={{ color: "var(--g-text)" }}>
        {t("statistics.dayOfWeek")}
      </h4>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="var(--g-border)" />
          <PolarAngleAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: "var(--g-text-secondary)" }}
          />
          <Tooltip />
          <Radar
            name={t("common.download")}
            dataKey="download"
            stroke="var(--g-blue)"
            fill="var(--g-blue)"
            fillOpacity={0.15}
            strokeWidth={2}
          />
          <Radar
            name={t("common.upload")}
            dataKey="upload"
            stroke="var(--g-green)"
            fill="var(--g-green)"
            fillOpacity={0.1}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
