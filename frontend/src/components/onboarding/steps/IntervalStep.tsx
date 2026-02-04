import { Clock } from "lucide-react";
import { GlassButton } from "../../ui/GlassButton";
import { GlassSelect } from "../../ui/GlassSelect";

interface IntervalStepProps {
  testInterval: number;
  onChange: (value: number) => void;
  onNext: () => void;
  onBack: () => void;
}

const intervalOptions = [
  { value: 15, label: "Every 15 minutes" },
  { value: 30, label: "Every 30 minutes" },
  { value: 60, label: "Every hour (recommended)" },
  { value: 120, label: "Every 2 hours" },
  { value: 240, label: "Every 4 hours" },
  { value: 360, label: "Every 6 hours" },
  { value: 720, label: "Every 12 hours" },
  { value: 1440, label: "Once a day" },
];

export function IntervalStep({ testInterval, onChange, onNext, onBack }: IntervalStepProps) {
  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--g-orange)] bg-opacity-10 flex items-center justify-center">
          <Clock className="w-8 h-8 text-[var(--g-orange)]" />
        </div>
        <h2 className="text-xl font-bold mb-2">Test Frequency</h2>
        <p className="text-[var(--g-text-secondary)] text-sm">
          How often should Gonzales automatically run speed tests?
        </p>
      </div>

      <div className="max-w-sm mx-auto mb-8">
        <label className="block text-sm font-medium mb-2">Test Interval</label>
        <GlassSelect
          value={testInterval}
          onChange={(e) => onChange(Number(e.target.value))}
        >
          {intervalOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </GlassSelect>
        <p className="text-xs text-[var(--g-text-tertiary)] mt-2">
          More frequent tests give better data but use more bandwidth
        </p>
      </div>

      <div className="flex gap-3 justify-center">
        <GlassButton variant="default" onClick={onBack}>
          Back
        </GlassButton>
        <GlassButton variant="primary" onClick={onNext}>
          Continue
        </GlassButton>
      </div>
    </div>
  );
}
