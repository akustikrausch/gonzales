import { useTranslation } from "react-i18next";
import type { Statistics } from "../../api/types";
import { GlassCard } from "../ui/GlassCard";
import { AnimatedNumber } from "../common/AnimatedNumber";

interface StatsOverviewProps {
  stats: Statistics;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(1)} TB`;
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

function StatRow({
  label,
  stat,
  unit,
  color,
}: {
  label: string;
  stat: { min: number; max: number; avg: number; median: number; stddev: number } | null;
  unit: string;
  color: string;
}) {
  if (!stat) return null;
  return (
    <GlassCard>
      <h4 className="text-sm font-semibold mb-3" style={{ color }}>
        {label}
      </h4>
      <div className="grid grid-cols-5 gap-3 text-center">
        {(["min", "max", "avg", "median", "stddev"] as const).map((key) => (
          <div key={key}>
            <p className="text-xs uppercase" style={{ color: "var(--g-text-secondary)" }}>{key}</p>
            <AnimatedNumber
              value={stat[key]}
              decimals={1}
              className="text-lg font-bold block"
              style={{ color: "var(--g-text)" }}
            />
            <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>{unit}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  const { t } = useTranslation();
  const avgDataPerTest = stats.total_tests > 0
    ? stats.total_data_used_bytes / stats.total_tests
    : 0;

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-sm" style={{ color: "var(--g-text-secondary)" }}>{t("statistics.totalTests")}</p>
            <AnimatedNumber
              value={stats.total_tests}
              decimals={0}
              className="text-3xl font-bold block"
              style={{ color: "var(--g-text)" }}
            />
          </div>
          <div>
            <p className="text-sm" style={{ color: "var(--g-text-secondary)" }}>Threshold Violations</p>
            <div className="flex gap-4 mt-1">
              <span className="text-sm">
                <AnimatedNumber
                  value={stats.download_violations}
                  decimals={0}
                  className="font-bold"
                  style={{ color: "var(--g-red)" }}
                />{" "}DL
              </span>
              <span className="text-sm">
                <AnimatedNumber
                  value={stats.upload_violations}
                  decimals={0}
                  className="font-bold"
                  style={{ color: "var(--g-red)" }}
                />{" "}UL
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm" style={{ color: "var(--g-text-secondary)" }}>{t("statistics.totalDataUsed")}</p>
            <p className="text-2xl font-bold" style={{ color: "var(--g-text)" }}>
              {formatBytes(stats.total_data_used_bytes)}
            </p>
          </div>
          <div>
            <p className="text-sm" style={{ color: "var(--g-text-secondary)" }}>{t("statistics.avgDataPerTest")}</p>
            <p className="text-2xl font-bold" style={{ color: "var(--g-text)" }}>
              {formatBytes(avgDataPerTest)}
            </p>
          </div>
        </div>
      </GlassCard>
      <StatRow label={t("common.download")} stat={stats.download} unit={t("common.mbps")} color="var(--g-blue)" />
      <StatRow label={t("common.upload")} stat={stats.upload} unit={t("common.mbps")} color="var(--g-green)" />
      <StatRow label={t("common.ping")} stat={stats.ping} unit={t("common.ms")} color="var(--g-orange)" />
    </div>
  );
}
