import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { OutageStatus } from "../../api/types";
import { formatDate } from "../../utils/format";

interface OutageAlertProps {
  outage: OutageStatus;
}

export function OutageAlert({ outage }: OutageAlertProps) {
  const { t } = useTranslation();
  if (!outage.outage_active) return null;

  return (
    <div
      role="alert"
      className="flex items-center gap-3 p-3 rounded-xl g-animate-in"
      style={{
        background: "var(--g-red)12",
        border: "1px solid var(--g-red)30",
      }}
    >
      <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: "var(--g-red)" }} />
      <div className="min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--g-red)" }}>
          {t("outageAlert.outageDetected")}
        </p>
        <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
          {t("outageAlert.failures", { count: outage.consecutive_failures })}
          {outage.outage_started_at && ` ${t("outageAlert.since", { time: formatDate(outage.outage_started_at) })}`}
        </p>
      </div>
    </div>
  );
}
