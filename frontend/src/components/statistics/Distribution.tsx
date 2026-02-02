import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Measurement } from "../../api/types";
import { Card } from "../common/Card";

interface DistributionProps {
  measurements: Measurement[];
  field: "download_mbps" | "upload_mbps" | "ping_latency_ms";
  label: string;
  unit: string;
  color: string;
  bins?: number;
}

export function Distribution({
  measurements,
  field,
  label,
  unit,
  color,
  bins = 15,
}: DistributionProps) {
  if (measurements.length === 0) return null;

  const values = measurements.map((m) => m[field]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const binWidth = range / bins;

  const histogram = Array.from({ length: bins }, (_, i) => ({
    range: `${(min + i * binWidth).toFixed(0)}`,
    count: 0,
  }));

  for (const v of values) {
    const idx = Math.min(Math.floor((v - min) / binWidth), bins - 1);
    histogram[idx].count++;
  }

  return (
    <Card>
      <h4 className="text-sm font-semibold text-[#1D1D1F] mb-4">
        {label} Distribution ({unit})
      </h4>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={histogram}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" />
          <XAxis dataKey="range" tick={{ fontSize: 10 }} stroke="#86868B" />
          <YAxis tick={{ fontSize: 11 }} stroke="#86868B" />
          <Tooltip />
          <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
