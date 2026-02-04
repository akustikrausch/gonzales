import { Zap } from "lucide-react";
import { GlassButton } from "../../ui/GlassButton";

interface WelcomeStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export function WelcomeStep({ onNext, onSkip }: WelcomeStepProps) {
  return (
    <div className="text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--g-blue)] bg-opacity-10 flex items-center justify-center">
        <Zap className="w-10 h-10 text-[var(--g-blue)]" />
      </div>

      <h2 className="text-2xl font-bold mb-3">Welcome to Gonzales</h2>
      <p className="text-[var(--g-text-secondary)] mb-8 max-w-md mx-auto">
        Your open-source internet speed monitor. Let's set up a few things to get you started
        with automated speed testing and analytics.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <GlassButton variant="primary" onClick={onNext}>
          Get Started
        </GlassButton>
        <GlassButton variant="default" onClick={onSkip}>
          Skip Setup
        </GlassButton>
      </div>
    </div>
  );
}
