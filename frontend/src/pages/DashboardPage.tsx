import { Gauge } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLatestMeasurement, useMeasurements, useStatistics, useEnhancedStatistics, useStatus } from "../hooks/useApi";
import { useSpeedTest } from "../context/SpeedTestContext";

import { SpeedGauge } from "../components/dashboard/SpeedGauge";
import { LatestResult } from "../components/dashboard/LatestResult";
import { SpeedChart } from "../components/dashboard/SpeedChart";
import { PingChart } from "../components/dashboard/PingChart";
import { QuickQosStatus } from "../components/dashboard/QuickQosStatus";
import { ConnectionHealth } from "../components/dashboard/ConnectionHealth";
import { OutageAlert } from "../components/dashboard/OutageAlert";
import { LiveTestView } from "../components/speedtest/LiveTestView";
import { Spinner } from "../components/ui/Spinner";

export function DashboardPage() {
  const { t } = useTranslation();
  const { data: latest, isLoading: loadingLatest } = useLatestMeasurement();
  const { data: page } = useMeasurements({ page_size: 50 });
  const { data: stats } = useStatistics();
  const { data: enhanced } = useEnhancedStatistics();
  const { data: status } = useStatus();
  const { progress, isStreaming, testActive } = useSpeedTest();

  if (loadingLatest) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner size={32} />
      </div>
    );
  }

  // testActive is a "sticky" flag that stays true from runTest() until complete/error/reset
  // This prevents the LiveTestView from flickering off due to transient state changes
  const showLive = testActive || isStreaming || (progress.phase !== "idle" && progress.phase !== "complete" && progress.phase !== "error");

  return (
    <div className="space-y-6">
      <h2
        className="text-xl font-bold flex items-center gap-2 g-animate-in"
        style={{ color: "var(--g-text)" }}
      >
        <Gauge className="w-5 h-5" />
        {t("dashboard.title")}
      </h2>

      {/* Outage alert banner */}
      {status?.outage && <OutageAlert outage={status.outage} />}

      {showLive && (
        <div className="g-animate-scale">
          <LiveTestView progress={progress} />
        </div>
      )}

      {!showLive && latest ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 g-animate-in g-stagger-1">
            <SpeedGauge
              label={t("dashboard.download")}
              sublabel={t("dashboard.latestTest")}
              value={latest.download_mbps}
              color="var(--g-blue)"
              threshold={stats?.effective_download_threshold_mbps}
              thresholdLabel={stats ? t("dashboard.minThreshold", { value: stats.effective_download_threshold_mbps }) : undefined}
            />
            <SpeedGauge
              label={t("dashboard.upload")}
              sublabel={t("dashboard.latestTest")}
              value={latest.upload_mbps}
              color="var(--g-green)"
              threshold={stats?.effective_upload_threshold_mbps}
              thresholdLabel={stats ? t("dashboard.minThreshold", { value: stats.effective_upload_threshold_mbps }) : undefined}
            />
            <SpeedGauge
              label={t("dashboard.ping")}
              sublabel={t("dashboard.latestTest")}
              value={latest.ping_latency_ms}
              unit={t("common.ms")}
              color="var(--g-orange)"
            />
          </div>

          {/* Connection Health Score */}
          {enhanced?.isp_score && (
            <div className="g-animate-in g-stagger-2">
              <ConnectionHealth score={enhanced.isp_score} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 g-animate-in g-stagger-3">
            <LatestResult measurement={latest} />
            <QuickQosStatus />
          </div>

          {page && page.items.length > 1 && (
            <div className="space-y-4 g-animate-in g-stagger-4">
              <SpeedChart
                measurements={page.items}
                downloadThreshold={stats?.effective_download_threshold_mbps}
                uploadThreshold={stats?.effective_upload_threshold_mbps}
              />
              <PingChart measurements={page.items} />
            </div>
          )}
        </>
      ) : !showLive ? (
        <div
          className="text-center py-20 g-animate-in"
          style={{ color: "var(--g-text-secondary)" }}
        >
          <p className="text-lg font-medium">{t("dashboard.noMeasurements")}</p>
          <p className="text-sm mt-1">
            {t("dashboard.noMeasurementsHint")}
          </p>
        </div>
      ) : null}
    </div>
  );
}
