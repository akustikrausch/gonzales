import { Play, Loader2 } from "lucide-react";
import { useStatus, useTriggerSpeedtest } from "../../hooks/useApi";
import { StatusBadge } from "../common/StatusBadge";

export function Header() {
  const { data: status } = useStatus();
  const trigger = useTriggerSpeedtest();

  const isRunning = trigger.isPending || status?.scheduler.test_in_progress;

  return (
    <header className="h-14 bg-white border-b border-[#E5E5EA] flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        {status && (
          <>
            <StatusBadge
              active={status.scheduler.running}
              label={status.scheduler.running ? "Scheduler Active" : "Scheduler Stopped"}
            />
            {status.scheduler.test_in_progress && (
              <span className="text-xs text-[#007AFF] font-medium animate-pulse">
                Test running...
              </span>
            )}
          </>
        )}
      </div>
      <button
        onClick={() => trigger.mutate()}
        disabled={!!isRunning}
        className="flex items-center gap-2 px-4 py-1.5 bg-[#007AFF] text-white text-sm font-medium rounded-lg
                   hover:bg-[#0066D6] disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors"
      >
        {isRunning ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Play className="w-4 h-4" />
        )}
        {trigger.isPending ? "Testing..." : "Run Test"}
      </button>
    </header>
  );
}
