import { Play, Loader2, Sun, Moon, Monitor, Clock } from "lucide-react";
import { useStatus } from "../../hooks/useApi";
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

  const isRunning = isStreaming || status?.scheduler.test_in_progress ||
    (progress.phase !== "idle" && progress.phase !== "complete" && progress.phase !== "error");
  const ThemeIcon = themeIcons[theme];

  const cycleTheme = () => {
    const idx = themeOrder.indexOf(theme);
    setTheme(themeOrder[(idx + 1) % themeOrder.length]);
  };

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
            <GlassBadge color={status.scheduler.running ? "var(--g-green)" : "var(--g-red)"}>
              <span
                className="w-1.5 h-1.5 rounded-full"
                aria-hidden="true"
                style={{
                  background: status.scheduler.running ? "var(--g-green)" : "var(--g-red)",
                }}
              />
              {status.scheduler.running ? "Scheduler Active" : "Scheduler Stopped"}
            </GlassBadge>
            {status.scheduler.running && !status.scheduler.test_in_progress && formatNextRun(status.scheduler.next_run_time) && (
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
