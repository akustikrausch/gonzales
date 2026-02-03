import { GlassCard } from "../ui/GlassCard";
import { AnimatedNumber } from "../common/AnimatedNumber";

interface SpeedGaugeProps {
  label: string;
  sublabel?: string;
  value: number;
  unit?: string;
  color: string;
  threshold?: number;
  thresholdLabel?: string;
}

export function SpeedGauge({
  label,
  sublabel,
  value,
  unit = "Mbps",
  color,
  threshold,
  thresholdLabel,
}: SpeedGaugeProps) {
  const hasThreshold = threshold !== undefined;
  const isViolation = hasThreshold && value < threshold;
  const isCompliant = hasThreshold && value >= threshold;

  return (
    <GlassCard hover className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium" style={{ color: "var(--g-text-secondary)" }}>
          {label}
        </p>
        {sublabel && (
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
            background: "var(--g-surface)",
            color: "var(--g-text-secondary)"
          }}>
            {sublabel}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <AnimatedNumber
          value={value}
          decimals={1}
          className="text-5xl font-bold tracking-tight"
          style={{ color: isViolation ? "var(--g-red)" : isCompliant ? "var(--g-green)" : color }}
        />
        <span className="text-lg font-medium" style={{ color: "var(--g-text-secondary)" }}>
          {unit}
        </span>
      </div>
      {hasThreshold && (
        <p className="text-xs mt-2 font-medium" style={{ color: isViolation ? "var(--g-red)" : "var(--g-green)" }}>
          {isViolation ? "Below threshold" : "Above threshold"} ({thresholdLabel || `${threshold} ${unit}`})
        </p>
      )}
    </GlassCard>
  );
}
