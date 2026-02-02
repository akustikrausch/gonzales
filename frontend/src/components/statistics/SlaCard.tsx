import type { SlaCompliance } from "../../api/types";
import { GlassCard } from "../ui/GlassCard";
import { ProgressRing } from "../speedtest/ProgressRing";

interface SlaCardProps {
  sla: SlaCompliance;
}

export function SlaCard({ sla }: SlaCardProps) {
  return (
    <GlassCard>
      <h4 className="text-sm font-semibold mb-4" style={{ color: "var(--g-text)" }}>
        SLA Compliance
      </h4>
      <div className="flex justify-around">
        <div className="flex flex-col items-center gap-2">
          <ProgressRing
            value={sla.download_compliance_pct}
            size={90}
            strokeWidth={6}
            color="var(--g-blue)"
          >
            <span className="text-sm font-bold tabular-nums" style={{ color: "var(--g-blue)" }}>
              {sla.download_compliance_pct.toFixed(0)}%
            </span>
          </ProgressRing>
          <span className="text-xs" style={{ color: "var(--g-text-secondary)" }}>Download</span>
          <span className="text-[10px] tabular-nums" style={{ color: "var(--g-text-tertiary)" }}>
            {sla.download_compliant}/{sla.total_tests}
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <ProgressRing
            value={sla.upload_compliance_pct}
            size={90}
            strokeWidth={6}
            color="var(--g-green)"
          >
            <span className="text-sm font-bold tabular-nums" style={{ color: "var(--g-green)" }}>
              {sla.upload_compliance_pct.toFixed(0)}%
            </span>
          </ProgressRing>
          <span className="text-xs" style={{ color: "var(--g-text-secondary)" }}>Upload</span>
          <span className="text-[10px] tabular-nums" style={{ color: "var(--g-text-tertiary)" }}>
            {sla.upload_compliant}/{sla.total_tests}
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
