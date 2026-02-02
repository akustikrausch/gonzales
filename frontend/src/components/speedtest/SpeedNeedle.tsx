interface SpeedNeedleProps {
  value: number;
  max?: number;
  label?: string;
  color?: string;
  unit?: string;
}

export function SpeedNeedle({
  value,
  max = 1000,
  label = "Speed",
  color = "var(--g-blue)",
  unit = "Mbps",
}: SpeedNeedleProps) {
  const clamped = Math.min(value, max);
  const angle = -135 + (clamped / max) * 270;
  const r = 80;
  const cx = 100;
  const cy = 100;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((pct) => {
    const a = (-135 + pct * 270) * (Math.PI / 180);
    return {
      x1: cx + (r - 8) * Math.cos(a),
      y1: cy + (r - 8) * Math.sin(a),
      x2: cx + r * Math.cos(a),
      y2: cy + r * Math.sin(a),
      label: Math.round(pct * max),
    };
  });

  const arcStart = -135 * (Math.PI / 180);
  const arcEnd = (angle) * (Math.PI / 180);
  const startX = cx + r * Math.cos(arcStart);
  const startY = cy + r * Math.sin(arcStart);
  const endX = cx + r * Math.cos(arcEnd);
  const endY = cy + r * Math.sin(arcEnd);
  const largeArc = angle - (-135) > 180 ? 1 : 0;

  const needleA = angle * (Math.PI / 180);
  const needleX = cx + (r - 16) * Math.cos(needleA);
  const needleY = cy + (r - 16) * Math.sin(needleA);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 140" className="w-full max-w-[280px]">
        {/* Track */}
        <path
          d={`M ${cx + r * Math.cos(arcStart)} ${cy + r * Math.sin(arcStart)} A ${r} ${r} 0 1 1 ${cx + r * Math.cos(135 * Math.PI / 180)} ${cy + r * Math.sin(135 * Math.PI / 180)}`}
          fill="none"
          stroke="var(--g-border)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Active arc */}
        {value > 0 && (
          <path
            d={`M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            style={{ transition: "d 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          />
        )}
        {/* Ticks */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke="var(--g-text-tertiary)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <text
              x={t.x1 + (t.x1 - cx) * 0.15}
              y={t.y1 + (t.y1 - cy) * 0.15}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--g-text-secondary)"
              fontSize="8"
            >
              {t.label}
            </text>
          </g>
        ))}
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        />
        <circle cx={cx} cy={cy} r="4" fill={color} />
      </svg>
      <div className="text-center -mt-2">
        <span
          className="text-4xl font-bold tabular-nums"
          style={{ color }}
        >
          {value.toFixed(1)}
        </span>
        <span className="text-sm ml-1" style={{ color: "var(--g-text-secondary)" }}>
          {unit}
        </span>
      </div>
      <span className="text-xs mt-1" style={{ color: "var(--g-text-secondary)" }}>
        {label}
      </span>
    </div>
  );
}
