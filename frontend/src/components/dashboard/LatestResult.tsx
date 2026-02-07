import type { Measurement } from "../../api/types";
import { formatDate } from "../../utils/format";
import { GlassCard } from "../ui/GlassCard";

interface LatestResultProps {
  measurement: Measurement;
}

function detectConnectionType(interfaceName: string, isVpn: boolean): string {
  if (isVpn) return "VPN";
  const name = interfaceName.toLowerCase();
  if (name.startsWith("eth") || name.startsWith("en") || name.startsWith("docker") || name.startsWith("br")) return "Ethernet";
  if (name.startsWith("wl") || name.startsWith("wi") || name.includes("wifi") || name.includes("wlan")) return "WiFi";
  if (name.startsWith("tun") || name.startsWith("tap") || name.startsWith("wg")) return "VPN";
  if (!name || name === "unknown") return "Unknown";
  return interfaceName;
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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
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
          <p style={{ color: "var(--g-text-secondary)" }}>Jitter</p>
          <p className="font-medium" style={{ color: "var(--g-text)" }}>
            {m.ping_jitter_ms !== null && m.ping_jitter_ms !== undefined
              ? `${m.ping_jitter_ms.toFixed(1)} ms`
              : "N/A"}
          </p>
        </div>
        <div>
          <p style={{ color: "var(--g-text-secondary)" }}>Packet Loss</p>
          <p className="font-medium" style={{ color: "var(--g-text)" }}>
            {m.packet_loss_pct !== null && m.packet_loss_pct !== undefined
              ? `${m.packet_loss_pct.toFixed(1)}%`
              : "N/A"}
          </p>
        </div>
        <div>
          <p style={{ color: "var(--g-text-secondary)" }}>Connection</p>
          <p className="font-medium" style={{ color: "var(--g-text)" }}>
            {detectConnectionType(m.interface_name, m.is_vpn)}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
