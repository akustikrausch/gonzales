import { useTranslation } from "react-i18next";
import type { ReliabilityScore } from "../../api/types";
import { GlassCard } from "../ui/GlassCard";
import { ProgressRing } from "../speedtest/ProgressRing";
import { AnimatedNumber } from "../common/AnimatedNumber";

interface ReliabilityCardProps {
  reliability: ReliabilityScore;
}

export function ReliabilityCard({ reliability }: ReliabilityCardProps) {
  const { t } = useTranslation();
  const score = reliability.composite_score;
  const color = score >= 80 ? "var(--g-green)" : score >= 50 ? "var(--g-orange)" : "var(--g-red)";

  return (
    <GlassCard>
      <h4 className="text-sm font-semibold mb-4" style={{ color: "var(--g-text)" }}>
        {t("statistics.reliabilityScore")}
      </h4>
      <div className="flex flex-col items-center gap-3">
        <ProgressRing value={score} size={110} strokeWidth={8} color={color}>
          <AnimatedNumber
            value={score}
            decimals={0}
            className="text-2xl font-bold"
            style={{ color }}
          />
        </ProgressRing>
        <div className="grid grid-cols-3 gap-4 text-center w-full mt-2">
          <div>
            <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>DL CV</p>
            <AnimatedNumber
              value={reliability.download_cv * 100}
              decimals={1}
              className="text-sm font-medium"
              style={{ color: "var(--g-text)" }}
            />
            <span className="text-xs" style={{ color: "var(--g-text-secondary)" }}>{t("common.pct")}</span>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>UL CV</p>
            <AnimatedNumber
              value={reliability.upload_cv * 100}
              decimals={1}
              className="text-sm font-medium"
              style={{ color: "var(--g-text)" }}
            />
            <span className="text-xs" style={{ color: "var(--g-text-secondary)" }}>{t("common.pct")}</span>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>Ping CV</p>
            <AnimatedNumber
              value={reliability.ping_cv * 100}
              decimals={1}
              className="text-sm font-medium"
              style={{ color: "var(--g-text)" }}
            />
            <span className="text-xs" style={{ color: "var(--g-text-secondary)" }}>{t("common.pct")}</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
