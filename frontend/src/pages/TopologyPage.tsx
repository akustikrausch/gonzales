import { useState } from "react";
import { Network, Play, Info, AlertTriangle, CheckCircle, Clock, History } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLatestTopology, useTopologyHistory, useNetworkDiagnosis, useAnalyzeTopology } from "../hooks/useApi";
import { Spinner } from "../components/ui/Spinner";
import { HopVisualization } from "../components/topology/HopVisualization";
import { TopologyHistoryList } from "../components/topology/TopologyHistoryList";
import type { NetworkTopology } from "../api/types";

export function TopologyPage() {
  const { t } = useTranslation();
  const { data: latestTopology, isLoading: topologyLoading } = useLatestTopology();
  const { data: historyData, isLoading: historyLoading } = useTopologyHistory(5);
  const { data: diagnosis, isLoading: diagnosisLoading } = useNetworkDiagnosis(7);
  const analyzeMutation = useAnalyzeTopology();
  const [selectedTopology, setSelectedTopology] = useState<NetworkTopology | null>(null);

  const displayedTopology = selectedTopology || latestTopology;
  const isLoading = topologyLoading || historyLoading || diagnosisLoading;

  const handleAnalyze = () => {
    analyzeMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between g-animate-in">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5" style={{ color: "var(--g-accent)" }} />
          <h2 className="text-xl font-bold" style={{ color: "var(--g-text)" }}>
            {t("topology.title")}
          </h2>
        </div>
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={analyzeMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex-shrink-0 hover:opacity-90"
          style={{
            backgroundColor: "#22c55e",
            color: "#ffffff",
            minWidth: "140px",
          }}
        >
          {analyzeMutation.isPending ? (
            <Spinner size={16} />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {t("topology.analyzeNow")}
        </button>
      </div>

      {/* Network Diagnosis Summary */}
      {diagnosis && diagnosis.total_analyses > 0 && (
        <div className="glass-card p-6 g-animate-in g-stagger-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: "var(--g-text)" }}>
              {t("topology.networkHealth")}
            </h3>
            <div
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor:
                  diagnosis.overall_status === "healthy"
                    ? "rgba(34, 197, 94, 0.2)"
                    : diagnosis.overall_status === "degraded"
                      ? "rgba(234, 179, 8, 0.2)"
                      : "rgba(239, 68, 68, 0.2)",
                color:
                  diagnosis.overall_status === "healthy"
                    ? "var(--g-green)"
                    : diagnosis.overall_status === "degraded"
                      ? "var(--g-amber)"
                      : "var(--g-red)",
              }}
            >
              {diagnosis.overall_status === "healthy" && <CheckCircle className="w-4 h-4 inline mr-1" />}
              {diagnosis.overall_status === "degraded" && <AlertTriangle className="w-4 h-4 inline mr-1" />}
              {diagnosis.overall_status === "problematic" && <AlertTriangle className="w-4 h-4 inline mr-1" />}
              {t(`topology.${diagnosis.overall_status}`)}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div title="Percentage of analyses where local network hops had acceptable latency">
              <p className="text-xs cursor-help" style={{ color: "var(--g-text-secondary)" }}>{t("topology.localNetworkHealth")}</p>
              <p className="text-xl font-bold" style={{ color: "var(--g-text)" }}>
                {diagnosis.local_network_health_pct.toFixed(0)}%
              </p>
            </div>
            <div title="Average number of network hops to reach the target">
              <p className="text-xs cursor-help" style={{ color: "var(--g-text-secondary)" }}>{t("topology.avgHops")}</p>
              <p className="text-xl font-bold" style={{ color: "var(--g-text)" }}>
                {diagnosis.avg_total_hops.toFixed(1)}
              </p>
            </div>
            <div title="Average total round-trip time across all hops">
              <p className="text-xs cursor-help" style={{ color: "var(--g-text-secondary)" }}>{t("topology.avgLatency")}</p>
              <p className="text-xl font-bold" style={{ color: "var(--g-text)" }}>
                {diagnosis.avg_total_latency_ms.toFixed(1)} {t("common.ms")}
              </p>
            </div>
            <div title="Total number of traceroute analyses performed">
              <p className="text-xs cursor-help" style={{ color: "var(--g-text-secondary)" }}>{t("topology.analyses")}</p>
              <p className="text-xl font-bold" style={{ color: "var(--g-text)" }}>
                {diagnosis.total_analyses}
              </p>
            </div>
          </div>

          {diagnosis.recommendations.length > 0 && (
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--g-border)" }}>
              <p className="text-sm font-medium mb-2" style={{ color: "var(--g-text)" }}>
                {t("topology.recommendations")}
              </p>
              <ul className="space-y-1">
                {diagnosis.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--g-text-secondary)" }}>
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--g-amber)" }} />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Main Content - Topology Visualization and History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Topology Visualization */}
        <div className="lg:col-span-2 glass-card p-6 g-animate-in g-stagger-2">
          {displayedTopology ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: "var(--g-text)" }}>
                    {t("topology.routeAnalysis")}
                  </h3>
                  <p className="text-sm" style={{ color: "var(--g-text-secondary)" }}>
                    {t("topology.target")}: {displayedTopology.target_host}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: "var(--g-text-secondary)" }}>
                  <Clock className="w-4 h-4" />
                  {new Date(displayedTopology.timestamp).toLocaleString()}
                </div>
              </div>

              {/* Diagnosis banner */}
              <div
                className="mb-4 p-3 rounded-lg flex items-center gap-2"
                style={{
                  backgroundColor: displayedTopology.local_network_ok
                    ? "rgba(34, 197, 94, 0.1)"
                    : "rgba(239, 68, 68, 0.1)",
                }}
              >
                {displayedTopology.local_network_ok ? (
                  <CheckCircle className="w-5 h-5" style={{ color: "var(--g-green)" }} />
                ) : (
                  <AlertTriangle className="w-5 h-5" style={{ color: "var(--g-red)" }} />
                )}
                <span
                  className="text-sm font-medium"
                  style={{
                    color: displayedTopology.local_network_ok ? "var(--g-green)" : "var(--g-red)",
                  }}
                >
                  {displayedTopology.diagnosis}
                </span>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: "var(--g-surface)" }}>
                  <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>{t("topology.totalHops")}</p>
                  <p className="text-xl font-bold" style={{ color: "var(--g-text)" }}>
                    {displayedTopology.total_hops}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: "var(--g-surface)" }}>
                  <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>{t("topology.totalLatency")}</p>
                  <p className="text-xl font-bold" style={{ color: "var(--g-text)" }}>
                    {displayedTopology.total_latency_ms.toFixed(1)} {t("common.ms")}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: "var(--g-surface)" }}>
                  <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>{t("topology.bottleneck")}</p>
                  <p className="text-xl font-bold" style={{ color: displayedTopology.bottleneck_hop ? "var(--g-amber)" : "var(--g-green)" }}>
                    {displayedTopology.bottleneck_hop ? `${t("topology.hop")} ${displayedTopology.bottleneck_hop}` : t("topology.none")}
                  </p>
                </div>
              </div>

              {/* Hops visualization */}
              <HopVisualization hops={displayedTopology.hops} bottleneckHop={displayedTopology.bottleneck_hop} />
            </>
          ) : (
            <div className="text-center py-12">
              <Network className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--g-text-secondary)" }} />
              <p style={{ color: "var(--g-text-secondary)" }}>
                {t("topology.noData")}
              </p>
            </div>
          )}
        </div>

        {/* History Sidebar */}
        <div className="glass-card p-6 g-animate-in g-stagger-3">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5" style={{ color: "var(--g-text-secondary)" }} />
            <h3 className="text-lg font-semibold" style={{ color: "var(--g-text)" }}>
              {t("topology.historyRecent")}
            </h3>
          </div>

          {historyData && historyData.entries.length > 0 ? (
            <TopologyHistoryList
              entries={historyData.entries}
              selectedId={displayedTopology?.id}
              onSelect={(entry) => {
                if (entry.id === latestTopology?.id) {
                  setSelectedTopology(null);
                } else {
                  // Fetch full topology when selected
                  // For now, just show that it's selected
                  setSelectedTopology(null);
                }
              }}
            />
          ) : (
            <p className="text-sm" style={{ color: "var(--g-text-secondary)" }}>
              {t("topology.noAnalysisHistory")}
            </p>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 text-sm g-animate-in g-stagger-4" style={{ color: "var(--g-text-secondary)" }}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--g-green)" }} />
          <span>{t("topology.excellent")}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--g-amber)" }} />
          <span>{t("topology.good")}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--g-red)" }} />
          <span>{t("topology.high")}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--g-text-secondary)" }} />
          <span>{t("topology.timeout")}</span>
        </div>
      </div>
    </div>
  );
}
