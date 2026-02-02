import { useEffect, useState } from "react";
import { Timer, Activity, Server, Save } from "lucide-react";
import { useConfig, useStatus, useUpdateConfig } from "../hooks/useApi";
import { Card } from "../components/common/Card";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { formatBytes, formatDuration } from "../utils/format";

export function SettingsPage() {
  const { data: config, isLoading } = useConfig();
  const { data: status } = useStatus();
  const updateConfig = useUpdateConfig();

  const [interval, setInterval_] = useState("");
  const [dlThreshold, setDlThreshold] = useState("");
  const [ulThreshold, setUlThreshold] = useState("");

  useEffect(() => {
    if (config) {
      setInterval_(String(config.test_interval_minutes));
      setDlThreshold(String(config.download_threshold_mbps));
      setUlThreshold(String(config.upload_threshold_mbps));
    }
  }, [config]);

  if (isLoading) return <LoadingSpinner />;

  const handleSave = () => {
    updateConfig.mutate({
      test_interval_minutes: Number(interval),
      download_threshold_mbps: Number(dlThreshold),
      upload_threshold_mbps: Number(ulThreshold),
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[#1D1D1F] flex items-center gap-2">
        <Timer className="w-5 h-5" />
        Settings
      </h2>

      <Card>
        <h3 className="text-sm font-semibold text-[#1D1D1F] mb-4 flex items-center gap-2">
          <Timer className="w-4 h-4 text-[#86868B]" />
          Test Configuration
        </h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm text-[#86868B] mb-1">
              Test Interval (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="1440"
              value={interval}
              onChange={(e) => setInterval_(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E5E5EA] rounded-lg bg-white
                         focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#86868B] mb-1">
              Download Threshold (Mbps)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={dlThreshold}
              onChange={(e) => setDlThreshold(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E5E5EA] rounded-lg bg-white
                         focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#86868B] mb-1">
              Upload Threshold (Mbps)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={ulThreshold}
              onChange={(e) => setUlThreshold(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E5E5EA] rounded-lg bg-white
                         focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={updateConfig.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-[#007AFF] text-white text-sm font-medium rounded-lg
                       hover:bg-[#0066D6] disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {updateConfig.isPending ? "Saving..." : "Save Settings"}
          </button>
          {updateConfig.isSuccess && (
            <p className="text-xs text-[#34C759]">Settings saved.</p>
          )}
        </div>
      </Card>

      {status && (
        <Card>
          <h3 className="text-sm font-semibold text-[#1D1D1F] mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#86868B]" />
            System Status
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-[#86868B]">Uptime</p>
              <p className="font-medium">{formatDuration(status.uptime_seconds)}</p>
            </div>
            <div>
              <p className="text-[#86868B]">Total Measurements</p>
              <p className="font-medium">{status.total_measurements}</p>
            </div>
            <div>
              <p className="text-[#86868B]">Total Failures</p>
              <p className="font-medium">{status.total_failures}</p>
            </div>
            <div>
              <p className="text-[#86868B]">Database Size</p>
              <p className="font-medium">{formatBytes(status.db_size_bytes)}</p>
            </div>
          </div>
        </Card>
      )}

      {config && (
        <Card>
          <h3 className="text-sm font-semibold text-[#1D1D1F] mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-[#86868B]" />
            Server Info
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-[#86868B]">Host</p>
              <p className="font-medium">{config.host}</p>
            </div>
            <div>
              <p className="text-[#86868B]">Port</p>
              <p className="font-medium">{config.port}</p>
            </div>
            <div>
              <p className="text-[#86868B]">Log Level</p>
              <p className="font-medium">{config.log_level}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
