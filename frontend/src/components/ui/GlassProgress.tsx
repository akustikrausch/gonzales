interface GlassProgressProps {
  value: number;
  max?: number;
  color?: string;
  className?: string;
}

export function GlassProgress({
  value,
  max = 100,
  color = "var(--g-blue)",
  className = "",
}: GlassProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`glass-progress ${className}`}>
      <div
        className="glass-progress-bar"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}
