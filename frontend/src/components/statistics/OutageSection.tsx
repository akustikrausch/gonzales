import { AlertTriangle, Clock, TrendingUp, Wifi, WifiOff } from "lucide-react";
import { useOutages, useOutageStatistics } from "../../hooks/useApi";
import type { OutageRecord } from "../../api/types";

interface OutageSectionProps {
  startDate?: string;
  endDate?: string;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === 0) return "-";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: typeof AlertTriangle;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
}) {
  return (
    <div
      className="glass-card p-4 flex items-center gap-4"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}15` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: "var(--g-text)" }}>
          {value}
        </p>
        <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
          {label}
        </p>
        {subValue && (
          <p className="text-[10px]" style={{ color: "var(--g-text-tertiary)" }}>
            {subValue}
          </p>
        )}
      </div>
    </div>
  );
}

function OutageTimeline({ outages }: { outages: OutageRecord[] }) {
  if (outages.length === 0) {
    return (
      <div
        className="glass-card p-8 text-center"
        style={{ color: "var(--g-text-secondary)" }}
      >
        <Wifi className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">No outages recorded</p>
        <p className="text-sm mt-1">Your connection has been stable</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-4">
      <h3
        className="text-sm font-semibold mb-4"
        style={{ color: "var(--g-text)" }}
      >
        Outage History
      </h3>
      <div className="space-y-3">
        {outages.map((outage) => (
          <div
            key={outage.id}
            className="flex items-start gap-3 p-3 rounded-lg"
            style={{
              background: outage.is_active
                ? "var(--g-red-tint)"
                : "var(--g-surface)",
              borderLeft: `3px solid ${outage.is_active ? "var(--g-red)" : "var(--g-orange)"}`,
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{
                background: outage.is_active ? "var(--g-red)" : "var(--g-orange)",
              }}
            >
              <WifiOff className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="font-medium text-sm"
                  style={{ color: "var(--g-text)" }}
                >
                  {outage.is_active ? "Active Outage" : "Resolved Outage"}
                </span>
                {outage.is_active && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: "var(--g-red)",
                      color: "white",
                    }}
                  >
                    ACTIVE
                  </span>
                )}
              </div>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--g-text-secondary)" }}
              >
                Started: {formatDate(outage.started_at)}
              </p>
              {outage.ended_at && (
                <p
                  className="text-xs"
                  style={{ color: "var(--g-text-secondary)" }}
                >
                  Ended: {formatDate(outage.ended_at)}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2">
                <span
                  className="text-xs flex items-center gap-1"
                  style={{ color: "var(--g-text-tertiary)" }}
                >
                  <Clock className="w-3 h-3" />
                  {formatDuration(outage.duration_seconds)}
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--g-text-tertiary)" }}
                >
                  {outage.failure_count} failed tests
                </span>
              </div>
              {outage.trigger_error && (
                <p
                  className="text-[10px] mt-2 truncate"
                  style={{ color: "var(--g-red)" }}
                  title={outage.trigger_error}
                >
                  {outage.trigger_error}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OutageSection({ startDate, endDate }: OutageSectionProps) {
  const dateParams = {
    start_date: startDate,
    end_date: endDate,
  };

  const { data: outageData } = useOutages(dateParams);
  const { data: stats } = useOutageStatistics(dateParams);

  const outages = outageData?.items ?? [];
  const activeOutage = outages.find((o) => o.is_active);

  return (
    <div className="space-y-4">
      {/* Active outage alert */}
      {activeOutage && (
        <div
          className="glass-card p-4 flex items-center gap-4"
          style={{
            background: "var(--g-red-tint)",
            border: "1px solid var(--g-red)",
          }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center animate-pulse"
            style={{ background: "var(--g-red)" }}
          >
            <WifiOff className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-lg" style={{ color: "var(--g-red)" }}>
              Outage In Progress
            </p>
            <p className="text-sm" style={{ color: "var(--g-text-secondary)" }}>
              Started {formatDate(activeOutage.started_at)} -{" "}
              {activeOutage.failure_count} consecutive failures
            </p>
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={AlertTriangle}
          label="Total Outages"
          value={stats?.total_outages ?? 0}
          color="var(--g-red)"
        />
        <StatCard
          icon={TrendingUp}
          label="Uptime"
          value={`${(stats?.uptime_pct ?? 100).toFixed(1)}%`}
          subValue="of monitored period"
          color="var(--g-green)"
        />
        <StatCard
          icon={Clock}
          label="Avg Duration"
          value={formatDuration(stats?.avg_duration_seconds ?? 0)}
          color="var(--g-orange)"
        />
        <StatCard
          icon={Clock}
          label="Longest Outage"
          value={formatDuration(stats?.longest_outage_seconds ?? 0)}
          color="var(--g-red)"
        />
      </div>

      {/* Outage timeline */}
      <OutageTimeline outages={outages} />
    </div>
  );
}
