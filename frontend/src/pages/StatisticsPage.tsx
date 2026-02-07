import { useState, useCallback } from "react";
import { TrendingUp } from "lucide-react";
import { useEnhancedStatistics, useMeasurements } from "../hooks/useApi";
import { Spinner } from "../components/ui/Spinner";
import { GlassButton } from "../components/ui/GlassButton";
import { DateRangeFilter } from "../components/history/DateRangeFilter";
import { StatsOverview } from "../components/statistics/StatsOverview";
import { Percentiles } from "../components/statistics/Percentiles";
import { Distribution } from "../components/statistics/Distribution";
import { HourlyHeatmap } from "../components/statistics/HourlyHeatmap";
import { DayOfWeekChart } from "../components/statistics/DayOfWeekChart";
import { TrendChart } from "../components/statistics/TrendChart";
import { SlaCard } from "../components/statistics/SlaCard";
import { ReliabilityCard } from "../components/statistics/ReliabilityCard";
import { ServerComparison } from "../components/statistics/ServerComparison";
import { ConnectionComparisonSection } from "../components/statistics/ConnectionComparisonSection";
import { IspScoreCard } from "../components/statistics/IspScoreCard";
import { PeakAnalysis } from "../components/statistics/PeakAnalysis";
import { TimePeriodOverview } from "../components/statistics/TimePeriodOverview";
import { QualityTimeline } from "../components/statistics/QualityTimeline";
import { CorrelationMatrixView } from "../components/statistics/CorrelationMatrix";
import { DegradationAlertBanner } from "../components/statistics/DegradationAlert";
import { OutageSection } from "../components/statistics/OutageSection";

type Tab = "overview" | "time" | "trends" | "insights" | "servers" | "outages";

const tabs: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "time", label: "Time Analysis" },
  { key: "trends", label: "Trends" },
  { key: "insights", label: "Insights" },
  { key: "servers", label: "Servers" },
  { key: "outages", label: "Outages" },
];

