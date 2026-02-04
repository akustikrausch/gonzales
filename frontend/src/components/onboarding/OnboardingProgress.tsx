interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i === currentStep
              ? "w-8 bg-[var(--g-blue)]"
              : i < currentStep
                ? "w-2 bg-[var(--g-blue)] opacity-60"
                : "w-2 bg-[var(--g-border)]"
          }`}
        />
      ))}
    </div>
  );
}
