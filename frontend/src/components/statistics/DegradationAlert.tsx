import { AlertTriangle, TrendingDown, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DegradationAlert as DegradationAlertType } from "../../api/types";
import { GlassCard } from "../ui/GlassCard";

interface DegradationAlertBannerProps {
  alerts: DegradationAlertType[];
}

const severityConfig: Record<string, { icon: typeof AlertTriangle; color: string; labelKey: string }> = {
  critical: { icon: AlertTriangle, color: "var(--g-red)", labelKey: "rootCause.critical" },
  warning: { icon: TrendingDown, color: "var(--g-orange)", labelKey: "rootCause.warning" },
  info: { icon: Info, color: "var(--g-teal)", labelKey: "rootCause.info" },
};

export function DegradationAlertBanner({ alerts }: DegradationAlertBannerProps) {
  const { t } = useTranslation();

  const metricLabels: Record<string, string> = {
    download_mbps: t("qos.downloadSpeed"),
    upload_mbps: t("qos.uploadSpeed"),
    ping_ms: t("qos.pingLatency"),
  };

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2 g-animate-in">
      {alerts.map((alert, i) => {
        const config = severityConfig[alert.severity] || severityConfig.info;
        const Icon = config.icon;

        return (
          <GlassCard
            key={`${alert.metric}-${i}`}
            padding="sm"
            className="relative overflow-hidden"
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
              style={{ background: config.color }}
            />
            <div className="flex items-start gap-3 pl-3">
              <Icon
                className="w-4 h-4 shrink-0 mt-0.5"
                style={{ color: config.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: "var(--g-text)" }}>
                    {metricLabels[alert.metric] || alert.metric}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{
                      background: `${config.color}15`,
                      color: config.color,
                    }}
                  >
                    {t(config.labelKey)}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "var(--g-text-secondary)" }}>
                  {alert.description}
                </p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-[10px] tabular-nums" style={{ color: "var(--g-text-tertiary)" }}>
                    {t("docs.currentValue")}: {alert.current_avg.toFixed(1)}
                  </span>
                  <span className="text-[10px] tabular-nums" style={{ color: "var(--g-text-tertiary)" }}>
                    {t("docs.historicalValue")}: {alert.historical_avg.toFixed(1)}
                  </span>
                  <span
                    className="text-[10px] font-semibold tabular-nums"
                    style={{ color: config.color }}
                  >
                    -{alert.drop_pct.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
