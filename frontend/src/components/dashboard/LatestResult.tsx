import { useTranslation } from "react-i18next";
import type { Measurement } from "../../api/types";
import { formatDate } from "../../utils/format";
import { GlassCard } from "../ui/GlassCard";

interface LatestResultProps {
  measurement: Measurement;
}

function detectConnectionType(interfaceName: string, isVpn: boolean, t: (key: string) => string): string {
  if (isVpn) return t("latestResult.vpn");
  const name = interfaceName.toLowerCase();
  if (name.startsWith("eth") || name.startsWith("en") || name.startsWith("docker") || name.startsWith("br")) return t("latestResult.ethernet");
  if (name.startsWith("wl") || name.startsWith("wi") || name.includes("wifi") || name.includes("wlan")) return t("latestResult.wifi");
  if (name.startsWith("tun") || name.startsWith("tap") || name.startsWith("wg")) return t("latestResult.vpn");
  if (!name || name === "unknown") return t("latestResult.unknown");
  return interfaceName;
}

export function LatestResult({ measurement: m }: LatestResultProps) {
  const { t } = useTranslation();
  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: "var(--g-text)" }}>
          {t("latestResult.title")}
        </h3>
        <span className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
          {formatDate(m.timestamp)}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <p style={{ color: "var(--g-text-secondary)" }}>{t("latestResult.server")}</p>
          <p className="font-medium" style={{ color: "var(--g-text)" }}>{m.server_name}</p>
        </div>
        <div>
          <p style={{ color: "var(--g-text-secondary)" }}>Location</p>
          <p className="font-medium" style={{ color: "var(--g-text)" }}>{m.server_location}</p>
        </div>
        <div>
          <p style={{ color: "var(--g-text-secondary)" }}>{t("latestResult.isp")}</p>
          <p className="font-medium" style={{ color: "var(--g-text)" }}>{m.isp}</p>
        </div>
        <div>
          <p style={{ color: "var(--g-text-secondary)" }}>{t("latestResult.jitter")}</p>
          <p className="font-medium" style={{ color: "var(--g-text)" }}>
            {m.ping_jitter_ms !== null && m.ping_jitter_ms !== undefined
              ? `${m.ping_jitter_ms.toFixed(1)} ${t("common.ms")}`
              : t("common.noData")}
          </p>
        </div>
        <div>
          <p style={{ color: "var(--g-text-secondary)" }}>{t("latestResult.packetLoss")}</p>
          <p className="font-medium" style={{ color: "var(--g-text)" }}>
            {m.packet_loss_pct !== null && m.packet_loss_pct !== undefined
              ? `${m.packet_loss_pct.toFixed(1)}%`
              : t("common.noData")}
          </p>
        </div>
        <div>
          <p style={{ color: "var(--g-text-secondary)" }}>{t("latestResult.connectionType")}</p>
          <p className="font-medium" style={{ color: "var(--g-text)" }}>
            {detectConnectionType(m.interface_name, m.is_vpn, t)}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
