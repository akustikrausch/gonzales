import { Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { GlassButton } from "../../ui/GlassButton";

interface WelcomeStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export function WelcomeStep({ onNext, onSkip }: WelcomeStepProps) {
  const { t } = useTranslation();
  return (
    <div className="text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--g-blue)] bg-opacity-10 flex items-center justify-center">
        <Zap className="w-10 h-10 text-[var(--g-blue)]" />
      </div>

      <h2 className="text-2xl font-bold mb-3">{t("onboarding.welcome")}</h2>
      <p className="text-[var(--g-text-secondary)] mb-8 max-w-md mx-auto">
        {t("onboarding.welcomeText")}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <GlassButton variant="primary" onClick={onNext}>
          {t("onboarding.next")}
        </GlassButton>
        <GlassButton variant="default" onClick={onSkip}>
          {t("onboarding.skip")}
        </GlassButton>
      </div>
    </div>
  );
}
