import { Server, Router, Globe, Home, AlertTriangle, Clock } from "lucide-react";
import type { NetworkHop } from "../../api/types";

interface HopVisualizationProps {
  hops: NetworkHop[];
  bottleneckHop: number | null;
}

function getLatencyColor(latency: number | null, isTimeout: boolean): string {
  if (isTimeout || latency === null) return "var(--g-text-secondary)";
  if (latency < 20) return "var(--g-green)";
  if (latency < 50) return "var(--g-amber)";
  return "var(--g-red)";
}

function getStatusBadge(status: string): { color: string; label: string } {
  switch (status) {
    case "ok":
      return { color: "var(--g-green)", label: "OK" };
    case "high_latency":
      return { color: "var(--g-amber)", label: "High Latency" };
    case "packet_loss":
      return { color: "var(--g-red)", label: "Packet Loss" };
    case "timeout":
      return { color: "var(--g-text-secondary)", label: "Timeout" };
    default:
      return { color: "var(--g-text-secondary)", label: status };
  }
}

function HopIcon({ hop }: { hop: NetworkHop }) {
  if (hop.hop_number === 1) {
    return <Home className="w-5 h-5" style={{ color: "var(--g-blue)" }} />;
  }
  if (hop.is_local) {
    return <Router className="w-5 h-5" style={{ color: "var(--g-purple)" }} />;
  }
  if (hop.is_timeout) {
    return <Clock className="w-5 h-5" style={{ color: "var(--g-text-secondary)" }} />;
  }
  return <Server className="w-5 h-5" style={{ color: "var(--g-cyan)" }} />;
}

export function HopVisualization({ hops, bottleneckHop }: HopVisualizationProps) {
  return (
    <div className="space-y-2">
      {/* Start point */}
      <div className="flex items-center gap-3 p-2">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--g-blue)", opacity: 0.2 }}
        >
          <Home className="w-5 h-5" style={{ color: "var(--g-blue)" }} />
        </div>
        <div>
          <p className="font-medium" style={{ color: "var(--g-text)" }}>Your Device</p>
          <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>Starting point</p>
        </div>
      </div>

      {/* Hops */}
      {hops.map((hop, index) => {
        const isBottleneck = hop.hop_number === bottleneckHop;
        const latencyColor = getLatencyColor(hop.latency_ms, hop.is_timeout);
        const status = getStatusBadge(hop.status);

        return (
          <div key={hop.hop_number} className="relative">
            {/* Connector line */}
            <div
              className="absolute left-5 -top-2 w-0.5 h-4"
              style={{ backgroundColor: "var(--g-border)" }}
            />

            {/* Hop card */}
            <div
              className="flex items-center gap-3 p-3 rounded-lg transition-all"
              style={{
                backgroundColor: isBottleneck ? "rgba(234, 179, 8, 0.1)" : "var(--g-surface)",
                boxShadow: isBottleneck ? "0 0 0 2px var(--g-amber)" : undefined,
              }}
            >
              {/* Hop number and icon */}
              <div className="flex items-center gap-2">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: latencyColor,
                    color: "var(--g-bg)",
                    opacity: hop.is_timeout ? 0.5 : 1,
                  }}
                >
                  {hop.hop_number}
                </span>
                <HopIcon hop={hop} />
              </div>

              {/* Hop info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className="font-medium truncate"
                    style={{ color: hop.is_timeout ? "var(--g-text-secondary)" : "var(--g-text)" }}
                  >
                    {hop.hostname || hop.ip_address || "* * *"}
                  </p>
                  {isBottleneck && (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(234, 179, 8, 0.2)", color: "var(--g-amber)" }}>
                      <AlertTriangle className="w-3 h-3" />
                      Bottleneck
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: "var(--g-text-secondary)" }}>
                  {hop.ip_address && hop.hostname && (
                    <span>{hop.ip_address}</span>
                  )}
                  {hop.is_local && (
                    <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(139, 92, 246, 0.2)", color: "var(--g-purple)" }}>
                      Local
                    </span>
                  )}
                </div>
              </div>

              {/* Metrics */}
              <div className="flex items-center gap-4 text-right">
                {/* Latency */}
                <div>
                  <p
                    className="text-lg font-bold"
                    style={{ color: latencyColor }}
                  >
                    {hop.is_timeout ? "---" : hop.latency_ms !== null ? `${hop.latency_ms.toFixed(1)}` : "---"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>ms</p>
                </div>

                {/* Packet loss */}
                {hop.packet_loss_pct > 0 && (
                  <div>
                    <p
                      className="text-lg font-bold"
                      style={{ color: "var(--g-red)" }}
                    >
                      {hop.packet_loss_pct.toFixed(0)}%
                    </p>
                    <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>loss</p>
                  </div>
                )}

                {/* Status badge */}
                <div
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: `${status.color}20`,
                    color: status.color,
                  }}
                >
                  {status.label}
                </div>
              </div>
            </div>

            {/* Connector to next (except last) */}
            {index < hops.length - 1 && (
              <div
                className="absolute left-5 bottom-0 w-0.5 h-2"
                style={{ backgroundColor: "var(--g-border)" }}
              />
            )}
          </div>
        );
      })}

      {/* End point */}
      <div className="relative">
        <div
          className="absolute left-5 -top-2 w-0.5 h-4"
          style={{ backgroundColor: "var(--g-border)" }}
        />
        <div className="flex items-center gap-3 p-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--g-green)", opacity: 0.2 }}
          >
            <Globe className="w-5 h-5" style={{ color: "var(--g-green)" }} />
          </div>
          <div>
            <p className="font-medium" style={{ color: "var(--g-text)" }}>Destination</p>
            <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>Target reached</p>
          </div>
        </div>
      </div>
    </div>
  );
}
