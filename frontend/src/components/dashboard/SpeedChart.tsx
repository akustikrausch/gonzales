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
import { Card } from "../common/Card";

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
    <Card>
      <h3 className="text-sm font-semibold text-[#1D1D1F] mb-4">
        Speed Over Time
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="#86868B" />
          <YAxis tick={{ fontSize: 11 }} stroke="#86868B" unit=" Mbps" />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="download"
            stroke="#007AFF"
            strokeWidth={2}
            dot={false}
            name="Download"
          />
          <Line
            type="monotone"
            dataKey="upload"
            stroke="#34C759"
            strokeWidth={2}
            dot={false}
            name="Upload"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
