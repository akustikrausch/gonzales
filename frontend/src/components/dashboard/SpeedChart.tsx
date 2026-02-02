import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
}

export function SpeedChart({ measurements }: SpeedChartProps) {
  const data = [...measurements].reverse().map((m) => ({
    time: formatShortDate(m.timestamp),
    download: Number(m.download_mbps.toFixed(1)),
    upload: Number(m.upload_mbps.toFixed(1)),
  }));

  return (
    <GlassCard>
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--g-text)" }}>
        Speed Over Time
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--g-border)" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="var(--g-text-tertiary)" />
          <YAxis tick={{ fontSize: 11 }} stroke="var(--g-text-tertiary)" unit=" Mbps" />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="download" stroke="var(--g-blue)" strokeWidth={2} dot={false} name="Download" />
          <Line type="monotone" dataKey="upload" stroke="var(--g-green)" strokeWidth={2} dot={false} name="Upload" />
        </LineChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
