import { AlertTriangle, Home, Server } from "lucide-react";
import type { HopCorrelation } from "../../api/types";

interface HopCorrelationViewProps {
  hops: HopCorrelation[];
}

function getCorrelationColor(correlation: number): string {
  // Negative correlation means higher latency = lower speed (bad)
  if (correlation < -0.6) return "var(--g-red)";
  if (correlation < -0.4) return "var(--g-orange)";
  if (correlation < -0.2) return "var(--g-blue)";
  return "var(--g-green)";
}

function getLatencyColor(latency: number): string {
  if (latency > 100) return "var(--g-red)";
  if (latency > 50) return "var(--g-orange)";
  if (latency > 20) return "var(--g-blue)";
  return "var(--g-green)";
}

export function HopCorrelationView({ hops }: HopCorrelationViewProps) {
  if (hops.length === 0) {
    return (
      <div
        className="p-4 rounded-lg text-center"
        style={{ background: "var(--g-card-bg)" }}
      >
        <Server className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--g-text-secondary)" }} />
        <p className="text-sm" style={{ color: "var(--g-text-secondary)" }}>
          No topology data available for correlation analysis.
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--g-text-secondary)" }}>
          Run network topology scans to enable hop-speed correlation.
        </p>
      </div>
    );
  }

  const bottlenecks = hops.filter(h => h.is_bottleneck);

  return (
    <div className="space-y-4">
      {/* Bottleneck Summary */}
      {bottlenecks.length > 0 && (
        <div
          className="p-3 rounded-lg flex items-center gap-2"
          style={{ background: "var(--g-orange-tint)" }}
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "var(--g-orange)" }} />
          <p className="text-sm" style={{ color: "var(--g-text)" }}>
            <strong>{bottlenecks.length}</strong> potential bottleneck{bottlenecks.length > 1 ? "s" : ""} detected at hop{bottlenecks.length > 1 ? "s" : ""}{" "}
            {bottlenecks.map(h => h.hop_number).join(", ")}
          </p>
        </div>
      )}

      {/* Hop List */}
      <div className="relative">
        {hops.map((hop, idx) => {
          const latencyColor = getLatencyColor(hop.avg_latency_ms);
          const corrColor = getCorrelationColor(hop.latency_correlation);

          return (
            <div key={hop.hop_number} className="relative">
              {/* Connection Line */}
              {idx < hops.length - 1 && (
                <div
                  className="absolute left-4 top-10 w-0.5 h-6"
                  style={{ background: "var(--g-card-bg)" }}
                />
              )}

              <div
                className="flex items-center gap-3 p-3 rounded-lg mb-2"
                style={{
                  background: hop.is_bottleneck ? "var(--g-red-tint)" : "var(--g-card-bg)",
                  boxShadow: hop.is_bottleneck ? "inset 0 0 0 2px var(--g-red)" : undefined,
                }}
              >
                {/* Hop Icon */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: hop.is_local
                      ? "var(--g-blue-tint)"
                      : hop.is_bottleneck
                      ? "var(--g-red-tint)"
                      : "var(--g-card-bg)",
                  }}
                >
                  {hop.is_local ? (
                    <Home className="w-4 h-4" style={{ color: "var(--g-blue)" }} />
                  ) : hop.hop_number === hops[hops.length - 1]?.hop_number ? (
                    <Server className="w-4 h-4" style={{ color: "var(--g-text-secondary)" }} />
                  ) : (
                    <span className="text-xs font-medium" style={{ color: "var(--g-text-secondary)" }}>
                      {hop.hop_number}
                    </span>
                  )}
                </div>

                {/* Hop Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate" style={{ color: "var(--g-text)" }}>
                      {hop.hostname || hop.ip_address || `Hop ${hop.hop_number}`}
                    </span>
                    {hop.is_local && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: "var(--g-blue-tint)", color: "var(--g-blue)" }}
                      >
                        Local
                      </span>
                    )}
                    {hop.is_bottleneck && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: "var(--g-red)", color: "white" }}
                      >
                        Bottleneck
                      </span>
                    )}
                  </div>
                  {hop.ip_address && hop.hostname && (
                    <p className="text-xs truncate" style={{ color: "var(--g-text-secondary)" }}>
                      {hop.ip_address}
                    </p>
                  )}
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
                      Latency
                    </p>
                    <p className="text-sm font-medium" style={{ color: latencyColor }}>
                      {hop.avg_latency_ms.toFixed(1)}ms
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
                      Correlation
                    </p>
                    <p className="text-sm font-medium" style={{ color: corrColor }}>
                      {hop.latency_correlation.toFixed(2)}
                    </p>
                  </div>
                  {hop.packet_loss_pct > 0 && (
                    <div>
                      <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
                        Loss
                      </p>
                      <p className="text-sm font-medium" style={{ color: "var(--g-red)" }}>
                        {hop.packet_loss_pct.toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="text-xs p-3 rounded-lg" style={{ background: "var(--g-card-bg)" }}>
        <p style={{ color: "var(--g-text-secondary)" }}>
          <strong>Correlation</strong>: Relationship between hop latency and download speed.
          Negative values (red/orange) indicate higher latency at this hop correlates with slower speeds.
        </p>
      </div>
    </div>
  );
}
