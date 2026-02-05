import { useEffect, useState } from "react";
import { Timer, Activity, Server, Save, Palette, FileText, Bell, Play, Pause } from "lucide-react";
import { useConfig, useStatus, useUpdateConfig, useStatistics, useSetSchedulerEnabled } from "../hooks/useApi";
import { GlassCard } from "../components/ui/GlassCard";
import { GlassInput } from "../components/ui/GlassInput";
import { GlassButton } from "../components/ui/GlassButton";
import { Spinner } from "../components/ui/Spinner";
import { ServerPicker } from "../components/settings/ServerPicker";
import { ThemeSelector } from "../components/settings/ThemeSelector";
import { formatBytes, formatDuration } from "../utils/format";

export function SettingsPage() {
  const { data: config, isLoading } = useConfig();
  const { data: status } = useStatus();
  const { data: stats } = useStatistics();
  const updateConfig = useUpdateConfig();
  const { mutate: setSchedulerEnabled, isPending: isTogglingScheduler } = useSetSchedulerEnabled();

  const [interval, setInterval_] = useState("");
  const [dlThreshold, setDlThreshold] = useState("");
  const [ulThreshold, setUlThreshold] = useState("");
  const [tolerance, setTolerance] = useState(15);
  const [serverId, setServerId] = useState(0);
  const [ispName, setIspName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [retentionDays, setRetentionDays] = useState("0");

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
    }
  }, [config]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner size={32} />
      </div>
    );
  }

  const handleSave = () => {
    updateConfig.mutate({
      test_interval_minutes: Number(interval),
      download_threshold_mbps: Number(dlThreshold),
      upload_threshold_mbps: Number(ulThreshold),
      tolerance_percent: tolerance,
      preferred_server_id: serverId,
      isp_name: ispName,
    });
  };

  // Calculate effective minimum speeds based on tolerance
  const effectiveMinDownload = Number(dlThreshold) * (1 - tolerance / 100);
  const effectiveMinUpload = Number(ulThreshold) * (1 - tolerance / 100);

  // Calculate estimated data usage per day based on interval
  // Speedtest typically runs for ~10 seconds at full speed for download and upload
  const testsPerDay = Math.floor(1440 / Number(interval || 60));
  const mbPerTest = (Number(dlThreshold || 100) + Number(ulThreshold || 50)) * 10 / 8; // ~10s at full speed
  const estimatedDataPerDayMB = testsPerDay * mbPerTest;
  const estimatedDataPerDayGB = estimatedDataPerDayMB / 1024;

  const handleServerChange = (id: number) => {
    setServerId(id);
    updateConfig.mutate({ preferred_server_id: id });
  };

  return (
    <div className="space-y-6">
      <h2
        className="text-xl font-bold flex items-center gap-2 g-animate-in"
        style={{ color: "var(--g-text)" }}
      >
        <Timer className="w-5 h-5" />
        Settings
      </h2>

      {status && (
        <GlassCard className="g-animate-in g-stagger-1">
          <h3
            className="text-sm font-semibold mb-4 flex items-center gap-2"
            style={{ color: "var(--g-text)" }}
          >
            <Timer className="w-4 h-4" style={{ color: "var(--g-text-secondary)" }} />
            Scheduler Control
          </h3>
          <div className="space-y-4 max-w-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--g-text)" }}>
                  Automatic Speed Tests
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--g-text-secondary)" }}>
                  {status.scheduler.enabled
                    ? `Running every ${status.scheduler.interval_minutes} minutes`
                    : "Paused - only manual tests will run"}
                </p>
              </div>
              <GlassButton
                variant={status.scheduler.enabled ? "default" : "primary"}
                onClick={() => setSchedulerEnabled(!status.scheduler.enabled)}
                disabled={isTogglingScheduler}
                aria-label={status.scheduler.enabled ? "Pause scheduler" : "Resume scheduler"}
              >
                {isTogglingScheduler ? (
                  <Spinner size={16} />
                ) : status.scheduler.enabled ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {isTogglingScheduler
                  ? "Updating..."
                  : status.scheduler.enabled
                    ? "Pause"
                    : "Resume"}
              </GlassButton>
            </div>
            {status.scheduler.paused && (
              <p className="text-xs p-2 rounded" style={{ background: "var(--g-yellow-tint)", color: "var(--g-yellow)" }}>
                Scheduler is paused. Automatic speed tests are not running.
                Click "Resume" to restart automatic testing.
              </p>
            )}
          </div>
        </GlassCard>
      )}

      <GlassCard className="g-animate-in g-stagger-2">
        <h3
          className="text-sm font-semibold mb-4 flex items-center gap-2"
          style={{ color: "var(--g-text)" }}
        >
          <Timer className="w-4 h-4" style={{ color: "var(--g-text-secondary)" }} />
          Test Configuration
        </h3>
        <div className="space-y-4 max-w-md">
          <div>
            <GlassInput
              label="Test Interval (minutes)"
              type="number"
              min={1}
              max={1440}
              value={interval}
              onChange={(e) => setInterval_(e.target.value)}
            />
            <p className="text-xs mt-2" style={{ color: "var(--g-text-secondary)" }}>
              {testsPerDay} tests/day · Est. {estimatedDataPerDayGB >= 1
                ? `${estimatedDataPerDayGB.toFixed(1)} GB`
                : `${Math.round(estimatedDataPerDayMB)} MB`}/day data usage
            </p>
          </div>
          <GlassInput
            label="Download Threshold (Mbps)"
            type="number"
            min={0}
            step={0.1}
            value={dlThreshold}
            onChange={(e) => setDlThreshold(e.target.value)}
          />
          <GlassInput
            label="Upload Threshold (Mbps)"
            type="number"
            min={0}
            step={0.1}
            value={ulThreshold}
            onChange={(e) => setUlThreshold(e.target.value)}
          />
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
              onChange={(e) => setTolerance(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--g-accent) 0%, var(--g-accent) ${tolerance * 2}%, var(--g-border) ${tolerance * 2}%, var(--g-border) 100%)`,
              }}
            />
            <p className="text-xs mt-2" style={{ color: "var(--g-text-secondary)" }}>
              Minimum acceptable: {effectiveMinDownload.toFixed(1)} Mbps down / {effectiveMinUpload.toFixed(1)} Mbps up
            </p>
          </div>
          <GlassButton
            variant="primary"
            onClick={handleSave}
            disabled={updateConfig.isPending}
          >
            <Save className="w-4 h-4" />
            {updateConfig.isPending ? "Saving..." : "Save Settings"}
          </GlassButton>
          {updateConfig.isSuccess && (
            <p className="text-xs" style={{ color: "var(--g-green)" }}>Settings saved.</p>
          )}
        </div>
      </GlassCard>

      <GlassCard className="g-animate-in g-stagger-3">
        <h3
          className="text-sm font-semibold mb-4 flex items-center gap-2"
          style={{ color: "var(--g-text)" }}
        >
          <FileText className="w-4 h-4" style={{ color: "var(--g-text-secondary)" }} />
          Contract Details
        </h3>
        <div className="space-y-4 max-w-md">
          <GlassInput
            label="ISP / Provider Name"
            type="text"
            placeholder="e.g., Deutsche Telekom"
            value={ispName}
            onChange={(e) => setIspName(e.target.value)}
          />
          <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
            This information will be included in professional compliance reports.
            The speed thresholds above are used as your contracted speeds.
          </p>
          <GlassButton
            variant="primary"
            onClick={handleSave}
            disabled={updateConfig.isPending}
          >
            <Save className="w-4 h-4" />
            {updateConfig.isPending ? "Saving..." : "Save Settings"}
          </GlassButton>
        </div>
      </GlassCard>

      <GlassCard className="g-animate-in g-stagger-4">
        <h3
          className="text-sm font-semibold mb-4 flex items-center gap-2"
          style={{ color: "var(--g-text)" }}
        >
          <Server className="w-4 h-4" style={{ color: "var(--g-text-secondary)" }} />
          Server Selection
        </h3>
        <div className="max-w-md">
          <ServerPicker value={serverId} onChange={handleServerChange} />
        </div>
      </GlassCard>

      <GlassCard className="g-animate-in g-stagger-5">
        <h3
          className="text-sm font-semibold mb-4 flex items-center gap-2"
          style={{ color: "var(--g-text)" }}
        >
          <Palette className="w-4 h-4" style={{ color: "var(--g-text-secondary)" }} />
          Appearance
        </h3>
        <div className="max-w-sm">
          <ThemeSelector />
        </div>
      </GlassCard>

      <GlassCard className="g-animate-in g-stagger-6">
        <h3
          className="text-sm font-semibold mb-4 flex items-center gap-2"
          style={{ color: "var(--g-text)" }}
        >
          <Bell className="w-4 h-4" style={{ color: "var(--g-text-secondary)" }} />
          Notifications & Data
        </h3>
        <div className="space-y-4 max-w-md">
          <div>
            <GlassInput
              label="Webhook URL"
              type="url"
              placeholder="https://your-webhook.example.com/endpoint"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
            <p className="text-xs mt-2" style={{ color: "var(--g-text-secondary)" }}>
              Receive notifications for speed test results, outages, and threshold violations.
              Leave empty to disable webhooks.
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
              onChange={(e) => setRetentionDays(e.target.value)}
            />
            <p className="text-xs mt-2" style={{ color: "var(--g-text-secondary)" }}>
              {Number(retentionDays) === 0
                ? "Unlimited - data is kept forever"
                : `Measurements older than ${retentionDays} days will be automatically deleted`}
            </p>
          </div>
          <GlassButton
            variant="primary"
            onClick={() => {
              updateConfig.mutate({
                webhook_url: webhookUrl,
                data_retention_days: Number(retentionDays),
              });
            }}
            disabled={updateConfig.isPending}
          >
            <Save className="w-4 h-4" />
            {updateConfig.isPending ? "Saving..." : "Save Advanced Settings"}
          </GlassButton>
        </div>
      </GlassCard>

      {status && (
        <GlassCard className="g-animate-in g-stagger-7">
          <h3
            className="text-sm font-semibold mb-4 flex items-center gap-2"
            style={{ color: "var(--g-text)" }}
          >
            <Activity className="w-4 h-4" style={{ color: "var(--g-text-secondary)" }} />
            System Status
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-sm">
            <div>
              <p style={{ color: "var(--g-text-secondary)" }}>Version</p>
              <p className="font-medium" style={{ color: "var(--g-accent)" }}>
                v{status.version}
              </p>
            </div>
            <div>
              <p style={{ color: "var(--g-text-secondary)" }}>Uptime</p>
              <p className="font-medium" style={{ color: "var(--g-text)" }}>
                {formatDuration(status.uptime_seconds)}
              </p>
            </div>
            <div>
              <p style={{ color: "var(--g-text-secondary)" }}>Total Measurements</p>
              <p className="font-medium" style={{ color: "var(--g-text)" }}>
                {status.total_measurements}
              </p>
            </div>
            <div>
              <p style={{ color: "var(--g-text-secondary)" }}>Total Failures</p>
              <p className="font-medium" style={{ color: "var(--g-text)" }}>
                {status.total_failures}
              </p>
            </div>
            <div>
              <p style={{ color: "var(--g-text-secondary)" }}>Database Size</p>
              <p className="font-medium" style={{ color: "var(--g-text)" }}>
                {formatBytes(status.db_size_bytes)}
              </p>
            </div>
            <div>
              <p style={{ color: "var(--g-text-secondary)" }}>Data Used by Tests</p>
              <p className="font-medium" style={{ color: "var(--g-text)" }}>
                {stats ? formatBytes(stats.total_data_used_bytes) : "—"}
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {config && (
        <GlassCard className="g-animate-in g-stagger-8">
          <h3
            className="text-sm font-semibold mb-4 flex items-center gap-2"
            style={{ color: "var(--g-text)" }}
          >
            <Server className="w-4 h-4" style={{ color: "var(--g-text-secondary)" }} />
            Server Info
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p style={{ color: "var(--g-text-secondary)" }}>Host</p>
              <p className="font-medium" style={{ color: "var(--g-text)" }}>{config.host}</p>
            </div>
            <div>
              <p style={{ color: "var(--g-text-secondary)" }}>Port</p>
              <p className="font-medium" style={{ color: "var(--g-text)" }}>{config.port}</p>
            </div>
            <div>
              <p style={{ color: "var(--g-text-secondary)" }}>Log Level</p>
              <p className="font-medium" style={{ color: "var(--g-text)" }}>{config.log_level}</p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
