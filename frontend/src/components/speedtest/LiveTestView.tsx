import { useEffect, useRef } from "react";
import { Activity, ArrowDown, ArrowUp, Wifi } from "lucide-react";
import type { SSEProgress } from "../../hooks/useSSE";
import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";
import { useSpeedHistory } from "../../hooks/useSpeedHistory";
import { SpeedNeedle } from "./SpeedNeedle";
import { ProgressRing } from "./ProgressRing";
import { DataFlowCanvas } from "./DataFlowCanvas";
import { LiveSpeedGraph } from "./LiveSpeedGraph";
import { ElapsedTimer } from "./ElapsedTimer";
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

const phaseGlowColors: Record<string, string> = {
  download: "#007AFF",
  upload: "#34C759",
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
  const isTransferring = phase === "download" || phase === "upload";

  const speedHistory = useSpeedHistory();
  const prevPhaseRef = useRef(phase);

  // Reset history on phase change, push samples during transfer
  useEffect(() => {
    if (prevPhaseRef.current !== phase) {
      if (phase === "download" || phase === "upload") {
        speedHistory.reset();
      }
      prevPhaseRef.current = phase;
    }

    if (isTransferring && progress.bandwidth_mbps !== undefined && progress.elapsed !== undefined) {
      speedHistory.push(progress.bandwidth_mbps, progress.elapsed);
    }
  }, [phase, progress.bandwidth_mbps, progress.elapsed, isTransferring, speedHistory]);

  return (
    <GlassCard padding="none" depth="elevated" className="relative overflow-hidden">
      {/* Particle background for active phases */}
      {isTransferring && (
        <DataFlowCanvas
          direction={phase as "download" | "upload"}
          bandwidth={progress.bandwidth_mbps || 0}
          color={phaseGlowColors[phase] || color}
        />
      )}
      {/* Sparse slow particles during started phase */}
      {phase === "started" && (
        <DataFlowCanvas
          direction="download"
          bandwidth={5}
          color="var(--g-teal)"
        />
      )}

      <div className="relative z-10 flex flex-col items-center gap-5 py-8 px-6">
        {/* Phase header row: badge left, elapsed timer right */}
        <div className="flex items-center justify-between w-full max-w-md" key={phase}>
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
          {isActive && progress.elapsed !== undefined && (
            <ElapsedTimer elapsed={progress.elapsed} color={color} />
          )}
        </div>

        {/* Phase content with enter animation */}
        <div key={`content-${phase}`} className="w-full flex flex-col items-center gap-4 g-phase-enter">
          {/* Initializing state */}
          {phase === "started" && (
            <div className="flex flex-col items-center gap-4">
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
            <div className="flex flex-col items-center gap-3">
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
            <>
              <SpeedNeedle
                value={progress.bandwidth_mbps || 0}
                label="Download"
                color="var(--g-blue)"
                glowColor="#007AFF"
              />
              <LiveSpeedGraph
                samples={speedHistory.samples}
                peak={speedHistory.peak}
                color="var(--g-blue)"
                version={speedHistory.version}
              />
            </>
          )}

          {/* Upload phase */}
          {phase === "upload" && (
            <>
              <SpeedNeedle
                value={progress.bandwidth_mbps || 0}
                label="Upload"
                color="var(--g-green)"
                glowColor="#34C759"
              />
              <LiveSpeedGraph
                samples={speedHistory.samples}
                peak={speedHistory.peak}
                color="var(--g-green)"
                version={speedHistory.version}
              />
            </>
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
        </div>

        {/* Progress bar for download/upload */}
        {isTransferring && progress.progress !== undefined && (
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
