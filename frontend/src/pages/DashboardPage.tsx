import { Gauge } from "lucide-react";
import { useLatestMeasurement, useMeasurements, useStatistics } from "../hooks/useApi";
import { useSpeedTest } from "../context/SpeedTestContext";

import { SpeedGauge } from "../components/dashboard/SpeedGauge";
import { LatestResult } from "../components/dashboard/LatestResult";
import { SpeedChart } from "../components/dashboard/SpeedChart";
import { PingChart } from "../components/dashboard/PingChart";
import { LiveTestView } from "../components/speedtest/LiveTestView";
import { Spinner } from "../components/ui/Spinner";

export function DashboardPage() {
  const { data: latest, isLoading: loadingLatest } = useLatestMeasurement();
  const { data: page } = useMeasurements({ page_size: 50 });
  const { data: stats } = useStatistics();
  const { progress, isStreaming } = useSpeedTest();

  if (loadingLatest) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner size={32} />
      </div>
    );
  }

  const showLive = isStreaming || (progress.phase !== "idle" && progress.phase !== "complete" && progress.phase !== "error");

  return (
    <div className="space-y-6">
      <h2
        className="text-xl font-bold flex items-center gap-2 g-animate-in"
        style={{ color: "var(--g-text)" }}
      >
        <Gauge className="w-5 h-5" />
        Dashboard
      </h2>

      {showLive && (
        <div className="g-animate-scale">
          <LiveTestView progress={progress} />
        </div>
      )}

      {!showLive && latest ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 g-animate-in g-stagger-1">
            <SpeedGauge
              label="Download"
              value={latest.download_mbps}
              color="var(--g-blue)"
              threshold={stats?.download_threshold_mbps}
            />
            <SpeedGauge
              label="Upload"
              value={latest.upload_mbps}
              color="var(--g-green)"
              threshold={stats?.upload_threshold_mbps}
            />
            <SpeedGauge
              label="Ping"
              value={latest.ping_latency_ms}
              unit="ms"
              color="var(--g-orange)"
            />
          </div>

          <div className="g-animate-in g-stagger-2">
            <LatestResult measurement={latest} />
          </div>

          {page && page.items.length > 1 && (
            <div className="space-y-4 g-animate-in g-stagger-3">
              <SpeedChart measurements={page.items} />
              <PingChart measurements={page.items} />
            </div>
          )}
        </>
      ) : !showLive ? (
        <div
          className="text-center py-20 g-animate-in"
          style={{ color: "var(--g-text-secondary)" }}
        >
          <p className="text-lg font-medium">No measurements yet</p>
          <p className="text-sm mt-1">
            Click "Run Test" to perform your first speed test.
          </p>
        </div>
      ) : null}
    </div>
  );
}
