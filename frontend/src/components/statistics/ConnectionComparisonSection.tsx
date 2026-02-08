import { Wifi, Cable, Shield, HelpCircle, Trophy, ArrowDownCircle, ArrowUpCircle, Gauge } from "lucide-react";
import { useTranslation } from "react-i18next";
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
import type { ConnectionComparison } from "../../api/types";
import { GlassCard } from "../ui/GlassCard";

interface ConnectionComparisonSectionProps {
  comparison: ConnectionComparison;
}

const connectionIcons: Record<string, React.ReactNode> = {
  ethernet: <Cable className="w-5 h-5" />,
  wifi: <Wifi className="w-5 h-5" />,
  vpn: <Shield className="w-5 h-5" />,
  unknown: <HelpCircle className="w-5 h-5" />,
};

const connectionColors: Record<string, string> = {
  ethernet: "var(--g-blue)",
  wifi: "var(--g-green)",
  vpn: "var(--g-purple)",
  unknown: "var(--g-text-tertiary)",
};

export function ConnectionComparisonSection({ comparison }: ConnectionComparisonSectionProps) {
  const { t } = useTranslation();

  const connectionLabels: Record<string, string> = {
    ethernet: t("latestResult.ethernet"),
    wifi: t("latestResult.wifi"),
    vpn: t("latestResult.vpn"),
    unknown: t("latestResult.unknown"),
  };

  if (!comparison || comparison.types.length === 0) return null;

  const chartData = comparison.types.map((t) => ({
    name: connectionLabels[t.connection_type] || t.connection_type,
    download: Math.round(t.avg_download_mbps * 10) / 10,
    upload: Math.round(t.avg_upload_mbps * 10) / 10,
    ping: Math.round(t.avg_ping_ms * 10) / 10,
    tests: t.test_count,
  }));

  const getBestIcon = (metric: string) => {
    switch (metric) {
      case "download":
        return <ArrowDownCircle className="w-4 h-4" />;
      case "upload":
        return <ArrowUpCircle className="w-4 h-4" />;
      case "latency":
        return <Gauge className="w-4 h-4" />;
      default:
        return <Trophy className="w-4 h-4" />;
    }
  };

  return (
    <GlassCard>
      <h4 className="text-sm font-semibold mb-4" style={{ color: "var(--g-text)" }}>
        {t("docs.connectionTypeComparison")}
      </h4>

      {/* Chart */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--g-border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--g-text-tertiary)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--g-text-tertiary)" />
            <Tooltip
              contentStyle={{
                background: "var(--g-card-bg)",
                border: "1px solid var(--g-border)",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar
              dataKey="download"
              fill="var(--g-blue)"
              name={`${t("common.download")} (${t("common.mbps")})`}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="upload"
              fill="var(--g-green)"
              name={`${t("common.upload")} (${t("common.mbps")})`}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {comparison.types.map((type) => (
          <div
            key={type.connection_type}
            className="p-3 rounded-lg"
            style={{ background: "var(--g-glass-bg)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span style={{ color: connectionColors[type.connection_type] }}>
                {connectionIcons[type.connection_type]}
              </span>
              <span className="text-sm font-medium">
                {connectionLabels[type.connection_type] || type.connection_type}
              </span>
              <span
                className="text-xs ml-auto"
                style={{ color: "var(--g-text-tertiary)" }}
              >
                {type.test_count} {t("docs.tests")}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <div style={{ color: "var(--g-text-tertiary)" }}>{t("docs.down")}</div>
                <div className="font-medium">{type.avg_download_mbps.toFixed(1)}</div>
              </div>
              <div>
                <div style={{ color: "var(--g-text-tertiary)" }}>{t("docs.up")}</div>
                <div className="font-medium">{type.avg_upload_mbps.toFixed(1)}</div>
              </div>
              <div>
                <div style={{ color: "var(--g-text-tertiary)" }}>{t("common.ping")}</div>
                <div className="font-medium">{type.avg_ping_ms.toFixed(1)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Best for section */}
      <div className="p-3 rounded-lg" style={{ background: "var(--g-blue-tint)" }}>
        <div className="flex flex-wrap gap-4 text-sm mb-2">
          <div className="flex items-center gap-2">
            {getBestIcon("download")}
            <span style={{ color: "var(--g-text-secondary)" }}>{t("docs.bestDownload")}:</span>
            <span className="font-medium">
              {connectionLabels[comparison.best_for_download] || comparison.best_for_download}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {getBestIcon("upload")}
            <span style={{ color: "var(--g-text-secondary)" }}>{t("docs.bestUpload")}:</span>
            <span className="font-medium">
              {connectionLabels[comparison.best_for_upload] || comparison.best_for_upload}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {getBestIcon("latency")}
            <span style={{ color: "var(--g-text-secondary)" }}>{t("docs.bestLatency")}:</span>
            <span className="font-medium">
              {connectionLabels[comparison.best_for_latency] || comparison.best_for_latency}
            </span>
          </div>
        </div>
        {comparison.recommendation && (
          <p className="text-sm" style={{ color: "var(--g-text-secondary)" }}>
            <strong>{t("docs.recommendation")}:</strong> {comparison.recommendation}
          </p>
        )}
      </div>
    </GlassCard>
  );
}