export function StatisticsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const dateParams = {
    start_date: startDate ? new Date(startDate).toISOString() : undefined,
    end_date: endDate ? new Date(endDate).toISOString() : undefined,
  };

  const { data: enhanced, isLoading } = useEnhancedStatistics(dateParams);
  const { data: page } = useMeasurements({ page_size: 100, ...dateParams });

  // Keyboard navigation for tabs - must be before conditional returns
  const handleTabKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
    let newIndex = currentIndex;

    if (e.key === "ArrowRight") {
      newIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      newIndex = 0;
    } else if (e.key === "End") {
      newIndex = tabs.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    setActiveTab(tabs[newIndex].key);

    // Focus the new tab button
    const tabButtons = document.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabButtons[newIndex]?.focus();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner size={32} />
      </div>
    );
  }
  if (!enhanced) return null;

  const stats = enhanced.basic;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between g-animate-in">
        <h2
          className="text-xl font-bold flex items-center gap-2"
          style={{ color: "var(--g-text)" }}
        >
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

      {/* Degradation alerts at top */}
      {enhanced.degradation_alerts.length > 0 && (
        <DegradationAlertBanner alerts={enhanced.degradation_alerts} />
      )}

      <div
        className="flex gap-2 overflow-x-auto scrollbar-hide snap-x pb-1 -mb-1 g-animate-in g-stagger-1"
        role="tablist"
        aria-label="Statistics sections"
      >
        {tabs.map((tab, index) => (
          <GlassButton
            key={tab.key}
            size="sm"
            variant={activeTab === tab.key ? "primary" : "default"}
            onClick={() => setActiveTab(tab.key)}
            onKeyDown={(e) => handleTabKeyDown(e, index)}
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`tabpanel-${tab.key}`}
            id={`tab-${tab.key}`}
            tabIndex={activeTab === tab.key ? 0 : -1}
            className="snap-start shrink-0"
          >
            {tab.label}
          </GlassButton>
        ))}
      </div>

      <div className="g-animate-in g-stagger-2">
        {activeTab === "overview" && (
          <div
            className="space-y-4"
            role="tabpanel"
            id="tabpanel-overview"
            aria-labelledby="tab-overview"
          >
            {enhanced.isp_score && <IspScoreCard score={enhanced.isp_score} />}
            <StatsOverview stats={stats} />
            {stats.download && (
              <Percentiles label="Download" stat={stats.download} unit="Mbps" color="var(--g-blue)" />
            )}
            {stats.upload && (
              <Percentiles label="Upload" stat={stats.upload} unit="Mbps" color="var(--g-green)" />
            )}
            {stats.ping && (
              <Percentiles label="Ping" stat={stats.ping} unit="ms" color="var(--g-orange)" />
            )}
            {page && page.items.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Distribution
                  measurements={page.items}
                  field="download_mbps"
                  label="Download"
                  unit="Mbps"
                  color="var(--g-blue)"
                />
                <Distribution
                  measurements={page.items}
                  field="upload_mbps"
                  label="Upload"
                  unit="Mbps"
                  color="var(--g-green)"
                />
                <Distribution
                  measurements={page.items}
                  field="ping_latency_ms"
                  label="Ping"
                  unit="ms"
                  color="var(--g-orange)"
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "time" && (
          <div
            className="space-y-4"
            role="tabpanel"
            id="tabpanel-time"
            aria-labelledby="tab-time"
          >
            {enhanced.time_periods && (
              <TimePeriodOverview data={enhanced.time_periods} />
            )}
            <QualityTimeline
              data={enhanced.hourly}
              downloadThreshold={stats.download_threshold_mbps}
            />
            {enhanced.peak_offpeak && (
              <PeakAnalysis
                peakOffPeak={enhanced.peak_offpeak}
                bestWorstTimes={enhanced.best_worst_times}
              />
            )}
            <HourlyHeatmap data={enhanced.hourly} />
            <DayOfWeekChart data={enhanced.daily} />
          </div>
        )}

        {activeTab === "trends" && (
          <div
            className="space-y-4"
            role="tabpanel"
            id="tabpanel-trends"
            aria-labelledby="tab-trends"
          >
            <TrendChart
              trend={enhanced.trend}
              predictions={enhanced.predictions}
              enhancedPredictions={enhanced.enhanced_predictions}
              downloadThreshold={stats.effective_download_threshold_mbps}
              uploadThreshold={stats.effective_upload_threshold_mbps}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SlaCard sla={enhanced.sla} />
              <ReliabilityCard reliability={enhanced.reliability} />
            </div>
          </div>
        )}

        {activeTab === "insights" && (
          <div
            className="space-y-4"
            role="tabpanel"
            id="tabpanel-insights"
            aria-labelledby="tab-insights"
          >
            {enhanced.isp_score && <IspScoreCard score={enhanced.isp_score} />}
            {enhanced.correlations && (
              <CorrelationMatrixView data={enhanced.correlations} />
            )}
            {enhanced.peak_offpeak && (
              <PeakAnalysis
                peakOffPeak={enhanced.peak_offpeak}
                bestWorstTimes={enhanced.best_worst_times}
              />
            )}
            {enhanced.anomalies.length > 0 && (
              <div className="space-y-2">
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "var(--g-text)" }}
                >
                  Anomalies Detected ({enhanced.anomalies.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {enhanced.anomalies.slice(0, 12).map((a, i) => (
                    <div
                      key={`${a.timestamp}-${a.metric}-${i}`}
                      className="flex items-center gap-2 p-2 rounded-lg"
                      style={{ background: "var(--g-red)08" }}
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: "var(--g-red)" }}
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-medium block truncate" style={{ color: "var(--g-text)" }}>
                          {a.metric}: {a.value} (z={a.z_score})
                        </span>
                        <span className="text-[10px]" style={{ color: "var(--g-text-tertiary)" }}>
                          Mean: {a.mean} / {new Date(a.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "servers" && (
          <div
            className="space-y-4"
            role="tabpanel"
            id="tabpanel-servers"
            aria-labelledby="tab-servers"
          >
            {enhanced.connection_comparison && (
              <ConnectionComparisonSection comparison={enhanced.connection_comparison} />
            )}
            <ServerComparison servers={enhanced.by_server} />
          </div>
        )}

        {activeTab === "outages" && (
          <div
            role="tabpanel"
            id="tabpanel-outages"
            aria-labelledby="tab-outages"
          >
            <OutageSection
              startDate={dateParams.start_date}
              endDate={dateParams.end_date}
            />
          </div>
        )}
      </div>
    </div>
  );
}
