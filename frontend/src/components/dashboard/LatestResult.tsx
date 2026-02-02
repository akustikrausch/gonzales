import type { Measurement } from "../../api/types";
import { formatDate } from "../../utils/format";
import { Card } from "../common/Card";

interface LatestResultProps {
  measurement: Measurement;
}

export function LatestResult({ measurement: m }: LatestResultProps) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#1D1D1F]">Latest Test</h3>
        <span className="text-xs text-[#86868B]">{formatDate(m.timestamp)}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-[#86868B]">Server</p>
          <p className="font-medium">{m.server_name}</p>
        </div>
        <div>
          <p className="text-[#86868B]">Location</p>
          <p className="font-medium">{m.server_location}</p>
        </div>
        <div>
          <p className="text-[#86868B]">ISP</p>
          <p className="font-medium">{m.isp}</p>
        </div>
        <div>
          <p className="text-[#86868B]">Packet Loss</p>
          <p className="font-medium">
            {m.packet_loss_pct !== null ? `${m.packet_loss_pct.toFixed(1)}%` : "N/A"}
          </p>
        </div>
      </div>
      {m.result_url && (
        <a
          href={m.result_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-xs text-[#007AFF] hover:underline"
        >
          View on Speedtest.net
        </a>
      )}
    </Card>
  );
}
