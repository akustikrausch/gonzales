import type { Measurement } from "../../api/types";
import { formatDate } from "../../utils/format";

interface MeasurementTableProps {
  measurements: Measurement[];
  onDelete?: (id: number) => void;
}

export function MeasurementTable({ measurements, onDelete }: MeasurementTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E5E5EA]">
            <th className="text-left py-3 px-3 text-[#86868B] font-medium">Time</th>
            <th className="text-right py-3 px-3 text-[#86868B] font-medium">Download</th>
            <th className="text-right py-3 px-3 text-[#86868B] font-medium">Upload</th>
            <th className="text-right py-3 px-3 text-[#86868B] font-medium">Ping</th>
            <th className="text-right py-3 px-3 text-[#86868B] font-medium">Jitter</th>
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
                      className="text-[#86868B] hover:text-[#FF3B30] text-xs transition-colors"
                    >
                      Delete
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
