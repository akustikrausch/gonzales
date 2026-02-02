import { ArrowUp, ArrowDown, ArrowUpDown, Trash2 } from "lucide-react";
import type { Measurement, SortField, SortOrder } from "../../api/types";
import { formatDate } from "../../utils/format";

interface SortableHeaderProps {
  label: string;
  field: SortField;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  onSort?: (field: SortField) => void;
  align?: "left" | "right";
}

function SortableHeader({ label, field, sortBy, sortOrder, onSort, align = "right" }: SortableHeaderProps) {
  const active = sortBy === field;
  return (
    <th
      className={`py-3 px-3 font-medium cursor-pointer select-none transition-colors ${
        align === "left" ? "text-left" : "text-right"
      }`}
      style={{ color: "var(--g-text-secondary)", fontSize: "var(--g-text-xs)" }}
      onClick={() => onSort?.(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          sortOrder === "asc" ? (
            <ArrowUp className="w-3 h-3" />
          ) : (
            <ArrowDown className="w-3 h-3" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-40" />
        )}
      </span>
    </th>
  );
}

interface MeasurementTableProps {
  measurements: Measurement[];
  onDelete?: (id: number) => void;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  onSort?: (field: SortField) => void;
}

export function MeasurementTable({ measurements, onDelete, sortBy, sortOrder, onSort }: MeasurementTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="glass-table">
        <thead>
          <tr>
            <SortableHeader label="Time" field="timestamp" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} align="left" />
            <SortableHeader label="Download" field="download_mbps" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
            <SortableHeader label="Upload" field="upload_mbps" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
            <SortableHeader label="Ping" field="ping_latency_ms" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
            <SortableHeader label="Jitter" field="ping_jitter_ms" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
            <th className="text-left py-3 px-3 font-medium" style={{ color: "var(--g-text-secondary)", fontSize: "var(--g-text-xs)" }}>
              Server
            </th>
            <th className="text-center py-3 px-3 font-medium" style={{ color: "var(--g-text-secondary)", fontSize: "var(--g-text-xs)" }}>
              Issues
            </th>
            <th className="py-3 px-3"></th>
          </tr>
        </thead>
        <tbody>
          {measurements.map((m) => {
            const hasViolation = m.below_download_threshold || m.below_upload_threshold;
            return (
              <tr
                key={m.id}
                style={{
                  background: hasViolation ? "rgba(255, 59, 48, 0.05)" : undefined,
                }}
              >
                <td className="py-2.5 px-3" style={{ color: "var(--g-text)" }}>
                  {formatDate(m.timestamp)}
                </td>
                <td className="py-2.5 px-3 text-right font-medium tabular-nums" style={{ color: "var(--g-blue)" }}>
                  {m.download_mbps.toFixed(1)}
                </td>
                <td className="py-2.5 px-3 text-right font-medium tabular-nums" style={{ color: "var(--g-green)" }}>
                  {m.upload_mbps.toFixed(1)}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: "var(--g-text)" }}>
                  {m.ping_latency_ms.toFixed(1)}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: "var(--g-text)" }}>
                  {m.ping_jitter_ms.toFixed(1)}
                </td>
                <td className="py-2.5 px-3 max-w-[150px] truncate" style={{ color: "var(--g-text-secondary)" }}>
                  {m.server_name}
                </td>
                <td className="py-2.5 px-3 text-center">
                  {hasViolation && (
                    <span className="text-xs font-medium" style={{ color: "var(--g-red)" }}>
                      {m.below_download_threshold && "DL"}
                      {m.below_download_threshold && m.below_upload_threshold && " / "}
                      {m.below_upload_threshold && "UL"}
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3">
                  {onDelete && (
                    <button
                      onClick={() => onDelete(m.id)}
                      className="transition-colors"
                      style={{ color: "var(--g-text-secondary)" }}
                      title="Delete"
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--g-red)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--g-text-secondary)")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
