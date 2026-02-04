import { useState, useCallback, useEffect } from "react";

const ONBOARDING_KEY = "gonzales_has_seen_onboarding";
const TOTAL_STEPS = 5;

export interface OnboardingData {
  ispName: string;
  downloadThreshold: number;
  uploadThreshold: number;
  testInterval: number;
}

const DEFAULT_DATA: OnboardingData = {
  ispName: "",
  downloadThreshold: 100,
  uploadThreshold: 50,
  testInterval: 60,
};

interface UseOnboardingReturn {
  hasSeenOnboarding: boolean;
  showOnboarding: boolean;
  currentStep: number;
  totalSteps: number;
  data: OnboardingData;
  setData: (data: Partial<OnboardingData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
}

export function useOnboarding(): UseOnboardingReturn {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => {
    return localStorage.getItem(ONBOARDING_KEY) === "true";
  });
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem(ONBOARDING_KEY) !== "true";
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setDataState] = useState<OnboardingData>(DEFAULT_DATA);

  useEffect(() => {
    const stored = localStorage.getItem(ONBOARDING_KEY);
    if (stored === "true") {
      setHasSeenOnboarding(true);
      setShowOnboarding(false);
    }
  }, []);

  const setData = useCallback((newData: Partial<OnboardingData>) => {
    setDataState((prev) => ({ ...prev, ...newData }));
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, TOTAL_STEPS - 1)));
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setHasSeenOnboarding(true);
    setShowOnboarding(false);
  }, []);

  const skipOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setHasSeenOnboarding(true);
    setShowOnboarding(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
    setHasSeenOnboarding(false);
    setShowOnboarding(true);
    setCurrentStep(0);
    setDataState(DEFAULT_DATA);
  }, []);

  return {
    hasSeenOnboarding,
    showOnboarding,
    currentStep,
    totalSteps: TOTAL_STEPS,
    data,
    setData,
    nextStep,
    prevStep,
    goToStep,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
  };
}
