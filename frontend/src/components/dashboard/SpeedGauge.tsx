import { GlassCard } from "../ui/GlassCard";

interface SpeedGaugeProps {
  label: string;
  value: number;
  unit?: string;
  color: string;
  threshold?: number;
}

export function SpeedGauge({
  label,
  value,
  unit = "Mbps",
  color,
  threshold,
}: SpeedGaugeProps) {
  const isViolation = threshold !== undefined && value < threshold;

  return (
    <GlassCard hover className="flex-1">
      <p className="text-sm font-medium mb-1" style={{ color: "var(--g-text-secondary)" }}>
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span
          className="text-5xl font-bold tabular-nums tracking-tight"
          style={{ color: isViolation ? "var(--g-red)" : color }}
        >
          {value.toFixed(1)}
        </span>
        <span className="text-lg font-medium" style={{ color: "var(--g-text-secondary)" }}>
          {unit}
        </span>
      </div>
      {isViolation && (
        <p className="text-xs mt-2 font-medium" style={{ color: "var(--g-red)" }}>
          Below threshold ({threshold} {unit})
        </p>
      )}
    </GlassCard>
  );
}
