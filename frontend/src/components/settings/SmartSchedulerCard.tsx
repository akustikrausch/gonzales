import { useState } from "react";
import { Brain, Zap, TrendingUp, Battery, Clock, Shield } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { GlassButton } from "../ui/GlassButton";
import { GlassInput } from "../ui/GlassInput";
import { Spinner } from "../ui/Spinner";
import {
  useSmartSchedulerStatus,
  useSmartSchedulerConfig,
  useUpdateSmartSchedulerConfig,
  useEnableSmartScheduler,
  useDisableSmartScheduler,
} from "../../hooks/useApi";

const phaseConfig = {
  normal: {
    color: "var(--g-green)",
    bgColor: "var(--g-green-tint)",
    label: "Normal",
    description: "Standard testing intervals",
    icon: TrendingUp,
  },
  burst: {
    color: "var(--g-orange)",
    bgColor: "var(--g-orange-tint)",
    label: "Burst Mode",
    description: "Frequent testing due to anomaly",
    icon: Zap,
  },
  recovery: {
    color: "var(--g-blue)",
    bgColor: "var(--g-blue-tint)",
    label: "Recovery",
    description: "Gradually returning to normal",
    icon: TrendingUp,
  },
};

export function SmartSchedulerCard() {
  const { data: status, isLoading: statusLoading } = useSmartSchedulerStatus();
  const { data: config, isLoading: configLoading } = useSmartSchedulerConfig();
  const updateConfig = useUpdateSmartSchedulerConfig();
  const enableMutation = useEnableSmartScheduler();
  const disableMutation = useDisableSmartScheduler();

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Local state for editable config values
  const [burstInterval, setBurstInterval] = useState<string>("");
  const [dailyBudget, setDailyBudget] = useState<string>("");

  // Sync local state when config loads
  if (config && !burstInterval) {
    setBurstInterval(String(config.burst_interval_minutes));
    setDailyBudget(String(config.daily_data_budget_mb));
  }

  if (statusLoading || configLoading) {
    return (
      <GlassCard>
        <div className="flex items-center justify-center p-4">
          <Spinner size={24} />
        </div>
      </GlassCard>
    );
  }

  if (!status || !config) return null;

  const isToggling = enableMutation.isPending || disableMutation.isPending;
  const phase = phaseConfig[status.phase] || phaseConfig.normal;
  const PhaseIcon = phase.icon;

  const handleToggle = () => {
    if (status.enabled) {
      disableMutation.mutate();
    } else {
      enableMutation.mutate();
    }
  };

  const handleSaveConfig = () => {
    updateConfig.mutate({
      burst_interval_minutes: Number(burstInterval),
      daily_data_budget_mb: Number(dailyBudget),
    });
  };

  return (
    <GlassCard>
      <h3
        className="text-sm font-semibold mb-4 flex items-center gap-2"
        style={{ color: "var(--g-text)" }}
      >
        <Brain className="w-4 h-4" style={{ color: "var(--g-text-secondary)" }} />
        Smart Scheduling
      </h3>

      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--g-text)" }}>
            Adaptive Test Frequency
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--g-text-secondary)" }}>
            Automatically adjust intervals based on network conditions
          </p>
        </div>
        <GlassButton
          variant={status.enabled ? "default" : "primary"}
          onClick={handleToggle}
          disabled={isToggling}
        >
          {isToggling ? <Spinner size={16} /> : status.enabled ? "Disable" : "Enable"}
        </GlassButton>
      </div>

      {status.enabled && (
        <>
          {/* Current Status */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {/* Phase */}
            <div
              className="p-3 rounded-lg"
              style={{ background: phase.bgColor }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <PhaseIcon className="w-3 h-3" style={{ color: phase.color }} />
                <span className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
                  Phase
                </span>
              </div>
              <p className="text-sm font-medium" style={{ color: phase.color }}>
                {phase.label}
              </p>
            </div>

            {/* Interval */}
            <div
              className="p-3 rounded-lg"
              style={{ background: "var(--g-card-bg)" }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-3 h-3" style={{ color: "var(--g-text-secondary)" }} />
                <span className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
                  Interval
                </span>
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--g-text)" }}>
                {status.current_interval_minutes}m
              </p>
              <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
                Base: {status.base_interval_minutes}m
              </p>
            </div>

            {/* Stability */}
            <div
              className="p-3 rounded-lg"
              style={{ background: "var(--g-card-bg)" }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3 h-3" style={{ color: "var(--g-text-secondary)" }} />
                <span className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
                  Stability
                </span>
              </div>
              <p
                className="text-sm font-medium"
                style={{
                  color: status.stability_score > 0.8 ? "var(--g-green)" : status.stability_score > 0.5 ? "var(--g-orange)" : "var(--g-red)",
                }}
              >
                {Math.round(status.stability_score * 100)}%
              </p>
            </div>

            {/* Data Budget */}
            <div
              className="p-3 rounded-lg"
              style={{
                background: status.data_budget_warning ? "var(--g-orange-tint)" : "var(--g-card-bg)",
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Battery className="w-3 h-3" style={{ color: "var(--g-text-secondary)" }} />
                <span className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
                  Data Budget
                </span>
              </div>
              <p
                className="text-sm font-medium"
                style={{
                  color: status.data_budget_warning ? "var(--g-orange)" : "var(--g-text)",
                }}
              >
                {status.data_budget_remaining_pct.toFixed(0)}%
              </p>
              <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
                {status.daily_data_used_mb.toFixed(0)} MB used
              </p>
            </div>
          </div>

          {/* Circuit Breaker Warning */}
          {status.circuit_breaker_active && (
            <div
              className="p-3 rounded-lg mb-4 flex items-center gap-2"
              style={{ background: "var(--g-red-tint)" }}
            >
              <Shield className="w-4 h-4" style={{ color: "var(--g-red)" }} />
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--g-red)" }}>
                  Circuit Breaker Active
                </p>
                <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
                  Too many tests in short period. Using maximum interval to protect data budget.
                </p>
              </div>
            </div>
          )}

          {/* Last Decision */}
          {status.last_decision_reason && (
            <div
              className="p-3 rounded-lg mb-4"
              style={{ background: "var(--g-card-bg)" }}
            >
              <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
                Last Decision
              </p>
              <p className="text-sm" style={{ color: "var(--g-text)" }}>
                {status.last_decision_reason}
              </p>
            </div>
          )}

          {/* Advanced Settings Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs underline mb-4"
            style={{ color: "var(--g-text-secondary)" }}
          >
            {showAdvanced ? "Hide" : "Show"} Advanced Settings
          </button>

          {showAdvanced && (
            <div className="space-y-4 max-w-sm">
              <GlassInput
                label="Burst Interval (minutes)"
                type="number"
                min={5}
                max={30}
                value={burstInterval}
                onChange={(e) => setBurstInterval(e.target.value)}
              />
              <p className="text-xs -mt-2" style={{ color: "var(--g-text-secondary)" }}>
                Test interval during burst mode (when anomalies detected)
              </p>

              <GlassInput
                label="Daily Data Budget (MB)"
                type="number"
                min={100}
                max={10240}
                value={dailyBudget}
                onChange={(e) => setDailyBudget(e.target.value)}
              />
              <p className="text-xs -mt-2" style={{ color: "var(--g-text-secondary)" }}>
                Maximum data usage per day (~150 MB per test typical)
              </p>

              <GlassButton
                variant="primary"
                onClick={handleSaveConfig}
                disabled={updateConfig.isPending}
              >
                {updateConfig.isPending ? "Saving..." : "Save Settings"}
              </GlassButton>
            </div>
          )}
        </>
      )}

      {!status.enabled && (
        <div
          className="p-4 rounded-lg text-center"
          style={{ background: "var(--g-card-bg)" }}
        >
          <Brain className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--g-text-secondary)" }} />
          <p className="text-sm" style={{ color: "var(--g-text-secondary)" }}>
            Enable Smart Scheduling to automatically adjust test frequency based on network conditions.
          </p>
          <ul className="text-xs mt-3 space-y-1 text-left max-w-xs mx-auto" style={{ color: "var(--g-text-secondary)" }}>
            <li>• More frequent tests when issues detected</li>
            <li>• Gradual recovery when network stabilizes</li>
            <li>• Built-in safety limits and data budget</li>
          </ul>
        </div>
      )}
    </GlassCard>
  );
}
