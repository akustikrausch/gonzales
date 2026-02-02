import { useEffect, useRef, useState } from "react";
import { Activity, ArrowDown, ArrowUp, Wifi, Zap, AlertCircle, CheckCircle2 } from "lucide-react";
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
  idle: "Ready",
  started: "Initializing",
  ping: "Measuring Latency",
  download: "Download",
  upload: "Upload",
  complete: "Complete",
  error: "Failed",
};

const phaseColors: Record<string, string> = {
  idle: "var(--g-text-secondary)",
  started: "var(--g-teal)",
  ping: "var(--g-orange)",
  download: "var(--g-blue)",
  upload: "var(--g-green)",
  complete: "var(--g-blue)",
  error: "var(--g-red)",
};

const phaseGlowColors: Record<string, string> = {
  download: "#007AFF",
  upload: "#34C759",
};

const phaseIcons: Record<string, typeof Activity> = {
  idle: Wifi,
  started: Zap,
  ping: Activity,
  download: ArrowDown,
  upload: ArrowUp,
  complete: CheckCircle2,
  error: AlertCircle,
};

/* ---------- Result card shown on completion ---------- */
function ResultCard({
  label,
  value,
  unit,
  color,
  icon: Icon,
  delay,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  icon: typeof Activity;
  delay: number;
}) {
  const animated = useAnimatedNumber(value, 900);
  return (
    <div className="g-animate-in" style={{ animationDelay: `${delay}ms` }}>
      <GlassCard padding="md" depth="elevated" className="text-center relative overflow-hidden">
        {/* Colored accent line at top */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{ height: 3, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        />
        <Icon
          className="w-4 h-4 mx-auto mb-2"
          style={{ color, opacity: 0.7 }}
        />
        <span
          className="text-3xl font-bold tabular-nums block g-number-glow-pulse"
          style={{
            color,
            "--glow-color": `${color}40`,
          } as React.CSSProperties}
        >
          {animated.toFixed(1)}
        </span>
        <span className="text-[11px] block mt-0.5" style={{ color: "var(--g-text-secondary)" }}>
          {unit}
        </span>
        <span
          className="text-[10px] font-semibold block mt-1.5 uppercase tracking-widest"
          style={{ color: "var(--g-text-tertiary)" }}
        >
          {label}
        </span>
      </GlassCard>
    </div>
  );
}

/* ---------- Mini stat pill shown during transfer phases ---------- */
function MiniStat({
  icon: Icon,
  value,
  unit,
  color,
}: {
  icon: typeof Activity;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs tabular-nums"
      style={{ color: "var(--g-text-secondary)" }}
    >
      <Icon className="w-3 h-3" style={{ color, opacity: 0.8 }} />
      <span style={{ color }}>{value}</span>
      <span className="text-[10px]">{unit}</span>
    </span>
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

  // Persist ping result across phases
  const [stickyPing, setStickyPing] = useState<number | null>(null);
  // Persist download result for upload phase
  const [stickyDownload, setStickyDownload] = useState<number | null>(null);

  useEffect(() => {
    if (phase === "ping" && progress.ping_ms) {
      setStickyPing(progress.ping_ms);
    }
    if (phase === "download" && progress.bandwidth_mbps) {
      setStickyDownload(progress.bandwidth_mbps);
    }
    // Reset sticky values when idle
    if (phase === "idle") {
      setStickyPing(null);
      setStickyDownload(null);
    }
  }, [phase, progress.ping_ms, progress.bandwidth_mbps]);

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
      {phase === "started" && (
        <DataFlowCanvas
          direction="download"
          bandwidth={5}
          color="var(--g-teal)"
        />
      )}

      <div className="relative z-10 flex flex-col items-center gap-5 py-8 px-6">
        {/* Phase header row */}
        <div className="flex items-center justify-between w-full max-w-md" key={phase}>
          <GlassBadge color={color}>
            {isActive && (
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
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
          <div className="flex items-center gap-3">
            {/* Show sticky stats from previous phases */}
            {phase === "download" && stickyPing !== null && (
              <MiniStat icon={Activity} value={stickyPing.toFixed(0)} unit="ms" color="var(--g-orange)" />
            )}
            {phase === "upload" && (
              <>
                {stickyPing !== null && (
                  <MiniStat icon={Activity} value={stickyPing.toFixed(0)} unit="ms" color="var(--g-orange)" />
                )}
                {stickyDownload !== null && (
                  <MiniStat icon={ArrowDown} value={stickyDownload.toFixed(0)} unit="Mbps" color="var(--g-blue)" />
                )}
              </>
            )}
            {isActive && progress.elapsed !== undefined && (
              <ElapsedTimer elapsed={progress.elapsed} color={color} />
            )}
          </div>
        </div>

        {/* Phase content with enter animation */}
        <div key={`content-${phase}`} className="w-full flex flex-col items-center gap-4 g-phase-enter">
          {/* Initializing state */}
          {phase === "started" && (
            <div className="flex flex-col items-center gap-5 py-4">
              <ProgressRing value={30} max={100} size={130} strokeWidth={5} color="var(--g-teal)" glow>
                <Zap
                  className="w-9 h-9"
                  style={{ color: "var(--g-teal)", animation: "g-breathe 2s ease-in-out infinite" }}
                />
              </ProgressRing>
              <p className="text-sm font-medium" style={{ color: "var(--g-text-secondary)" }}>
                Connecting to server...
              </p>
            </div>
          )}

          {/* Ping phase */}
          {phase === "ping" && (
            <div className="flex flex-col items-center gap-4 py-2">
              <ProgressRing
                value={(progress.progress || 0) * 100}
                max={100}
                size={160}
                strokeWidth={6}
                color="var(--g-orange)"
                glow
              >
                <div className="text-center">
                  <span
                    className="text-4xl font-bold tabular-nums g-number-glow-pulse"
                    style={{
                      color: "var(--g-orange)",
                      "--glow-color": "rgba(255, 149, 0, 0.4)",
                    } as React.CSSProperties}
                  >
                    {(progress.ping_ms || 0).toFixed(1)}
                  </span>
                  <span className="text-xs block mt-0.5" style={{ color: "var(--g-text-secondary)" }}>ms</span>
                </div>
              </ProgressRing>
            </div>
          )}

          {/* Download phase */}
          {phase === "download" && (
            <div className="w-full flex flex-col items-center gap-3">
              <SpeedNeedle
                value={progress.bandwidth_mbps || 0}
                label="Download"
                color="var(--g-blue)"
                glowColor="#007AFF"
              />
              <div className="w-full max-w-xs">
                <div
                  className="border-t pt-2"
                  style={{ borderColor: "var(--g-border)" }}
                >
                  <LiveSpeedGraph
                    samples={speedHistory.samples}
                    peak={speedHistory.peak}
                    color="var(--g-blue)"
                    version={speedHistory.version}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Upload phase */}
          {phase === "upload" && (
            <div className="w-full flex flex-col items-center gap-3">
              <SpeedNeedle
                value={progress.bandwidth_mbps || 0}
                label="Upload"
                color="var(--g-green)"
                glowColor="#34C759"
              />
              <div className="w-full max-w-xs">
                <div
                  className="border-t pt-2"
                  style={{ borderColor: "var(--g-border)" }}
                >
                  <LiveSpeedGraph
                    samples={speedHistory.samples}
                    peak={speedHistory.peak}
                    color="var(--g-green)"
                    version={speedHistory.version}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Complete -- results reveal */}
          {phase === "complete" && (
            <div className="w-full max-w-md py-2">
              <div className="grid grid-cols-3 gap-3">
                <ResultCard
                  label="Download"
                  value={progress.download_mbps || 0}
                  unit="Mbps"
                  color="var(--g-blue)"
                  icon={ArrowDown}
                  delay={0}
                />
                <ResultCard
                  label="Upload"
                  value={progress.upload_mbps || 0}
                  unit="Mbps"
                  color="var(--g-green)"
                  icon={ArrowUp}
                  delay={120}
                />
                <ResultCard
                  label="Ping"
                  value={progress.ping_ms || 0}
                  unit="ms"
                  color="var(--g-orange)"
                  icon={Activity}
                  delay={240}
                />
              </div>
            </div>
          )}

          {/* Error state */}
          {phase === "error" && (
            <div className="text-center g-animate-in py-4">
              <AlertCircle className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--g-red)", opacity: 0.8 }} />
              <p className="text-sm font-medium" style={{ color: "var(--g-red)" }}>
                {progress.message || "An error occurred"}
              </p>
            </div>
          )}
        </div>

        {/* Progress bar for download/upload */}
        {isTransferring && progress.progress !== undefined && (
          <div className="w-full max-w-xs">
            <div className="glass-progress" style={{ height: 5 }}>
              <div
                className="glass-progress-bar"
                style={{
                  width: `${Math.min(100, (progress.progress || 0) * 100)}%`,
                  background: `linear-gradient(90deg, ${color}90, ${color})`,
                  boxShadow: `0 0 12px ${color}50`,
                  transition: "width 0.3s ease-out",
                }}
              />
            </div>
            <p className="text-[10px] text-center mt-1.5 tabular-nums font-medium" style={{ color: "var(--g-text-tertiary)" }}>
              {Math.round((progress.progress || 0) * 100)}%
            </p>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
