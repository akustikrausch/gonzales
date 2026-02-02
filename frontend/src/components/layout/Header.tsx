import { useStatus, useTriggerSpeedtest } from "../../hooks/useApi";
import { StatusBadge } from "../common/StatusBadge";

export function Header() {
  const { data: status } = useStatus();
  const trigger = useTriggerSpeedtest();

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
        disabled={trigger.isPending || status?.scheduler.test_in_progress}
        className="px-4 py-1.5 bg-[#007AFF] text-white text-sm font-medium rounded-lg
                   hover:bg-[#0066D6] disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors"
      >
        {trigger.isPending ? "Testing..." : "Run Test"}
      </button>
    </header>
  );
}
