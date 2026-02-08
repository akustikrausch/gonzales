import { Globe, Router, Server, Wifi, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { LayerScores } from "../../api/types";

interface LayerHealthChartProps {
  scores: LayerScores;
}

const layers = [
  { key: "dns_score" as const, labelKey: "rootCause.dns", icon: Globe },
  { key: "local_network_score" as const, labelKey: "rootCause.localNetwork", icon: Router },
  { key: "isp_backbone_score" as const, labelKey: "rootCause.ispBackbone", icon: Zap },
  { key: "isp_lastmile_score" as const, labelKey: "rootCause.ispLastMile", icon: Wifi },
  { key: "server_score" as const, labelKey: "rootCause.server", icon: Server },
];

function getBarColor(score: number): string {
  if (score >= 80) return "var(--g-green)";
  if (score >= 60) return "var(--g-blue)";
  if (score >= 40) return "var(--g-orange)";
  return "var(--g-red)";
}

export function LayerHealthChart({ scores }: LayerHealthChartProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {layers.map(({ key, labelKey, icon: Icon }) => {
        const score = scores[key];
        const color = getBarColor(score);

        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5" style={{ color: "var(--g-text-secondary)" }} />
                <span className="text-xs" style={{ color: "var(--g-text)" }}>
                  {t(labelKey)}
                </span>
              </div>
              <span className="text-xs font-medium" style={{ color }}>
                {Math.round(score)}%
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: "var(--g-card-bg)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${score}%`,
                  background: color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
