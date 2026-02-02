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
      className={`py-3 px-3 text-[#86868B] font-medium cursor-pointer select-none hover:text-[#1D1D1F] transition-colors ${
        align === "left" ? "text-left" : "text-right"
      }`}
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
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E5E5EA]">
            <SortableHeader label="Time" field="timestamp" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} align="left" />
            <SortableHeader label="Download" field="download_mbps" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
            <SortableHeader label="Upload" field="upload_mbps" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
            <SortableHeader label="Ping" field="ping_latency_ms" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
            <SortableHeader label="Jitter" field="ping_jitter_ms" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
            <th className="text-left py-3 px-3 text-[#86868B] font-medium">Server</th>
            <th className="text-center py-3 px-3 text-[#86868B] font-medium">Issues</th>
            <th className="py-3 px-3"></th>
          </tr>
        </thead>
        <tbody>
          {measurements.map((m) => {
            const hasViolation = m.below_download_threshold || m.below_upload_threshold;
            return (
              <tr
                key={m.id}
                className={`border-b border-[#F5F5F7] hover:bg-[#F5F5F7]/50 ${
                  hasViolation ? "bg-red-50/30" : ""
                }`}
              >
                <td className="py-2.5 px-3 text-[#1D1D1F]">{formatDate(m.timestamp)}</td>
                <td className="py-2.5 px-3 text-right font-medium tabular-nums text-[#007AFF]">
                  {m.download_mbps.toFixed(1)}
                </td>
                <td className="py-2.5 px-3 text-right font-medium tabular-nums text-[#34C759]">
                  {m.upload_mbps.toFixed(1)}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums">
                  {m.ping_latency_ms.toFixed(1)}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums">
                  {m.ping_jitter_ms.toFixed(1)}
                </td>
                <td className="py-2.5 px-3 text-[#86868B] max-w-[150px] truncate">
                  {m.server_name}
                </td>
                <td className="py-2.5 px-3 text-center">
                  {hasViolation && (
                    <span className="text-[#FF3B30] text-xs font-medium">
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
                      className="text-[#86868B] hover:text-[#FF3B30] transition-colors"
                      title="Delete"
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
