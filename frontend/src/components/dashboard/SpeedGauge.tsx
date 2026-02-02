import { Card } from "../common/Card";

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
    <Card className="flex-1">
      <p className="text-sm font-medium text-[#86868B] mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <span
          className="text-5xl font-bold tabular-nums tracking-tight"
          style={{ color: isViolation ? "#FF3B30" : color }}
        >
          {value.toFixed(1)}
        </span>
        <span className="text-lg text-[#86868B] font-medium">{unit}</span>
      </div>
      {isViolation && (
        <p className="text-xs text-[#FF3B30] mt-2 font-medium">
          Below threshold ({threshold} {unit})
        </p>
      )}
    </Card>
  );
}
