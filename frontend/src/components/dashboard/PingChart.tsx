import {
  CartesianGrid,
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

interface PingChartProps {
  measurements: Measurement[];
}

export function PingChart({ measurements }: PingChartProps) {
  const data = [...measurements].reverse().map((m) => ({
    time: formatShortDate(m.timestamp),
    ping: Number(m.ping_latency_ms.toFixed(1)),
    jitter: Number(m.ping_jitter_ms.toFixed(1)),
  }));

  return (
    <GlassCard>
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--g-text)" }}>
        Latency Over Time
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--g-border)" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="var(--g-text-tertiary)" />
          <YAxis tick={{ fontSize: 11 }} stroke="var(--g-text-tertiary)" unit=" ms" />
          <Tooltip
            contentStyle={{
              background: "var(--g-card-bg)",
              border: "1px solid var(--g-card-border)",
              borderRadius: "var(--g-radius-sm)",
              backdropFilter: "blur(20px)",
              fontSize: "var(--g-text-xs)",
            }}
          />
          <Line
            type="monotone"
            dataKey="ping"
            stroke="var(--g-orange)"
            strokeWidth={2}
            dot={false}
            name="Ping"
            animationDuration={800}
            animationBegin={0}
            animationEasing="ease-out"
          />
          <Line
            type="monotone"
            dataKey="jitter"
            stroke="var(--g-purple)"
            strokeWidth={2}
            dot={false}
            name="Jitter"
            animationDuration={800}
            animationBegin={200}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
