import { Building2 } from "lucide-react";
import { GlassButton } from "../../ui/GlassButton";
import { GlassInput } from "../../ui/GlassInput";

interface IspInfoStepProps {
  ispName: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function IspInfoStep({ ispName, onChange, onNext, onBack }: IspInfoStepProps) {
  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--g-purple)] bg-opacity-10 flex items-center justify-center">
          <Building2 className="w-8 h-8 text-[var(--g-purple)]" />
        </div>
        <h2 className="text-xl font-bold mb-2">Your Internet Provider</h2>
        <p className="text-[var(--g-text-secondary)] text-sm">
          Enter your ISP name for better tracking and reports (optional)
        </p>
      </div>

      <div className="max-w-sm mx-auto mb-8">
        <label className="block text-sm font-medium mb-2">ISP Name</label>
        <GlassInput
          value={ispName}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g., Comcast, AT&T, Deutsche Telekom"
        />
        <p className="text-xs text-[var(--g-text-tertiary)] mt-2">
          This will be shown in reports and can be changed later in settings
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
