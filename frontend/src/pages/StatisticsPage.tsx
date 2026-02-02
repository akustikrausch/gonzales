import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { useMeasurements, useStatistics } from "../hooks/useApi";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { DateRangeFilter } from "../components/history/DateRangeFilter";
import { StatsOverview } from "../components/statistics/StatsOverview";
import { Percentiles } from "../components/statistics/Percentiles";
import { Distribution } from "../components/statistics/Distribution";

export function StatisticsPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const dateParams = {
    start_date: startDate ? new Date(startDate).toISOString() : undefined,
    end_date: endDate ? new Date(endDate).toISOString() : undefined,
  };

  const { data: stats, isLoading } = useStatistics(dateParams);
  const { data: page } = useMeasurements({ page_size: 100, ...dateParams });

  if (isLoading) return <LoadingSpinner />;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1D1D1F] flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Statistics
        </h2>
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </div>

      <StatsOverview stats={stats} />

      {stats.download && (
        <Percentiles label="Download" stat={stats.download} unit="Mbps" color="#007AFF" />
      )}
      {stats.upload && (
        <Percentiles label="Upload" stat={stats.upload} unit="Mbps" color="#34C759" />
      )}
      {stats.ping && (
        <Percentiles label="Ping" stat={stats.ping} unit="ms" color="#FF9500" />
      )}

      {page && page.items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Distribution
            measurements={page.items}
            field="download_mbps"
            label="Download"
            unit="Mbps"
            color="#007AFF"
          />
          <Distribution
            measurements={page.items}
            field="upload_mbps"
            label="Upload"
            unit="Mbps"
            color="#34C759"
          />
          <Distribution
            measurements={page.items}
            field="ping_latency_ms"
            label="Ping"
            unit="ms"
            color="#FF9500"
          />
        </div>
      )}
    </div>
  );
}
