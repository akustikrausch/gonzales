import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { GlassButton } from "../../ui/GlassButton";
import type { OnboardingData } from "../../../hooks/useOnboarding";

interface FinishStepProps {
  data: OnboardingData;
  onComplete: () => void;
  onBack: () => void;
}

export function FinishStep({ data, onComplete, onBack }: FinishStepProps) {
  const { t } = useTranslation();
  const formatInterval = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    if (minutes === 60) return "1 hour";
    if (minutes < 1440) return `${minutes / 60} hours`;
    return "1 day";
  };

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--g-green)] bg-opacity-10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-[var(--g-green)]" />
        </div>
        <h2 className="text-xl font-bold mb-2">{t("onboarding.step3Title")}</h2>
        <p className="text-[var(--g-text-secondary)] text-sm">
          {t("onboarding.step3Text")}
        </p>
      </div>

      <div className="max-w-sm mx-auto mb-8">
        <div className="glass-card p-4 space-y-3">
          {data.ispName && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--g-text-secondary)]">{t("latestResult.isp")}</span>
              <span className="font-medium">{data.ispName}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-[var(--g-text-secondary)]">{t("settings.downloadThreshold")}</span>
            <span className="font-medium">{data.downloadThreshold} {t("common.mbps")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--g-text-secondary)]">{t("settings.uploadThreshold")}</span>
            <span className="font-medium">{data.uploadThreshold} {t("common.mbps")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--g-text-secondary)]">{t("settings.testInterval")}</span>
            <span className="font-medium">{formatInterval(data.testInterval)}</span>
          </div>
        </div>
        <p className="text-xs text-[var(--g-text-tertiary)] mt-3 text-center">
          {t("onboarding.step3Text")}
        </p>
      </div>

      <div className="flex gap-3 justify-center">
        <GlassButton variant="default" onClick={onBack}>
          {t("onboarding.back")}
        </GlassButton>
        <GlassButton variant="primary" onClick={onComplete}>
          {t("onboarding.finish")}
        </GlassButton>
      </div>
    </div>
  );
}
