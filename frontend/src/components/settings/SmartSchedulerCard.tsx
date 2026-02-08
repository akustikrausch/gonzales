import { useState } from "react";
import { Brain, Zap, TrendingUp, Battery, Clock, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
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

const getPhaseConfig = (t: (key: string) => string) => ({
  normal: {
    color: "var(--g-green)",
    bgColor: "var(--g-green-tint)",
    label: t("settings.phaseNormal"),
    description: t("settings.phaseNormalDesc"),
    icon: TrendingUp,
  },
  burst: {
    color: "var(--g-orange)",
    bgColor: "var(--g-orange-tint)",
    label: t("settings.phaseBurst"),
    description: t("settings.phaseBurstDesc"),
    icon: Zap,
  },
  recovery: {
    color: "var(--g-blue)",
    bgColor: "var(--g-blue-tint)",
    label: t("settings.phaseRecovery"),
    description: t("settings.phaseRecoveryDesc"),
    icon: TrendingUp,
  },
});

export function SmartSchedulerCard() {
  const { t } = useTranslation();
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
  const phaseConfig = getPhaseConfig(t);
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
        {t("settings.smartScheduling")}
      </h3>

      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--g-text)" }}>
            {t("settings.adaptiveTestFrequency")}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--g-text-secondary)" }}>
            {t("settings.adaptiveTestFrequencyDesc")}
          </p>
        </div>
        <GlassButton
          variant={status.enabled ? "default" : "primary"}
          onClick={handleToggle}
          disabled={isToggling}
        >
          {isToggling ? <Spinner size={16} /> : status.enabled ? t("settings.disable") : t("settings.enable")}
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
                  {t("settings.phase")}
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
                  {t("settings.interval")}
                </span>
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--g-text)" }}>
                {status.current_interval_minutes}m
              </p>
              <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
                {t("settings.baseInterval", { minutes: status.base_interval_minutes })}
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
                  {t("settings.stability")}
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
                  {t("settings.dataBudget")}
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
                {t("settings.dataBudgetUsed", { used: status.daily_data_used_mb.toFixed(0) })}
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
                  {t("settings.circuitBreakerActive")}
                </p>
                <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
                  {t("settings.circuitBreakerDesc")}
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
                {t("settings.lastDecision")}
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
            {showAdvanced ? t("settings.hideAdvancedSettings") : t("settings.showAdvancedSettings")}
          </button>

          {showAdvanced && (
            <div className="space-y-4 max-w-sm">
              <GlassInput
                label={t("settings.burstInterval")}
                type="number"
                min={5}
                max={30}
                value={burstInterval}
                onChange={(e) => setBurstInterval(e.target.value)}
              />
              <p className="text-xs -mt-2" style={{ color: "var(--g-text-secondary)" }}>
                {t("settings.burstIntervalDesc")}
              </p>

              <GlassInput
                label={t("settings.dailyDataBudget")}
                type="number"
                min={100}
                max={10240}
                value={dailyBudget}
                onChange={(e) => setDailyBudget(e.target.value)}
              />
              <p className="text-xs -mt-2" style={{ color: "var(--g-text-secondary)" }}>
                {t("settings.dailyDataBudgetDesc")}
              </p>

              <GlassButton
                variant="primary"
                onClick={handleSaveConfig}
                disabled={updateConfig.isPending}
              >
                {updateConfig.isPending ? t("settings.saving") : t("settings.saveSettings")}
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
            {t("settings.enableSmartScheduling")}
          </p>
          <ul className="text-xs mt-3 space-y-1 text-left max-w-xs mx-auto" style={{ color: "var(--g-text-secondary)" }}>
            <li>• {t("settings.smartSchedulingBenefits1")}</li>
            <li>• {t("settings.smartSchedulingBenefits2")}</li>
            <li>• {t("settings.smartSchedulingBenefits3")}</li>
          </ul>
        </div>
      )}
    </GlassCard>
  );
}
