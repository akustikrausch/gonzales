import { useCallback, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useOnboarding, type OnboardingData } from "../../hooks/useOnboarding";
import { OnboardingProgress } from "./OnboardingProgress";
import { WelcomeStep } from "./steps/WelcomeStep";
import { IspInfoStep } from "./steps/IspInfoStep";
import { ThresholdsStep } from "./steps/ThresholdsStep";
import { IntervalStep } from "./steps/IntervalStep";
import { FinishStep } from "./steps/FinishStep";
import { api } from "../../api/client";

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
  onSkip: () => void;
}

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const {
    currentStep,
    totalSteps,
    data,
    setData,
    nextStep,
    prevStep,
    completeOnboarding,
    skipOnboarding,
  } = useOnboarding();

  const handleComplete = useCallback(async () => {
    try {
      // Save settings to backend
      await api.updateConfig({
        isp_name: data.ispName || undefined,
        download_threshold_mbps: data.downloadThreshold,
        upload_threshold_mbps: data.uploadThreshold,
        test_interval_minutes: data.testInterval,
      });
    } catch (error) {
      console.error("Failed to save onboarding settings:", error);
    }
    completeOnboarding();
    onComplete(data);
  }, [data, completeOnboarding, onComplete]);

  const handleSkip = useCallback(() => {
    skipOnboarding();
    onSkip();
  }, [skipOnboarding, onSkip]);

  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Focus trap and escape key handler
  useEffect(() => {
    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Handle escape key and focus trap
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSkip();
        return;
      }

      // Focus trap
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus when modal closes
      previousActiveElement.current?.focus();
    };
  }, [handleSkip]);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={nextStep} onSkip={handleSkip} />;
      case 1:
        return (
          <IspInfoStep
            ispName={data.ispName}
            onChange={(value) => setData({ ispName: value })}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 2:
        return (
          <ThresholdsStep
            downloadThreshold={data.downloadThreshold}
            uploadThreshold={data.uploadThreshold}
            onChangeDownload={(value) => setData({ downloadThreshold: value })}
            onChangeUpload={(value) => setData({ uploadThreshold: value })}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <IntervalStep
            testInterval={data.testInterval}
            onChange={(value) => setData({ testInterval: value })}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 4:
        return (
          <FinishStep
            data={data}
            onComplete={handleComplete}
            onBack={prevStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-lg mx-4 glass-card p-8 animate-in fade-in zoom-in-95 duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--g-glass-bg)] transition-colors"
          onClick={handleSkip}
          aria-label="Close"
        >
          <X className="w-5 h-5 text-[var(--g-text-tertiary)]" aria-hidden="true" />
        </button>

        {/* Visually hidden title for screen readers */}
        <h1 id="onboarding-title" className="sr-only">
          Gonzales Setup Wizard
        </h1>

        {/* Progress indicator */}
        <OnboardingProgress currentStep={currentStep} totalSteps={totalSteps} />

        {/* Step content */}
        {renderStep()}
      </div>
    </div>
  );
}
