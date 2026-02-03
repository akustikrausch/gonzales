import { useState } from "react";
import { Activity, CheckCircle, XCircle, Info } from "lucide-react";
import { useCurrentQosStatus } from "../hooks/useApi";
import { Spinner } from "../components/ui/Spinner";
import { QosProfileCard } from "../components/qos/QosProfileCard";
import { QosDetailModal } from "../components/qos/QosDetailModal";
import type { QosTestResult } from "../api/types";

export function QosPage() {
  const { data: qosStatus, isLoading } = useCurrentQosStatus();
  const [selectedResult, setSelectedResult] = useState<QosTestResult | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner size={32} />
      </div>
    );
  }

  if (!qosStatus) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 g-animate-in">
          <Activity className="w-5 h-5" style={{ color: "var(--g-accent)" }} />
          <h2 className="text-xl font-bold" style={{ color: "var(--g-text)" }}>
            QoS Tests
          </h2>
        </div>

        <div className="glass-card p-8 text-center g-animate-in g-stagger-1">
          <Info className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--g-text-secondary)" }} />
          <p style={{ color: "var(--g-text-secondary)" }}>
            No measurement data available yet. Run a speed test to see QoS analysis.
          </p>
        </div>
      </div>
    );
  }

  const passedCount = qosStatus.passed_profiles;
  const totalCount = qosStatus.total_profiles;
  const passRate = Math.round((passedCount / totalCount) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between g-animate-in">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5" style={{ color: "var(--g-accent)" }} />
          <h2 className="text-xl font-bold" style={{ color: "var(--g-text)" }}>
            QoS Tests
          </h2>
        </div>
        <p className="text-sm" style={{ color: "var(--g-text-secondary)" }}>
          Based on latest measurement
        </p>
      </div>

      {/* Summary Card */}
      <div className="glass-card p-6 g-animate-in g-stagger-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--g-text)" }}>
              Application Compatibility
            </h3>
            <p className="text-sm" style={{ color: "var(--g-text-secondary)" }}>
              {qosStatus.summary}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-5 h-5" style={{ color: "var(--g-green)" }} />
                <span className="text-2xl font-bold" style={{ color: "var(--g-green)" }}>
                  {passedCount}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>Optimal</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1">
                <XCircle className="w-5 h-5" style={{ color: "var(--g-red)" }} />
                <span className="text-2xl font-bold" style={{ color: "var(--g-red)" }}>
                  {totalCount - passedCount}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>Limited</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1" style={{ color: "var(--g-text-secondary)" }}>
            <span>Compatibility Score</span>
            <span>{passRate}%</span>
          </div>
          <div className="h-2 rounded-full" style={{ backgroundColor: "var(--g-surface)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${passRate}%`,
                backgroundColor: passRate >= 80 ? "var(--g-green)" : passRate >= 50 ? "var(--g-amber)" : "var(--g-red)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Profile Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 g-animate-in g-stagger-2">
        {qosStatus.results.map((result) => (
          <QosProfileCard
            key={result.profile_id}
            result={result}
            onClick={() => setSelectedResult(result)}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm g-animate-in g-stagger-3" style={{ color: "var(--g-text-secondary)" }}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--g-green)" }} />
          <span>All requirements met</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--g-red)" }} />
          <span>Some requirements not met</span>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedResult && (
        <QosDetailModal
          result={selectedResult}
          onClose={() => setSelectedResult(null)}
        />
      )}
    </div>
  );
}
