import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ProblemFingerprint } from "../../api/types";

interface ProblemFingerprintCardProps {
  fingerprint: ProblemFingerprint;
  isPrimary?: boolean;
}

const categoryLabels: Record<string, string> = {
  dns: "rootCause.dns",
  local_network: "rootCause.localNetwork",
  isp_backbone: "rootCause.ispBackbone",
  isp_lastmile: "rootCause.ispLastMile",
  server: "rootCause.server",
  time_based: "rootCause.timeBasedPatterns",
  outages: "statistics.outages",
  connection: "latestResult.connectionType",
};

const severityConfig = {
  critical: {
    icon: AlertCircle,
    color: "var(--g-red)",
    bgColor: "var(--g-red-tint)",
    label: "rootCause.critical",
  },
  warning: {
    icon: AlertTriangle,
    color: "var(--g-orange)",
    bgColor: "var(--g-orange-tint)",
    label: "rootCause.warning",
  },
  info: {
    icon: Info,
    color: "var(--g-blue)",
    bgColor: "var(--g-blue-tint)",
    label: "rootCause.info",
  },
};

export function ProblemFingerprintCard({ fingerprint, isPrimary = false }: ProblemFingerprintCardProps) {
  const { t } = useTranslation();
  const config = severityConfig[fingerprint.severity];
  const Icon = config.icon;

  return (
    <div
      className="p-4 rounded-lg"
      style={{
        background: config.bgColor,
        boxShadow: isPrimary ? `inset 0 0 0 2px ${config.color}` : undefined,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="p-2 rounded-lg"
          style={{ background: `${config.color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color: config.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {isPrimary && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: config.color, color: "white" }}
              >
                {t("rootCause.primaryCause")}
              </span>
            )}
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{ background: "var(--g-card-bg)", color: "var(--g-text-secondary)" }}
            >
              {t(categoryLabels[fingerprint.category] || fingerprint.category)}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{ background: config.color + "30", color: config.color }}
            >
              {t(config.label)}
            </span>
          </div>
          <p className="text-sm font-medium mt-2" style={{ color: "var(--g-text)" }}>
            {fingerprint.description}
          </p>
          <div className="mt-2 flex items-center gap-3 text-xs" style={{ color: "var(--g-text-secondary)" }}>
            <span>
              {t("rootCause.confidence")}: <strong style={{ color: config.color }}>{Math.round(fingerprint.confidence * 100)}%</strong>
            </span>
            {fingerprint.occurrence_count > 1 && (
              <span>
                {t("rootCause.occurrences")}: <strong>{fingerprint.occurrence_count}</strong>
              </span>
            )}
          </div>
          {fingerprint.evidence.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs font-medium" style={{ color: "var(--g-text-secondary)" }}>
                {t("rootCause.evidence")}:
              </p>
              <ul className="text-xs space-y-0.5" style={{ color: "var(--g-text)" }}>
                {fingerprint.evidence.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span style={{ color: config.color }}>•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
