import { CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TopologyHistoryEntry } from "../../api/types";

interface TopologyHistoryListProps {
  entries: TopologyHistoryEntry[];
  selectedId: number | null | undefined;
  onSelect: (entry: TopologyHistoryEntry) => void;
}

export function TopologyHistoryList({ entries, selectedId, onSelect }: TopologyHistoryListProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const isSelected = selectedId === entry.id;
        const timestamp = new Date(entry.timestamp);

        return (
          <button
            key={entry.id}
            onClick={() => onSelect(entry)}
            className="w-full text-left p-3 rounded-lg transition-all"
            style={{
              backgroundColor: isSelected ? "var(--g-accent-dim)" : "var(--g-surface)",
              boxShadow: isSelected ? "0 0 0 2px var(--g-accent)" : undefined,
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {entry.local_network_ok ? (
                    <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "var(--g-green)" }} />
                  ) : (
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "var(--g-red)" }} />
                  )}
                  <span
                    className="text-sm font-medium truncate"
                    style={{ color: "var(--g-text)" }}
                  >
                    {entry.target_host}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: "var(--g-text-secondary)" }}>
                  <Clock className="w-3 h-3" />
                  {timestamp.toLocaleDateString()} {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-bold" style={{ color: "var(--g-text)" }}>
                  {entry.total_hops} {t("topology.hops").toLowerCase()}
                </p>
                <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
                  {entry.total_latency_ms.toFixed(0)} {t("common.ms")}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
