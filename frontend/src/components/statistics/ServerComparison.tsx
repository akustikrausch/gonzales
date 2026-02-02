import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ServerStats } from "../../api/types";
import { GlassCard } from "../ui/GlassCard";

interface ServerComparisonProps {
  servers: ServerStats[];
}

export function ServerComparison({ servers }: ServerComparisonProps) {
  if (servers.length === 0) return null;

  const data = servers.map((s) => ({
    name: s.server_name.length > 15 ? s.server_name.slice(0, 15) + "..." : s.server_name,
    download: s.avg_download_mbps,
    upload: s.avg_upload_mbps,
    tests: s.test_count,
  }));

  return (
    <GlassCard>
      <h4 className="text-sm font-semibold mb-4" style={{ color: "var(--g-text)" }}>
        Server Comparison
      </h4>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--g-border)" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="var(--g-text-tertiary)" />
          <YAxis tick={{ fontSize: 11 }} stroke="var(--g-text-tertiary)" unit=" Mbps" />
          <Tooltip />
          <Legend />
          <Bar dataKey="download" fill="var(--g-blue)" name="Download" radius={[4, 4, 0, 0]} />
          <Bar dataKey="upload" fill="var(--g-green)" name="Upload" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
