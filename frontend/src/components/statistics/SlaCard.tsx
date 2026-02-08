import { useTranslation } from "react-i18next";
import type { SlaCompliance } from "../../api/types";
import { GlassCard } from "../ui/GlassCard";
import { ProgressRing } from "../speedtest/ProgressRing";
import { AnimatedNumber } from "../common/AnimatedNumber";

interface SlaCardProps {
  sla: SlaCompliance;
}

export function SlaCard({ sla }: SlaCardProps) {
  const { t } = useTranslation();
  return (
    <GlassCard>
      <h4 className="text-sm font-semibold mb-4" style={{ color: "var(--g-text)" }}>
        {t("statistics.slaCompliance")}
      </h4>
      <div className="flex justify-around">
        <div className="flex flex-col items-center gap-2">
          <ProgressRing
            value={sla.download_compliance_pct}
            size={90}
            strokeWidth={6}
            color="var(--g-blue)"
          >
            <AnimatedNumber
              value={sla.download_compliance_pct}
              decimals={0}
              className="text-sm font-bold"
              style={{ color: "var(--g-blue)" }}
            />
            <span className="text-xs" style={{ color: "var(--g-blue)" }}>{t("common.pct")}</span>
          </ProgressRing>
          <span className="text-xs" style={{ color: "var(--g-text-secondary)" }}>{t("common.download")}</span>
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
            <AnimatedNumber
              value={sla.upload_compliance_pct}
              decimals={0}
              className="text-sm font-bold"
              style={{ color: "var(--g-green)" }}
            />
            <span className="text-xs" style={{ color: "var(--g-green)" }}>{t("common.pct")}</span>
          </ProgressRing>
          <span className="text-xs" style={{ color: "var(--g-text-secondary)" }}>{t("common.upload")}</span>
          <span className="text-[10px] tabular-nums" style={{ color: "var(--g-text-tertiary)" }}>
            {sla.upload_compliant}/{sla.total_tests}
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
