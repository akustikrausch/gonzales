import { Sun, Moon, Sunset, ArrowUp, ArrowDown, Clock } from "lucide-react";
import type { PeakOffPeakAnalysis, BestWorstTimes } from "../../api/types";
import { GlassCard } from "../ui/GlassCard";
import { GlassBadge } from "../ui/GlassBadge";

interface PeakAnalysisProps {
  peakOffPeak: PeakOffPeakAnalysis;
  bestWorstTimes: BestWorstTimes | null;
}

function PeriodCard({
  icon: Icon,
  label,
  hours,
  download,
  upload,
  ping,
  count,
  isBest,
  isWorst,
}: {
  icon: typeof Sun;
  label: string;
  hours: string;
  download: number;
  upload: number;
  ping: number;
  count: number;
  isBest: boolean;
  isWorst: boolean;
}) {
  const borderColor = isBest ? "var(--g-green)" : isWorst ? "var(--g-red)" : "var(--g-border)";

  return (
    <GlassCard padding="md" className="relative">
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          border: isBest || isWorst ? `1px solid ${borderColor}` : undefined,
          boxShadow: isBest ? `0 0 12px ${borderColor}20` : isWorst ? `0 0 12px ${borderColor}20` : undefined,
        }}
      />
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4" style={{ color: "var(--g-text-secondary)" }} />
        <span className="text-sm font-medium" style={{ color: "var(--g-text)" }}>
          {label}
        </span>
        <span className="text-[10px] ml-auto" style={{ color: "var(--g-text-tertiary)" }}>
          {hours}
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs flex items-center gap-1" style={{ color: "var(--g-text-secondary)" }}>
            <ArrowDown className="w-3 h-3" style={{ color: "var(--g-blue)" }} /> Download
          </span>
          <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--g-blue)" }}>
            {download.toFixed(1)} Mbps
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs flex items-center gap-1" style={{ color: "var(--g-text-secondary)" }}>
            <ArrowUp className="w-3 h-3" style={{ color: "var(--g-green)" }} /> Upload
          </span>
          <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--g-green)" }}>
            {upload.toFixed(1)} Mbps
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs flex items-center gap-1" style={{ color: "var(--g-text-secondary)" }}>
            <Clock className="w-3 h-3" style={{ color: "var(--g-orange)" }} /> Ping
          </span>
          <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--g-orange)" }}>
            {ping.toFixed(1)} ms
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop: "1px solid var(--g-border)" }}>
        <span className="text-[10px]" style={{ color: "var(--g-text-tertiary)" }}>
          {count} tests
        </span>
        {isBest && <GlassBadge color="var(--g-green)">Best</GlassBadge>}
        {isWorst && <GlassBadge color="var(--g-red)">Worst</GlassBadge>}
      </div>
    </GlassCard>
  );
}

function TimeBadge({
  label,
  time,
  value,
  unit,
  color,
  icon: Icon,
}: {
  label: string;
  time: string;
  value: number;
  unit: string;
  color: string;
  icon: typeof ArrowUp;
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg" style={{ background: `${color}08` }}>
      <Icon className="w-3.5 h-3.5" style={{ color }} />
      <div className="flex-1">
        <span className="text-xs block" style={{ color: "var(--g-text-secondary)" }}>{label}</span>
        <span className="text-[10px]" style={{ color: "var(--g-text-tertiary)" }}>{time}</span>
      </div>
      <span className="text-sm font-semibold tabular-nums" style={{ color }}>
        {value.toFixed(1)} {unit}
      </span>
    </div>
  );
}

export function PeakAnalysis({ peakOffPeak, bestWorstTimes }: PeakAnalysisProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PeriodCard
          icon={Sun}
          label={peakOffPeak.peak.label}
          hours={peakOffPeak.peak.hours}
          download={peakOffPeak.peak.avg_download_mbps}
          upload={peakOffPeak.peak.avg_upload_mbps}
          ping={peakOffPeak.peak.avg_ping_ms}
          count={peakOffPeak.peak.count}
          isBest={peakOffPeak.best_period === "Peak"}
          isWorst={peakOffPeak.worst_period === "Peak"}
        />
        <PeriodCard
          icon={Sunset}
          label={peakOffPeak.offpeak.label}
          hours={peakOffPeak.offpeak.hours}
          download={peakOffPeak.offpeak.avg_download_mbps}
          upload={peakOffPeak.offpeak.avg_upload_mbps}
          ping={peakOffPeak.offpeak.avg_ping_ms}
          count={peakOffPeak.offpeak.count}
          isBest={peakOffPeak.best_period === "Off-Peak"}
          isWorst={peakOffPeak.worst_period === "Off-Peak"}
        />
        <PeriodCard
          icon={Moon}
          label={peakOffPeak.night.label}
          hours={peakOffPeak.night.hours}
          download={peakOffPeak.night.avg_download_mbps}
          upload={peakOffPeak.night.avg_upload_mbps}
          ping={peakOffPeak.night.avg_ping_ms}
          count={peakOffPeak.night.count}
          isBest={peakOffPeak.best_period === "Night"}
          isWorst={peakOffPeak.worst_period === "Night"}
        />
      </div>

      {bestWorstTimes && (
        <GlassCard padding="md" className="g-animate-in g-stagger-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--g-text-tertiary)" }}>
            Best / Worst Hours
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {bestWorstTimes.best_download && (
              <TimeBadge
                label="Best Download"
                time={bestWorstTimes.best_download.label}
                value={bestWorstTimes.best_download.avg_download_mbps}
                unit="Mbps"
                color="var(--g-blue)"
                icon={ArrowDown}
              />
            )}
            {bestWorstTimes.worst_download && (
              <TimeBadge
                label="Worst Download"
                time={bestWorstTimes.worst_download.label}
                value={bestWorstTimes.worst_download.avg_download_mbps}
                unit="Mbps"
                color="var(--g-red)"
                icon={ArrowDown}
              />
            )}
            {bestWorstTimes.best_ping && (
              <TimeBadge
                label="Best Ping"
                time={bestWorstTimes.best_ping.label}
                value={bestWorstTimes.best_ping.avg_ping_ms}
                unit="ms"
                color="var(--g-green)"
                icon={Clock}
              />
            )}
            {bestWorstTimes.worst_ping && (
              <TimeBadge
                label="Worst Ping"
                time={bestWorstTimes.worst_ping.label}
                value={bestWorstTimes.worst_ping.avg_ping_ms}
                unit="ms"
                color="var(--g-red)"
                icon={Clock}
              />
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
