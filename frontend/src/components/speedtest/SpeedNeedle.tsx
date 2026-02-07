import { useId } from "react";
import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";

interface SpeedNeedleProps {
  value: number;
  max?: number;
  label?: string;
  color?: string;
  unit?: string;
  glowColor?: string;
}

export function SpeedNeedle({
  value,
  max = 1000,
  label = "Speed",
  color = "var(--g-blue)",
  unit = "Mbps",
  glowColor,
}: SpeedNeedleProps) {
  const uid = useId();
  const needleGlowId = `needleGlow${uid}`;
  const arcGlowId = `arcGlow${uid}`;
  const tipPulseId = `tipPulse${uid}`;
  const arcGradientId = `arcGradient${uid}`;

  const animated = useAnimatedNumber(value, 400);
  const clamped = Math.min(animated, max);
  // Map value to 240° arc (-210° to 30°) for a bottom-centered gauge
  const startAngle = -210;
  const sweep = 240;
  const angle = startAngle + (clamped / max) * sweep;
  const r = 80;
  const cx = 100;
  const cy = 105;
  const glow = glowColor || color;

  // Generate more ticks for futuristic look
  const majorTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => {
    const a = (startAngle + pct * sweep) * (Math.PI / 180);
    return {
      x1: cx + (r - 10) * Math.cos(a),
      y1: cy + (r - 10) * Math.sin(a),
      x2: cx + r * Math.cos(a),
      y2: cy + r * Math.sin(a),
      label: Math.round(pct * max),
      lx: cx + (r - 18) * Math.cos(a),
      ly: cy + (r - 18) * Math.sin(a),
    };
  });

  const minorTicks = Array.from({ length: 21 }, (_, i) => {
    const pct = i / 20;
    const a = (startAngle + pct * sweep) * (Math.PI / 180);
    return {
      x1: cx + (r - 4) * Math.cos(a),
      y1: cy + (r - 4) * Math.sin(a),
      x2: cx + r * Math.cos(a),
      y2: cy + r * Math.sin(a),
      active: pct <= clamped / max,
    };
  });

  const arcStart = startAngle * (Math.PI / 180);
  const arcEnd = angle * (Math.PI / 180);
  const startX = cx + r * Math.cos(arcStart);
  const startY = cy + r * Math.sin(arcStart);
  const endX = cx + r * Math.cos(arcEnd);
  const endY = cy + r * Math.sin(arcEnd);
  const largeArc = angle - startAngle > 180 ? 1 : 0;

  const needleA = angle * (Math.PI / 180);
  const needleX = cx + (r - 18) * Math.cos(needleA);
  const needleY = cy + (r - 18) * Math.sin(needleA);

  // Needle tip for glow dot
  const tipX = cx + (r - 20) * Math.cos(needleA);
  const tipY = cy + (r - 20) * Math.sin(needleA);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 155" className="w-full max-w-[260px]">
        <defs>
          {/* Glow filter for needle */}
          <filter id={needleGlowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor={glow} floodOpacity="0.6" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Glow for arc */}
          <filter id={arcGlowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feFlood floodColor={glow} floodOpacity="0.4" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Tip pulse */}
          <filter id={tipPulseId} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          {/* Gradient for arc */}
          <linearGradient id={arcGradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Background track with subtle pulse */}
        <path
          d={`M ${cx + r * Math.cos(arcStart)} ${cy + r * Math.sin(arcStart)} A ${r} ${r} 0 1 1 ${cx + r * Math.cos((startAngle + sweep) * Math.PI / 180)} ${cy + r * Math.sin((startAngle + sweep) * Math.PI / 180)}`}
          fill="none"
          stroke="var(--g-border)"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.5"
        />
        {/* Pulsing glow on outer arc */}
        {animated > 0 && (
          <path
            d={`M ${cx + r * Math.cos(arcStart)} ${cy + r * Math.sin(arcStart)} A ${r} ${r} 0 1 1 ${cx + r * Math.cos((startAngle + sweep) * Math.PI / 180)} ${cy + r * Math.sin((startAngle + sweep) * Math.PI / 180)}`}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            filter={`url(#${arcGlowId})`}
          >
            <animate
              attributeName="opacity"
              values="0.05;0.15;0.05"
              dur="3s"
              repeatCount="indefinite"
            />
          </path>
        )}

        {/* Minor ticks */}
        {minorTicks.map((t, i) => (
          <line
            key={`minor-${i}`}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.active ? color : "var(--g-border)"}
            strokeWidth="1"
            strokeLinecap="round"
            opacity={t.active ? 0.8 : 0.3}
          />
        ))}

        {/* Active arc with glow */}
        {animated > 0 && (
          <path
            d={`M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`}
            fill="none"
            stroke={`url(#${arcGradientId})`}
            strokeWidth="6"
            strokeLinecap="round"
            filter={`url(#${arcGlowId})`}
          />
        )}

        {/* Major tick labels */}
        {majorTicks.map((t, i) => (
          <g key={`major-${i}`}>
            <line
              x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke="var(--g-text-tertiary)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <text
              x={t.lx}
              y={t.ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--g-text-secondary)"
              fontSize="7"
              fontWeight="500"
            >
              {t.label}
            </text>
          </g>
        ))}

        {/* Needle with glow */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          filter={`url(#${needleGlowId})`}
        />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r="5" fill={color} opacity="0.9" />
        <circle cx={cx} cy={cy} r="3" fill="var(--g-bg)" />

        {/* Pulsing tip glow */}
        {animated > 0 && (
          <circle
            cx={tipX}
            cy={tipY}
            r="6"
            fill={color}
            filter={`url(#${tipPulseId})`}
            opacity="0.5"
          >
            <animate
              attributeName="opacity"
              values="0.3;0.7;0.3"
              dur="1.5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="r"
              values="4;8;4"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
        )}
      </svg>
      <div className="text-center -mt-2">
        <span
          className="text-4xl font-bold tabular-nums g-number-glow-pulse"
          style={{
            color,
            "--glow-color": `${glow}60`,
            textShadow: `0 0 20px ${glow}40, 0 0 40px ${glow}20`,
          } as React.CSSProperties}
        >
          {animated.toFixed(1)}
        </span>
        <span className="text-sm ml-1" style={{ color: "var(--g-text-secondary)" }}>
          {unit}
        </span>
      </div>
      <span className="text-xs mt-1 font-medium uppercase tracking-wider" style={{ color: "var(--g-text-tertiary)" }}>
        {label}
      </span>
    </div>
  );
}
