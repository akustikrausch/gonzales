import { Gauge } from "lucide-react";
import { GlassButton } from "../../ui/GlassButton";
import { GlassInput } from "../../ui/GlassInput";

interface ThresholdsStepProps {
  downloadThreshold: number;
  uploadThreshold: number;
  onChangeDownload: (value: number) => void;
  onChangeUpload: (value: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ThresholdsStep({
  downloadThreshold,
  uploadThreshold,
  onChangeDownload,
  onChangeUpload,
  onNext,
  onBack,
}: ThresholdsStepProps) {
  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--g-green)] bg-opacity-10 flex items-center justify-center">
          <Gauge className="w-8 h-8 text-[var(--g-green)]" />
        </div>
        <h2 className="text-xl font-bold mb-2">Speed Thresholds</h2>
        <p className="text-[var(--g-text-secondary)] text-sm">
          Set the minimum speeds you expect from your ISP contract
        </p>
      </div>

      <div className="max-w-sm mx-auto space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium mb-2">
            Download Threshold (Mbps)
          </label>
          <GlassInput
            type="number"
            value={downloadThreshold}
            onChange={(e) => onChangeDownload(Number(e.target.value))}
            min={1}
            max={10000}
          />
          <p className="text-xs text-[var(--g-text-tertiary)] mt-1">
            You'll be notified when download speed falls below this
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Upload Threshold (Mbps)
          </label>
          <GlassInput
            type="number"
            value={uploadThreshold}
            onChange={(e) => onChangeUpload(Number(e.target.value))}
            min={1}
            max={10000}
          />
          <p className="text-xs text-[var(--g-text-tertiary)] mt-1">
            You'll be notified when upload speed falls below this
          </p>
        </div>
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
