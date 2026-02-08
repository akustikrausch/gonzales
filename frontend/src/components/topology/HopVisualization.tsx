import { Server, Router, Globe, Home, AlertTriangle, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
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

function getStatusBadge(status: string, t: (key: string) => string): { color: string; label: string } {
  switch (status) {
    case "ok":
      return { color: "var(--g-green)", label: t("topology.ok") };
    case "high_latency":
      return { color: "var(--g-amber)", label: t("topology.highLatency") };
    case "packet_loss":
      return { color: "var(--g-red)", label: t("topology.packetLossStatus") };
    case "timeout":
      return { color: "var(--g-text-secondary)", label: t("topology.timeoutStatus") };
    default:
      return { color: "var(--g-text-secondary)", label: status };
  }
}

function HopIcon({ hop, t }: { hop: NetworkHop; t: (key: string) => string }) {
  if (hop.hop_number === 1) {
    return <span title={t("topology.localGateway")}><Home className="w-5 h-5" style={{ color: "var(--g-blue)" }} /></span>;
  }
  if (hop.is_local) {
    return <span title={t("topology.localDevice")}><Router className="w-5 h-5" style={{ color: "var(--g-purple)" }} /></span>;
  }
  if (hop.is_timeout) {
    return <span title={t("topology.noResponseBlocked")}><Clock className="w-5 h-5" style={{ color: "var(--g-text-secondary)" }} /></span>;
  }
  return <span title={t("topology.internetRouter")}><Server className="w-5 h-5" style={{ color: "var(--g-cyan)" }} /></span>;
}

export function HopVisualization({ hops, bottleneckHop }: HopVisualizationProps) {
  const { t } = useTranslation();

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
          <p className="font-medium" style={{ color: "var(--g-text)" }}>{t("topology.yourDevice")}</p>
          <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>{t("topology.startingPoint")}</p>
        </div>
      </div>

      {/* Hops */}
      {hops.map((hop, index) => {
        const isBottleneck = hop.hop_number === bottleneckHop;
        const latencyColor = getLatencyColor(hop.latency_ms, hop.is_timeout);
        const status = getStatusBadge(hop.status, t);

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
                <HopIcon hop={hop} t={t} />
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
                      {t("topology.bottleneck")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: "var(--g-text-secondary)" }}>
                  {hop.ip_address && hop.hostname && (
                    <span>{hop.ip_address}</span>
                  )}
                  {hop.is_local && (
                    <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(139, 92, 246, 0.2)", color: "var(--g-purple)" }}>
                      {t("topology.local")}
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
                  <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>{t("common.ms")}</p>
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
                    <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>{t("history.packetLoss").toLowerCase()}</p>
                  </div>
                )}

                {/* Status badge */}
                <div
                  className="px-2 py-1 rounded text-xs font-medium cursor-help"
                  style={{
                    backgroundColor: `${status.color}20`,
                    color: status.color,
                  }}
                  title={
                    hop.status === "ok" ? t("topology.responseNormal") :
                    hop.status === "high_latency" ? t("topology.responseLow") :
                    hop.status === "packet_loss" ? t("topology.packetLossDetected") :
                    hop.status === "timeout" ? t("topology.noResponse") : ""
                  }
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
            <p className="font-medium" style={{ color: "var(--g-text)" }}>{t("topology.destination")}</p>
            <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>{t("topology.targetReached")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
