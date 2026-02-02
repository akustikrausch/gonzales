import type { SSEProgress } from "../../hooks/useSSE";
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
  ping: "Measuring latency...",
  download: "Testing download...",
  upload: "Testing upload...",
  complete: "Test complete",
  error: "Test failed",
};

const phaseColors: Record<string, string> = {
  idle: "var(--g-text-secondary)",
  started: "var(--g-blue)",
  ping: "var(--g-orange)",
  download: "var(--g-blue)",
  upload: "var(--g-green)",
  complete: "var(--g-green)",
  error: "var(--g-red)",
};

export function LiveTestView({ progress }: LiveTestViewProps) {
  const phase = progress.phase;
  const color = phaseColors[phase] || "var(--g-blue)";

  return (
    <GlassCard padding="lg" className="g-animate-scale">
      <div className="flex flex-col items-center gap-6">
        <GlassBadge color={color}>
          {phase !== "idle" && (
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: color }}
            />
          )}
          {phaseLabels[phase] || phase}
        </GlassBadge>

        {(phase === "download" || phase === "upload") && (
          <SpeedNeedle
            value={progress.bandwidth_mbps || 0}
            label={phase === "download" ? "Download" : "Upload"}
            color={phase === "download" ? "var(--g-blue)" : "var(--g-green)"}
          />
        )}

        {phase === "ping" && (
          <div className="flex flex-col items-center gap-2">
            <ProgressRing
              value={progress.progress || 0}
              max={1}
              size={120}
              strokeWidth={6}
              color="var(--g-orange)"
            >
              <div className="text-center">
                <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--g-orange)" }}>
                  {(progress.ping_ms || 0).toFixed(1)}
                </span>
                <span className="text-xs block" style={{ color: "var(--g-text-secondary)" }}>ms</span>
              </div>
            </ProgressRing>
          </div>
        )}

        {phase === "complete" && (
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <span className="text-3xl font-bold tabular-nums" style={{ color: "var(--g-blue)" }}>
                {(progress.download_mbps || 0).toFixed(1)}
              </span>
              <span className="text-xs block" style={{ color: "var(--g-text-secondary)" }}>Download Mbps</span>
            </div>
            <div>
              <span className="text-3xl font-bold tabular-nums" style={{ color: "var(--g-green)" }}>
                {(progress.upload_mbps || 0).toFixed(1)}
              </span>
              <span className="text-xs block" style={{ color: "var(--g-text-secondary)" }}>Upload Mbps</span>
            </div>
            <div>
              <span className="text-3xl font-bold tabular-nums" style={{ color: "var(--g-orange)" }}>
                {(progress.ping_ms || 0).toFixed(1)}
              </span>
              <span className="text-xs block" style={{ color: "var(--g-text-secondary)" }}>Ping ms</span>
            </div>
          </div>
        )}

        {phase === "error" && (
          <p className="text-sm" style={{ color: "var(--g-red)" }}>
            {progress.message || "An error occurred"}
          </p>
        )}

        {(phase === "download" || phase === "upload") && progress.progress !== undefined && (
          <div className="w-full max-w-xs">
            <div className="glass-progress">
              <div
                className="glass-progress-bar"
                style={{
                  width: `${Math.min(100, (progress.progress || 0) * 100)}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
