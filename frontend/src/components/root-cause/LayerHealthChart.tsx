import { Globe, Router, Server, Wifi, Zap } from "lucide-react";
import type { LayerScores } from "../../api/types";

interface LayerHealthChartProps {
  scores: LayerScores;
}

const layers = [
  { key: "dns_score" as const, label: "DNS", icon: Globe },
  { key: "local_network_score" as const, label: "Local Network", icon: Router },
  { key: "isp_backbone_score" as const, label: "ISP Backbone", icon: Zap },
  { key: "isp_lastmile_score" as const, label: "ISP Last-Mile", icon: Wifi },
  { key: "server_score" as const, label: "Server", icon: Server },
];

function getBarColor(score: number): string {
  if (score >= 80) return "var(--g-green)";
  if (score >= 60) return "var(--g-blue)";
  if (score >= 40) return "var(--g-orange)";
  return "var(--g-red)";
}

export function LayerHealthChart({ scores }: LayerHealthChartProps) {
  return (
    <div className="space-y-3">
      {layers.map(({ key, label, icon: Icon }) => {
        const score = scores[key];
        const color = getBarColor(score);

        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5" style={{ color: "var(--g-text-secondary)" }} />
                <span className="text-xs" style={{ color: "var(--g-text)" }}>
                  {label}
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
