import { Play, Loader2, Sun, Moon, Monitor } from "lucide-react";
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
      style={{
        height: "var(--g-header-height)",
        padding: "0 var(--g-space-6)",
      }}
    >
      <div className="flex items-center gap-3">
        {status && (
          <>
            <GlassBadge color={status.scheduler.running ? "var(--g-green)" : "var(--g-red)"}>
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: status.scheduler.running ? "var(--g-green)" : "var(--g-red)",
                }}
              />
              {status.scheduler.running ? "Scheduler Active" : "Scheduler Stopped"}
            </GlassBadge>
            {status.scheduler.test_in_progress && (
              <span
                className="text-xs font-medium animate-pulse"
                style={{ color: "var(--g-blue)" }}
              >
                Test running...
              </span>
            )}
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <GlassButton onClick={cycleTheme} size="sm" title={`Theme: ${theme}`}>
          <ThemeIcon className="w-4 h-4" />
        </GlassButton>
        <GlassButton
          variant="primary"
          onClick={runTest}
          disabled={!!isRunning}
        >
          {isRunning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {isRunning ? "Testing..." : "Run Test"}
        </GlassButton>
      </div>
    </header>
  );
}
