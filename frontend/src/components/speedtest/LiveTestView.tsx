import { Activity, ArrowDown, ArrowUp, Wifi } from "lucide-react";
import type { SSEProgress } from "../../hooks/useSSE";
import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";
import { SpeedNeedle } from "./SpeedNeedle";
import { ProgressRing } from "./ProgressRing";
import { GlassCard } from "../ui/GlassCard";
import { GlassBadge } from "../ui/GlassBadge";

interface LiveTestViewProps {
  progress: SSEProgress;
}

const phaseLabels: Record<string, string> = {
  idle: "Waiting...",
  started: "Initializing...",
  ping: "Measuring Latency",
  download: "Testing Download",
  upload: "Testing Upload",
  complete: "Test Complete",
  error: "Test Failed",
};

const phaseColors: Record<string, string> = {
  idle: "var(--g-text-secondary)",
  started: "var(--g-teal)",
  ping: "var(--g-orange)",
  download: "var(--g-blue)",
  upload: "var(--g-green)",
  complete: "var(--g-green)",
  error: "var(--g-red)",
};

const phaseIcons: Record<string, typeof Activity> = {
  idle: Wifi,
  started: Activity,
  ping: Activity,
  download: ArrowDown,
  upload: ArrowUp,
  complete: Activity,
  error: Activity,
};

function DataStreamLines({ color, count = 12 }: { color: string; count?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.07]">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="absolute h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            top: `${8 + (i / count) * 84}%`,
            left: 0,
            right: 0,
            animation: `g-shimmer ${2 + (i % 3) * 0.5}s ease-in-out ${i * 0.15}s infinite`,
            backgroundSize: "200% 100%",
          }}
        />
      ))}
    </div>
  );
}

function ResultCard({
  label,
  value,
  unit,
  color,
  delay,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  delay: number;
}) {
  const animated = useAnimatedNumber(value, 800);
  return (
    <div
      className="flex flex-col items-center g-animate-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <GlassCard padding="md" depth="elevated" className="w-full text-center">
        <span
          className="text-3xl font-bold tabular-nums block"
          style={{ color, textShadow: `0 0 16px ${color}30` }}
        >
          {animated.toFixed(1)}
        </span>
        <span className="text-xs block mt-1" style={{ color: "var(--g-text-secondary)" }}>
          {unit}
        </span>
        <span
          className="text-xs font-medium block mt-1 uppercase tracking-wider"
          style={{ color: "var(--g-text-tertiary)" }}
        >
          {label}
        </span>
      </GlassCard>
    </div>
  );
}

export function LiveTestView({ progress }: LiveTestViewProps) {
  const phase = progress.phase;
  const color = phaseColors[phase] || "var(--g-blue)";
  const Icon = phaseIcons[phase] || Activity;
  const isActive = phase !== "idle" && phase !== "complete" && phase !== "error";

  return (
    <GlassCard padding="none" depth="elevated" className="relative overflow-hidden">
      {/* Data stream background animation */}
      {isActive && <DataStreamLines color={color} />}

      <div className="relative z-10 flex flex-col items-center gap-6 py-10 px-6">
        {/* Phase badge */}
        <GlassBadge color={color}>
          {isActive && (
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: color,
                boxShadow: `0 0 8px ${color}`,
                animation: "g-breathe 1.5s ease-in-out infinite",
              }}
            />
          )}
          <Icon className="w-3.5 h-3.5" />
          {phaseLabels[phase] || phase}
        </GlassBadge>

        {/* Initializing state */}
        {phase === "started" && (
          <div className="flex flex-col items-center gap-4 g-animate-scale">
            <ProgressRing value={30} max={100} size={120} strokeWidth={4} color="var(--g-teal)" glow>
              <Activity
                className="w-8 h-8"
                style={{ color: "var(--g-teal)", animation: "g-breathe 2s ease-in-out infinite" }}
              />
            </ProgressRing>
            <p className="text-xs" style={{ color: "var(--g-text-tertiary)" }}>
              Connecting to server...
            </p>
          </div>
        )}

        {/* Ping phase */}
        {phase === "ping" && (
          <div className="flex flex-col items-center gap-3 g-animate-scale">
            <ProgressRing
              value={(progress.progress || 0) * 100}
              max={100}
              size={140}
              strokeWidth={6}
              color="var(--g-orange)"
              glow
            >
              <div className="text-center">
                <span
                  className="text-3xl font-bold tabular-nums"
                  style={{ color: "var(--g-orange)", textShadow: "0 0 16px rgba(255, 149, 0, 0.3)" }}
                >
                  {(progress.ping_ms || 0).toFixed(1)}
                </span>
                <span className="text-xs block" style={{ color: "var(--g-text-secondary)" }}>ms</span>
              </div>
            </ProgressRing>
          </div>
        )}

        {/* Download phase */}
        {phase === "download" && (
          <div className="flex flex-col items-center gap-4 g-animate-scale">
            <SpeedNeedle
              value={progress.bandwidth_mbps || 0}
              label="Download"
              color="var(--g-blue)"
              glowColor="#007AFF"
            />
          </div>
        )}

        {/* Upload phase */}
        {phase === "upload" && (
          <div className="flex flex-col items-center gap-4 g-animate-scale">
            <SpeedNeedle
              value={progress.bandwidth_mbps || 0}
              label="Upload"
              color="var(--g-green)"
              glowColor="#34C759"
            />
          </div>
        )}

        {/* Complete -- results reveal */}
        {phase === "complete" && (
          <div className="grid grid-cols-3 gap-4 w-full max-w-md">
            <ResultCard
              label="Download"
              value={progress.download_mbps || 0}
              unit="Mbps"
              color="var(--g-blue)"
              delay={0}
            />
            <ResultCard
              label="Upload"
              value={progress.upload_mbps || 0}
              unit="Mbps"
              color="var(--g-green)"
              delay={100}
            />
            <ResultCard
              label="Ping"
              value={progress.ping_ms || 0}
              unit="ms"
              color="var(--g-orange)"
              delay={200}
            />
          </div>
        )}

        {/* Error state */}
        {phase === "error" && (
          <div className="text-center g-animate-in">
            <p className="text-sm" style={{ color: "var(--g-red)" }}>
              {progress.message || "An error occurred"}
            </p>
          </div>
        )}

        {/* Progress bar for download/upload */}
        {(phase === "download" || phase === "upload") && progress.progress !== undefined && (
          <div className="w-full max-w-xs">
            <div className="glass-progress" style={{ height: 6 }}>
              <div
                className="glass-progress-bar"
                style={{
                  width: `${Math.min(100, (progress.progress || 0) * 100)}%`,
                  backgroundColor: color,
                  boxShadow: `0 0 8px ${color}60`,
                }}
              />
            </div>
            <p className="text-[10px] text-center mt-2 tabular-nums" style={{ color: "var(--g-text-tertiary)" }}>
              {Math.round((progress.progress || 0) * 100)}%
            </p>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
