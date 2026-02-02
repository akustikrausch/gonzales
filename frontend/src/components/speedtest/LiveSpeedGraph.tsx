import type { SpeedSample } from "../../hooks/useSpeedHistory";

interface LiveSpeedGraphProps {
  samples: SpeedSample[];
  peak: number;
  color: string;
  /** Subscribe version to force re-renders */
  version: number;
}

export function LiveSpeedGraph({ samples, peak, color }: LiveSpeedGraphProps) {
  if (samples.length < 2) return null;

  const width = 320;
  const height = 80;
  const padX = 4;
  const padTop = 4;
  const padBottom = 4;
  const graphW = width - padX * 2;
  const graphH = height - padTop - padBottom;

  const maxY = Math.max(peak * 1.1, 10);
  const minTime = samples[0].time;
  const maxTime = samples[samples.length - 1].time;
  const timeRange = Math.max(maxTime - minTime, 1);

  const points = samples.map((s) => {
    const x = padX + ((s.time - minTime) / timeRange) * graphW;
    const y = padTop + graphH - (s.value / maxY) * graphH;
    return { x, y };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  const fillD =
    `M ${points[0].x},${padTop + graphH} ` +
    points.map((p) => `L ${p.x},${p.y}`).join(" ") +
    ` L ${points[points.length - 1].x},${padTop + graphH} Z`;

  const lastPoint = points[points.length - 1];
  const filterId = "speed-graph-glow";

  return (
    <div className="w-full max-w-xs mx-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height: 80 }}
        preserveAspectRatio="none"
      >
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feFlood floodColor={color} floodOpacity="0.5" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="graph-fill-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((pct) => {
          const y = padTop + graphH - pct * graphH;
          return (
            <line
              key={pct}
              x1={padX}
              y1={y}
              x2={width - padX}
              y2={y}
              stroke="var(--g-border)"
              strokeWidth="0.5"
              opacity="0.3"
            />
          );
        })}

        {/* Fill area */}
        <path d={fillD} fill="url(#graph-fill-grad)" />

        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          filter={`url(#${filterId})`}
        />

        {/* Pulsing dot at current reading */}
        <circle cx={lastPoint.x} cy={lastPoint.y} r="4" fill={color} opacity="0.9">
          <animate
            attributeName="r"
            values="3;5;3"
            dur="1.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.9;0.5;0.9"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
}
