import { useTranslation } from "react-i18next";
import type { CorrelationMatrix as CorrelationMatrixType } from "../../api/types";
import { GlassCard } from "../ui/GlassCard";

interface CorrelationMatrixProps {
  data: CorrelationMatrixType;
}

function getCellColor(coefficient: number): string {
  const abs = Math.abs(coefficient);
  if (coefficient > 0) {
    if (abs > 0.7) return "var(--g-blue)";
    if (abs > 0.4) return "var(--g-teal)";
    return "var(--g-text-tertiary)";
  } else {
    if (abs > 0.7) return "var(--g-red)";
    if (abs > 0.4) return "var(--g-orange)";
    return "var(--g-text-tertiary)";
  }
}

function getCellOpacity(coefficient: number): number {
  return 0.15 + Math.abs(coefficient) * 0.6;
}

export function CorrelationMatrixView({ data }: CorrelationMatrixProps) {
  const { t } = useTranslation();
  const { metrics, pairs } = data;

  const metricLabels: Record<string, string> = {
    download: t("common.download"),
    upload: t("common.upload"),
    ping: t("common.ping"),
    jitter: t("history.jitter"),
  };

  // Build a lookup map for coefficient values
  const coeffMap = new Map<string, number>();
  for (const pair of pairs) {
    coeffMap.set(`${pair.metric_a}-${pair.metric_b}`, pair.coefficient);
    coeffMap.set(`${pair.metric_b}-${pair.metric_a}`, pair.coefficient);
  }

  return (
    <GlassCard padding="md" className="g-animate-in">
      <h3
        className="text-sm font-semibold mb-4"
        style={{ color: "var(--g-text)" }}
      >
        {t("docs.metricCorrelations")}
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="p-2" />
              {metrics.map((m) => (
                <th
                  key={m}
                  className="p-2 text-[10px] font-medium uppercase tracking-wider text-center"
                  style={{ color: "var(--g-text-secondary)" }}
                >
                  {metricLabels[m] || m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((rowMetric) => (
              <tr key={rowMetric}>
                <td
                  className="p-2 text-[10px] font-medium uppercase tracking-wider text-right"
                  style={{ color: "var(--g-text-secondary)" }}
                >
                  {metricLabels[rowMetric] || rowMetric}
                </td>
                {metrics.map((colMetric) => {
                  if (rowMetric === colMetric) {
                    return (
                      <td key={colMetric} className="p-1">
                        <div
                          className="w-full aspect-square rounded-md flex items-center justify-center"
                          style={{
                            background: "var(--g-border)",
                            opacity: 0.5,
                          }}
                        >
                          <span className="text-[10px] tabular-nums font-medium" style={{ color: "var(--g-text-secondary)" }}>
                            1.00
                          </span>
                        </div>
                      </td>
                    );
                  }

                  const coeff = coeffMap.get(`${rowMetric}-${colMetric}`) ?? 0;
                  const color = getCellColor(coeff);
                  const opacity = getCellOpacity(coeff);

                  return (
                    <td key={colMetric} className="p-1">
                      <div
                        className="w-full aspect-square rounded-md flex items-center justify-center transition-all duration-300 hover:scale-105 cursor-default"
                        style={{
                          background: color,
                          opacity,
                        }}
                      >
                        <span
                          className="text-[10px] tabular-nums font-semibold"
                          style={{ color: "var(--g-text)" }}
                        >
                          {coeff.toFixed(2)}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 pt-2" style={{ borderTop: "1px solid var(--g-border)" }}>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ background: "var(--g-blue)", opacity: 0.6 }} />
          <span className="text-[10px]" style={{ color: "var(--g-text-tertiary)" }}>{t("docs.strongPositive")}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ background: "var(--g-text-tertiary)", opacity: 0.3 }} />
          <span className="text-[10px]" style={{ color: "var(--g-text-tertiary)" }}>{t("docs.weak")}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ background: "var(--g-red)", opacity: 0.6 }} />
          <span className="text-[10px]" style={{ color: "var(--g-text-tertiary)" }}>{t("docs.strongNegative")}</span>
        </div>
      </div>
    </GlassCard>
  );
}
