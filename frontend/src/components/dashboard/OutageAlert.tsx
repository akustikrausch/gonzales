import { AlertTriangle } from "lucide-react";
import type { OutageStatus } from "../../api/types";
import { formatDate } from "../../utils/format";

interface OutageAlertProps {
  outage: OutageStatus;
}

export function OutageAlert({ outage }: OutageAlertProps) {
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
          Outage Detected
        </p>
        <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
          {outage.consecutive_failures} consecutive failure{outage.consecutive_failures !== 1 ? "s" : ""}
          {outage.outage_started_at && ` since ${formatDate(outage.outage_started_at)}`}
        </p>
      </div>
    </div>
  );
}
