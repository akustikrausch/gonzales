import { useLatestMeasurement, useMeasurements, useStatistics } from "../hooks/useApi";
import { SpeedGauge } from "../components/dashboard/SpeedGauge";
import { LatestResult } from "../components/dashboard/LatestResult";
import { SpeedChart } from "../components/dashboard/SpeedChart";
import { PingChart } from "../components/dashboard/PingChart";
import { LoadingSpinner } from "../components/common/LoadingSpinner";

export function DashboardPage() {
  const { data: latest, isLoading: loadingLatest } = useLatestMeasurement();
  const { data: page } = useMeasurements({ page_size: 50 });
  const { data: stats } = useStatistics();

  if (loadingLatest) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[#1D1D1F]">Dashboard</h2>

      {latest ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SpeedGauge
              label="Download"
              value={latest.download_mbps}
              color="#007AFF"
              threshold={stats?.download_threshold_mbps}
            />
            <SpeedGauge
              label="Upload"
              value={latest.upload_mbps}
              color="#34C759"
              threshold={stats?.upload_threshold_mbps}
            />
            <SpeedGauge
              label="Ping"
              value={latest.ping_latency_ms}
              unit="ms"
              color="#FF9500"
            />
          </div>

          <LatestResult measurement={latest} />

          {page && page.items.length > 1 && (
            <>
              <SpeedChart measurements={page.items} />
              <PingChart measurements={page.items} />
            </>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-[#86868B]">
          <p className="text-lg font-medium">No measurements yet</p>
          <p className="text-sm mt-1">
            Click "Run Test" to perform your first speed test.
          </p>
        </div>
      )}
    </div>
  );
}
