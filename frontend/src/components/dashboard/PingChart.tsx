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
import { Card } from "../common/Card";

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
    <Card>
      <h3 className="text-sm font-semibold text-[#1D1D1F] mb-4">
        Latency Over Time
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="#86868B" />
          <YAxis tick={{ fontSize: 11 }} stroke="#86868B" unit=" ms" />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="ping"
            stroke="#FF9500"
            strokeWidth={2}
            dot={false}
            name="Ping"
          />
          <Line
            type="monotone"
            dataKey="jitter"
            stroke="#AF52DE"
            strokeWidth={2}
            dot={false}
            name="Jitter"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
