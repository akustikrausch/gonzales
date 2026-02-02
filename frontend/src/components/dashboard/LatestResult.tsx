import type { Measurement } from "../../api/types";
import { formatDate } from "../../utils/format";
import { GlassCard } from "../ui/GlassCard";

interface LatestResultProps {
  measurement: Measurement;
}

export function LatestResult({ measurement: m }: LatestResultProps) {
  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: "var(--g-text)" }}>
          Latest Test
        </h3>
        <span className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
          {formatDate(m.timestamp)}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <p style={{ color: "var(--g-text-secondary)" }}>Server</p>
          <p className="font-medium" style={{ color: "var(--g-text)" }}>{m.server_name}</p>
        </div>
        <div>
          <p style={{ color: "var(--g-text-secondary)" }}>Location</p>
          <p className="font-medium" style={{ color: "var(--g-text)" }}>{m.server_location}</p>
        </div>
        <div>
          <p style={{ color: "var(--g-text-secondary)" }}>ISP</p>
          <p className="font-medium" style={{ color: "var(--g-text)" }}>{m.isp}</p>
        </div>
        <div>
          <p style={{ color: "var(--g-text-secondary)" }}>Packet Loss</p>
          <p className="font-medium" style={{ color: "var(--g-text)" }}>
            {m.packet_loss_pct !== null ? `${m.packet_loss_pct.toFixed(1)}%` : "N/A"}
          </p>
        </div>
      </div>
      {m.result_url && (
        <a
          href={m.result_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-xs hover:underline"
          style={{ color: "var(--g-blue)" }}
        >
          View on Speedtest.net
        </a>
      )}
    </GlassCard>
  );
}
