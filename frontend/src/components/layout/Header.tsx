import { Play, Loader2, Sun, Moon, Monitor, Clock, Pause } from "lucide-react";
import { useStatus, useSetSchedulerEnabled } from "../../hooks/useApi";
import { useTheme } from "../../hooks/useTheme";
import { useSpeedTest } from "../../context/SpeedTestContext";
import { GlassBadge } from "../ui/GlassBadge";
import { GlassButton } from "../ui/GlassButton";

const themeIcons = {
  auto: Monitor,
  light: Sun,
  dark: Moon,
} as const;

function formatNextRun(nextRunTime: string | null): string | null {
  if (!nextRunTime) return null;
  const next = new Date(nextRunTime);
  const now = new Date();
  const diffMs = next.getTime() - now.getTime();

  if (diffMs < 0) return null;

  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "< 1 min";
  if (diffMin < 60) return `${diffMin} min`;

  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

const themeOrder: Array<"auto" | "light" | "dark"> = ["auto", "light", "dark"];

export function Header() {
  const { data: status } = useStatus();
  const { runTest, isStreaming, progress } = useSpeedTest();
  const { theme, setTheme } = useTheme();
  const { mutate: setSchedulerEnabled, isPending: isTogglingScheduler } = useSetSchedulerEnabled();

  const isRunning = isStreaming || status?.scheduler.test_in_progress ||
    (progress.phase !== "idle" && progress.phase !== "complete" && progress.phase !== "error");
  const ThemeIcon = themeIcons[theme];

  const cycleTheme = () => {
    const idx = themeOrder.indexOf(theme);
    setTheme(themeOrder[(idx + 1) % themeOrder.length]);
  };

  const toggleScheduler = () => {
    if (status && !isTogglingScheduler) {
      setSchedulerEnabled(!status.scheduler.enabled);
    }
  };

  const getSchedulerStatus = () => {
    if (!status) return { color: "var(--g-text-secondary)", text: "Loading...", enabled: false };
    if (status.scheduler.paused) {
      return { color: "var(--g-yellow)", text: "Scheduler Paused", enabled: false };
    }
    if (status.scheduler.running) {
      return { color: "var(--g-green)", text: "Scheduler Active", enabled: true };
    }
    return { color: "var(--g-red)", text: "Scheduler Stopped", enabled: false };
  };

  const schedulerStatus = getSchedulerStatus();

  return (
    <header
      className="glass-header flex items-center justify-between"
      role="banner"
      style={{
        height: "var(--g-header-height)",
        padding: "0 var(--g-space-6)",
      }}
    >
      <div className="flex items-center gap-3" role="status" aria-live="polite">
        {status && (
          <>
            <button
              onClick={toggleScheduler}
              disabled={isTogglingScheduler}
              className="glass-badge-button"
              title={schedulerStatus.enabled ? "Click to pause scheduler" : "Click to resume scheduler"}
              aria-label={schedulerStatus.enabled ? "Pause automatic speed tests" : "Resume automatic speed tests"}
            >
              <GlassBadge color={schedulerStatus.color}>
                {status.scheduler.paused ? (
                  <Pause className="w-3 h-3" aria-hidden="true" />
                ) : (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    aria-hidden="true"
                    style={{ background: schedulerStatus.color }}
                  />
                )}
                {isTogglingScheduler ? "Updating..." : schedulerStatus.text}
              </GlassBadge>
            </button>
            {schedulerStatus.enabled && !status.scheduler.test_in_progress && formatNextRun(status.scheduler.next_run_time) && (
              <span
                className="flex items-center gap-1 text-xs"
                style={{ color: "var(--g-text-secondary)" }}
                title={`Next test in ${formatNextRun(status.scheduler.next_run_time)}`}
              >
                <Clock className="w-3 h-3" aria-hidden="true" />
                {formatNextRun(status.scheduler.next_run_time)}
              </span>
            )}
            {status.scheduler.test_in_progress && (
              <span
                className="text-xs font-medium animate-pulse"
                style={{ color: "var(--g-blue)" }}
                role="status"
                aria-live="assertive"
              >
                Test running...
              </span>
            )}
          </>
        )}
      </div>
      <div className="flex items-center gap-2" role="toolbar" aria-label="Quick actions">
        <GlassButton
          onClick={cycleTheme}
          size="sm"
          title={`Theme: ${theme}`}
          aria-label={`Change theme, current: ${theme}`}
        >
          <ThemeIcon className="w-4 h-4" aria-hidden="true" />
        </GlassButton>
        <GlassButton
          variant="primary"
          onClick={runTest}
          disabled={!!isRunning}
          aria-label={isRunning ? "Speed test in progress" : "Run speed test now"}
        >
          {isRunning ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Play className="w-4 h-4" aria-hidden="true" />
          )}
          {isRunning ? "Testing..." : "Run Test"}
        </GlassButton>
      </div>
    </header>
  );
}
