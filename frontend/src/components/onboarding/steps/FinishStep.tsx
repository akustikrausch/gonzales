import { CheckCircle2 } from "lucide-react";
import { GlassButton } from "../../ui/GlassButton";
import type { OnboardingData } from "../../../hooks/useOnboarding";

interface FinishStepProps {
  data: OnboardingData;
  onComplete: () => void;
  onBack: () => void;
}

export function FinishStep({ data, onComplete, onBack }: FinishStepProps) {
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
        <h2 className="text-xl font-bold mb-2">You're All Set!</h2>
        <p className="text-[var(--g-text-secondary)] text-sm">
          Here's a summary of your configuration
        </p>
      </div>

      <div className="max-w-sm mx-auto mb-8">
        <div className="glass-card p-4 space-y-3">
          {data.ispName && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--g-text-secondary)]">ISP</span>
              <span className="font-medium">{data.ispName}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-[var(--g-text-secondary)]">Download Threshold</span>
            <span className="font-medium">{data.downloadThreshold} Mbps</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--g-text-secondary)]">Upload Threshold</span>
            <span className="font-medium">{data.uploadThreshold} Mbps</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--g-text-secondary)]">Test Interval</span>
            <span className="font-medium">{formatInterval(data.testInterval)}</span>
          </div>
        </div>
        <p className="text-xs text-[var(--g-text-tertiary)] mt-3 text-center">
          You can change these settings anytime in the Settings page
        </p>
      </div>

      <div className="flex gap-3 justify-center">
        <GlassButton variant="default" onClick={onBack}>
          Back
        </GlassButton>
        <GlassButton variant="primary" onClick={onComplete}>
          Start Monitoring
        </GlassButton>
      </div>
    </div>
  );
}
