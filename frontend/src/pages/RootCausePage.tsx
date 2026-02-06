import { useState } from "react";
import { Activity, Calendar, RefreshCw, Search, TrendingUp } from "lucide-react";
import { GlassCard } from "../components/ui/GlassCard";
import { GlassButton } from "../components/ui/GlassButton";
import { Spinner } from "../components/ui/Spinner";
import {
  HopCorrelationView,
  LayerHealthChart,
  NetworkHealthGauge,
  ProblemFingerprintCard,
  RecommendationsList,
  TimePatternCard,
} from "../components/root-cause";
import { useRootCauseAnalysis } from "../hooks/useApi";

const analysisWindows = [
  { value: 7, label: "7 Days" },
  { value: 14, label: "14 Days" },
  { value: 30, label: "30 Days" },
  { value: 60, label: "60 Days" },
  { value: 90, label: "90 Days" },
];

export function RootCausePage() {
  const [days, setDays] = useState(30);
  const { data: analysis, isLoading, refetch, isFetching } = useRootCauseAnalysis({ days });

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-xl font-semibold flex items-center gap-2"
            style={{ color: "var(--g-text)" }}
          >
            <Search className="w-5 h-5" style={{ color: "var(--g-text-secondary)" }} />
            Root-Cause Analysis
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--g-text-secondary)" }}>
            Identify and diagnose network performance issues
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Analysis Window Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" style={{ color: "var(--g-text-secondary)" }} />
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="text-sm rounded-lg px-3 py-1.5 border-none outline-none"
              style={{
                background: "var(--g-card-bg)",
                color: "var(--g-text)",
              }}
            >
              {analysisWindows.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>

          <GlassButton
            variant="default"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <Spinner size={16} />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="ml-2 hidden sm:inline">Refresh</span>
          </GlassButton>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size={32} />
        </div>
      ) : !analysis ? (
        <GlassCard>
          <div className="text-center py-12">
            <Activity className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--g-text-secondary)" }} />
            <h2 className="text-lg font-medium" style={{ color: "var(--g-text)" }}>
              No Analysis Available
            </h2>
            <p className="text-sm mt-2" style={{ color: "var(--g-text-secondary)" }}>
              Not enough data to perform root-cause analysis.
              Run more speed tests to gather data.
            </p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {/* Top Section: Health Score + Layer Scores */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Health Score */}
            <GlassCard className="g-stagger-1 lg:col-span-1">
              <div className="flex flex-col items-center py-4">
                <NetworkHealthGauge score={analysis.network_health_score} />
                <div className="mt-4 text-center">
                  <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
                    Based on {analysis.measurement_count} measurements
                    {analysis.topology_count > 0 && ` and ${analysis.topology_count} topology scans`}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--g-text-secondary)" }}>
                    Analysis window: {analysis.data_window_days} days
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Layer Health */}
            <GlassCard className="g-stagger-2 lg:col-span-2">
              <h3
                className="text-sm font-semibold mb-4 flex items-center gap-2"
                style={{ color: "var(--g-text)" }}
              >
                <TrendingUp className="w-4 h-4" style={{ color: "var(--g-text-secondary)" }} />
                Layer Health Breakdown
              </h3>
              <LayerHealthChart scores={analysis.layer_scores} />
            </GlassCard>
          </div>

          {/* Primary Diagnosis */}
          {analysis.primary_cause && (
            <GlassCard className="g-stagger-3">
              <h3
                className="text-sm font-semibold mb-4 flex items-center gap-2"
                style={{ color: "var(--g-text)" }}
              >
                <Activity className="w-4 h-4" style={{ color: "var(--g-text-secondary)" }} />
                Primary Diagnosis
              </h3>
              <ProblemFingerprintCard fingerprint={analysis.primary_cause} isPrimary />
            </GlassCard>
          )}

          {/* Secondary Issues */}
          {analysis.secondary_causes.length > 0 && (
            <GlassCard className="g-stagger-4">
              <h3
                className="text-sm font-semibold mb-4"
                style={{ color: "var(--g-text)" }}
              >
                Additional Issues ({analysis.secondary_causes.length})
              </h3>
              <div className="space-y-3">
                {analysis.secondary_causes.map((fp, idx) => (
                  <ProblemFingerprintCard key={idx} fingerprint={fp} />
                ))}
              </div>
            </GlassCard>
          )}

          {/* Time Pattern + Connection Impact */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="g-stagger-5">
              <h3
                className="text-sm font-semibold mb-4"
                style={{ color: "var(--g-text)" }}
              >
                Time-Based Patterns
              </h3>
              <TimePatternCard pattern={analysis.time_pattern} />
            </GlassCard>

            <GlassCard className="g-stagger-6">
              <h3
                className="text-sm font-semibold mb-4"
                style={{ color: "var(--g-text)" }}
              >
                Connection Type Impact
              </h3>
              {analysis.connection_impact ? (
                <div
                  className="p-4 rounded-lg"
                  style={{
                    background: analysis.connection_impact.has_significant_difference
                      ? "var(--g-orange-tint)"
                      : "var(--g-green-tint)",
                  }}
                >
                  <p className="text-sm" style={{ color: "var(--g-text)" }}>
                    {analysis.connection_impact.recommendation}
                  </p>
                  {analysis.connection_impact.has_significant_difference && (
                    <div className="mt-3 grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
                          Best
                        </p>
                        <p className="text-sm font-medium capitalize" style={{ color: "var(--g-green)" }}>
                          {analysis.connection_impact.best_connection}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
                          Worst
                        </p>
                        <p className="text-sm font-medium capitalize" style={{ color: "var(--g-orange)" }}>
                          {analysis.connection_impact.worst_connection}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="p-4 rounded-lg text-center"
                  style={{ background: "var(--g-card-bg)" }}
                >
                  <p className="text-sm" style={{ color: "var(--g-text-secondary)" }}>
                    Not enough data from different connection types.
                  </p>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Hop Correlations */}
          {analysis.hop_correlations.length > 0 && (
            <GlassCard className="g-stagger-7">
              <h3
                className="text-sm font-semibold mb-4"
                style={{ color: "var(--g-text)" }}
              >
                Hop-Speed Correlation Analysis
              </h3>
              <HopCorrelationView hops={analysis.hop_correlations} />
            </GlassCard>
          )}

          {/* Recommendations */}
          <GlassCard className="g-stagger-8">
            <h3
              className="text-sm font-semibold mb-4"
              style={{ color: "var(--g-text)" }}
            >
              Recommendations
            </h3>
            <RecommendationsList recommendations={analysis.recommendations} />
          </GlassCard>
        </div>
      )}
    </div>
  );
}
