import { useEffect, useState } from "react";
import {
  Timer,
  Activity,
  Server,
  Save,
  Palette,
  Bell,
  Play,
  Pause,
  Gauge,
} from "lucide-react";
import {
  useConfig,
  useStatus,
  useUpdateConfig,
  useStatistics,
  useSetSchedulerEnabled,
} from "../hooks/useApi";
import { GlassCard } from "../components/ui/GlassCard";
import { GlassInput } from "../components/ui/GlassInput";
import { GlassButton } from "../components/ui/GlassButton";
import { Spinner } from "../components/ui/Spinner";
import { ServerPicker } from "../components/settings/ServerPicker";
import { SmartSchedulerCard } from "../components/settings/SmartSchedulerCard";
import { ThemeSelector } from "../components/settings/ThemeSelector";
import { formatBytes, formatDuration } from "../utils/format";

export function SettingsPage() {
  const { data: config, isLoading } = useConfig();
  const { data: status } = useStatus();
  const { data: stats } = useStatistics();
  const updateConfig = useUpdateConfig();
  const { mutate: setSchedulerEnabled, isPending: isTogglingScheduler } =
    useSetSchedulerEnabled();

  const [interval, setInterval_] = useState("");
  const [dlThreshold, setDlThreshold] = useState("");
  const [ulThreshold, setUlThreshold] = useState("");
  const [tolerance, setTolerance] = useState(15);
  const [serverId, setServerId] = useState(0);
  const [ispName, setIspName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [retentionDays, setRetentionDays] = useState("0");

  // Track if test settings have changed
  const [testSettingsChanged, setTestSettingsChanged] = useState(false);
  const [advancedSettingsChanged, setAdvancedSettingsChanged] = useState(false);

  useEffect(() => {
    if (config) {
      setInterval_(String(config.test_interval_minutes));
      setDlThreshold(String(config.download_threshold_mbps));
      setUlThreshold(String(config.upload_threshold_mbps));
      setTolerance(config.tolerance_percent);
      setServerId(config.preferred_server_id);
      setIspName(config.isp_name || "");
      setWebhookUrl(config.webhook_url || "");
      setRetentionDays(String(config.data_retention_days || 0));
      setTestSettingsChanged(false);
      setAdvancedSettingsChanged(false);
    }
  }, [config]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner size={32} />
      </div>
    );
  }

  const handleSaveTestSettings = () => {
    updateConfig.mutate(
      {
        test_interval_minutes: Number(interval),
        download_threshold_mbps: Number(dlThreshold),
        upload_threshold_mbps: Number(ulThreshold),
        tolerance_percent: tolerance,
        preferred_server_id: serverId,
        isp_name: ispName,
      },
      {
        onSuccess: () => setTestSettingsChanged(false),
      }
    );
  };

  const handleSaveAdvancedSettings = () => {
    updateConfig.mutate(
      {
        webhook_url: webhookUrl,
        data_retention_days: Number(retentionDays),
      },
      {
        onSuccess: () => setAdvancedSettingsChanged(false),
      }
    );
  };

  // Calculate effective minimum speeds based on tolerance
  const effectiveMinDownload = Number(dlThreshold) * (1 - tolerance / 100);
  const effectiveMinUpload = Number(ulThreshold) * (1 - tolerance / 100);

  // Calculate estimated data usage per day based on interval
  const testsPerDay = Math.floor(1440 / Number(interval || 60));
  const mbPerTest =
    ((Number(dlThreshold || 100) + Number(ulThreshold || 50)) * 10) / 8;
  const estimatedDataPerDayMB = testsPerDay * mbPerTest;
  const estimatedDataPerDayGB = estimatedDataPerDayMB / 1024;

  const handleServerChange = (id: number) => {
    setServerId(id);
    setTestSettingsChanged(true);
  };

  const handleTestSettingChange = <T,>(
    setter: React.Dispatch<React.SetStateAction<T>>,
    value: T
  ) => {
    setter(value);
    setTestSettingsChanged(true);
  };

  const handleAdvancedSettingChange = <T,>(
    setter: React.Dispatch<React.SetStateAction<T>>,
    value: T
  ) => {
    setter(value);
    setAdvancedSettingsChanged(true);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="g-animate-in">
        <h2
          className="text-xl font-bold flex items-center gap-2"
          style={{ color: "var(--g-text)" }}
        >
          <Timer className="w-5 h-5" />
          Settings
        </h2>
        <p
          className="text-sm mt-1"
          style={{ color: "var(--g-text-secondary)" }}
        >
          Configure speed tests, scheduling, and preferences
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1: SCHEDULING
          ═══════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <h3
          className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2 g-animate-in g-stagger-1"
          style={{ color: "var(--g-text-secondary)" }}
        >
          <Timer className="w-4 h-4" />
          Scheduling
        </h3>

        {/* Scheduler Control */}
        {status && (
          <GlassCard className="g-animate-in g-stagger-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: status.scheduler.enabled
                      ? "var(--g-green-tint)"
                      : "var(--g-yellow-tint)",
                  }}
                >
                  {status.scheduler.enabled ? (
                    <Play
                      className="w-5 h-5"
                      style={{ color: "var(--g-green)" }}
                    />
                  ) : (
                    <Pause
                      className="w-5 h-5"
                      style={{ color: "var(--g-yellow)" }}
                    />
                  )}
                </div>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--g-text)" }}
                  >
                    Automatic Speed Tests
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--g-text-secondary)" }}
                  >
                    {status.scheduler.enabled
                      ? `Running every ${status.scheduler.interval_minutes} minutes`
                      : "Paused - only manual tests will run"}
                  </p>
                </div>
              </div>
              <GlassButton
                variant={status.scheduler.enabled ? "default" : "primary"}
                onClick={() => setSchedulerEnabled(!status.scheduler.enabled)}
                disabled={isTogglingScheduler}
                aria-label={
                  status.scheduler.enabled ? "Pause scheduler" : "Resume scheduler"
                }
              >
                {isTogglingScheduler ? (
                  <Spinner size={16} />
                ) : status.scheduler.enabled ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {isTogglingScheduler
                  ? "..."
                  : status.scheduler.enabled
                    ? "Pause"
                    : "Resume"}
              </GlassButton>
            </div>
          </GlassCard>
        )}

        {/* Smart Scheduler */}
        <div className="g-animate-in g-stagger-3">
          <SmartSchedulerCard />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2: SPEED TEST CONFIGURATION
          ═══════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <h3
          className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2 g-animate-in g-stagger-4"
          style={{ color: "var(--g-text-secondary)" }}
        >
          <Gauge className="w-4 h-4" />
          Speed Test Configuration
        </h3>

        <GlassCard className="g-animate-in g-stagger-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Test Parameters */}
            <div className="space-y-5">
              <h4
                className="text-sm font-medium"
                style={{ color: "var(--g-text)" }}
              >
                Test Parameters
              </h4>

              <div>
                <GlassInput
                  label="Test Interval (minutes)"
                  type="number"
                  min={1}
                  max={1440}
                  value={interval}
                  onChange={(e) =>
                    handleTestSettingChange(setInterval_, e.target.value)
                  }
                />
                <p
                  className="text-xs mt-2"
                  style={{ color: "var(--g-text-secondary)" }}
                >
                  {testsPerDay} tests/day ·{" "}
                  {estimatedDataPerDayGB >= 1
                    ? `${estimatedDataPerDayGB.toFixed(1)} GB`
                    : `${Math.round(estimatedDataPerDayMB)} MB`}
                  /day data usage
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <GlassInput
                  label="Download Target (Mbps)"
                  type="number"
                  min={0}
                  step={0.1}
                  value={dlThreshold}
                  onChange={(e) =>
                    handleTestSettingChange(setDlThreshold, e.target.value)
                  }
                />
                <GlassInput
                  label="Upload Target (Mbps)"
                  type="number"
                  min={0}
                  step={0.1}
                  value={ulThreshold}
                  onChange={(e) =>
                    handleTestSettingChange(setUlThreshold, e.target.value)
                  }
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--g-text)" }}
                >
                  Tolerance: {tolerance}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={1}
                  value={tolerance}
                  onChange={(e) =>
                    handleTestSettingChange(setTolerance, Number(e.target.value))
                  }
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, var(--g-accent) 0%, var(--g-accent) ${tolerance * 2}%, var(--g-border) ${tolerance * 2}%, var(--g-border) 100%)`,
                  }}
                />
                <p
                  className="text-xs mt-2"
                  style={{ color: "var(--g-text-secondary)" }}
                >
                  Min. acceptable: {effectiveMinDownload.toFixed(0)} ↓ /{" "}
                  {effectiveMinUpload.toFixed(0)} ↑ Mbps
                </p>
              </div>

              <GlassInput
                label="ISP / Provider Name"
                type="text"
                placeholder="e.g., Deutsche Telekom"
                value={ispName}
                onChange={(e) =>
                  handleTestSettingChange(setIspName, e.target.value)
                }
              />
            </div>

            {/* Right Column: Server Selection */}
            <div className="space-y-5">
              <h4
                className="text-sm font-medium flex items-center gap-2"
                style={{ color: "var(--g-text)" }}
              >
                <Server className="w-4 h-4" />
                Server Selection
              </h4>
              <ServerPicker value={serverId} onChange={handleServerChange} />
            </div>
          </div>

          {/* Save Button */}
          <div
            className="mt-6 pt-6 flex items-center justify-between"
            style={{ borderTop: "1px solid var(--g-border)" }}
          >
            <p
              className="text-xs"
              style={{ color: "var(--g-text-secondary)" }}
            >
              {testSettingsChanged ? (
                <span style={{ color: "var(--g-yellow)" }}>
                  Unsaved changes
                </span>
              ) : (
                "All changes saved"
              )}
            </p>
            <GlassButton
              variant="primary"
              onClick={handleSaveTestSettings}
              disabled={updateConfig.isPending || !testSettingsChanged}
            >
              <Save className="w-4 h-4" />
              {updateConfig.isPending ? "Saving..." : "Save Test Settings"}
            </GlassButton>
          </div>
        </GlassCard>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3: PREFERENCES
          ═══════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <h3
          className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2 g-animate-in g-stagger-6"
          style={{ color: "var(--g-text-secondary)" }}
        >
          <Palette className="w-4 h-4" />
          Preferences
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Appearance */}
          <GlassCard className="g-animate-in g-stagger-7">
            <h4
              className="text-sm font-medium mb-4 flex items-center gap-2"
              style={{ color: "var(--g-text)" }}
            >
              <Palette className="w-4 h-4" />
              Appearance
            </h4>
            <ThemeSelector />
          </GlassCard>

          {/* Notifications & Data */}
          <GlassCard className="g-animate-in g-stagger-8">
            <h4
              className="text-sm font-medium mb-4 flex items-center gap-2"
              style={{ color: "var(--g-text)" }}
            >
              <Bell className="w-4 h-4" />
              Notifications & Data
            </h4>
            <div className="space-y-4">
              <div>
                <GlassInput
                  label="Webhook URL"
                  type="url"
                  placeholder="https://webhook.example.com"
                  value={webhookUrl}
                  onChange={(e) =>
                    handleAdvancedSettingChange(setWebhookUrl, e.target.value)
                  }
                />
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--g-text-secondary)" }}
                >
                  Leave empty to disable
                </p>
              </div>
              <div>
                <GlassInput
                  label="Data Retention (days)"
                  type="number"
                  min={0}
                  max={3650}
                  placeholder="0"
                  value={retentionDays}
                  onChange={(e) =>
                    handleAdvancedSettingChange(setRetentionDays, e.target.value)
                  }
                />
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--g-text-secondary)" }}
                >
                  {Number(retentionDays) === 0
                    ? "0 = keep forever"
                    : `Auto-delete after ${retentionDays} days`}
                </p>
              </div>
              <div className="pt-2">
                <GlassButton
                  variant="primary"
                  size="sm"
                  onClick={handleSaveAdvancedSettings}
                  disabled={updateConfig.isPending || !advancedSettingsChanged}
                >
                  <Save className="w-3 h-3" />
                  Save
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4: SYSTEM INFORMATION (Read-only)
          ═══════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <h3
          className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2 g-animate-in g-stagger-9"
          style={{ color: "var(--g-text-secondary)" }}
        >
          <Activity className="w-4 h-4" />
          System Information
        </h3>

        <GlassCard className="g-animate-in g-stagger-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {status && (
              <>
                <div>
                  <p
                    className="text-xs uppercase tracking-wide mb-1"
                    style={{ color: "var(--g-text-secondary)" }}
                  >
                    Version
                  </p>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--g-accent)" }}
                  >
                    v{status.version}
                  </p>
                </div>
                <div>
                  <p
                    className="text-xs uppercase tracking-wide mb-1"
                    style={{ color: "var(--g-text-secondary)" }}
                  >
                    Uptime
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--g-text)" }}
                  >
                    {formatDuration(status.uptime_seconds)}
                  </p>
                </div>
                <div>
                  <p
                    className="text-xs uppercase tracking-wide mb-1"
                    style={{ color: "var(--g-text-secondary)" }}
                  >
                    Measurements
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--g-text)" }}
                  >
                    {status.total_measurements.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p
                    className="text-xs uppercase tracking-wide mb-1"
                    style={{ color: "var(--g-text-secondary)" }}
                  >
                    Failures
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--g-text)" }}
                  >
                    {status.total_failures}
                  </p>
                </div>
                <div>
                  <p
                    className="text-xs uppercase tracking-wide mb-1"
                    style={{ color: "var(--g-text-secondary)" }}
                  >
                    Database
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--g-text)" }}
                  >
                    {formatBytes(status.db_size_bytes)}
                  </p>
                </div>
                <div>
                  <p
                    className="text-xs uppercase tracking-wide mb-1"
                    style={{ color: "var(--g-text-secondary)" }}
                  >
                    Data Used
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--g-text)" }}
                  >
                    {stats ? formatBytes(stats.total_data_used_bytes) : "—"}
                  </p>
                </div>
              </>
            )}
          </div>

          {config && (
            <div
              className="mt-6 pt-6 grid grid-cols-3 gap-4"
              style={{ borderTop: "1px solid var(--g-border)" }}
            >
              <div>
                <p
                  className="text-xs uppercase tracking-wide mb-1"
                  style={{ color: "var(--g-text-secondary)" }}
                >
                  Host
                </p>
                <p
                  className="text-sm font-mono"
                  style={{ color: "var(--g-text)" }}
                >
                  {config.host}
                </p>
              </div>
              <div>
                <p
                  className="text-xs uppercase tracking-wide mb-1"
                  style={{ color: "var(--g-text-secondary)" }}
                >
                  Port
                </p>
                <p
                  className="text-sm font-mono"
                  style={{ color: "var(--g-text)" }}
                >
                  {config.port}
                </p>
              </div>
              <div>
                <p
                  className="text-xs uppercase tracking-wide mb-1"
                  style={{ color: "var(--g-text-secondary)" }}
                >
                  Log Level
                </p>
                <p
                  className="text-sm font-mono"
                  style={{ color: "var(--g-text)" }}
                >
                  {config.log_level}
                </p>
              </div>
            </div>
          )}
        </GlassCard>
      </section>
    </div>
  );
}
