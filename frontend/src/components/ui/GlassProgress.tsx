interface GlassProgressProps {
  value: number;
  max?: number;
  min?: number;
  color?: string;
  className?: string;
  /** Accessible label for screen readers */
  label?: string;
}

export function GlassProgress({
  value,
  max = 100,
  min = 0,
  color = "var(--g-blue)",
  className = "",
  label,
}: GlassProgressProps) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div
      className={`glass-progress ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-label={label}
    >
      <div
        className="glass-progress-bar"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}
