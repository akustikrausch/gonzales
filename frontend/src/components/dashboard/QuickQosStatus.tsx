import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Activity, ChevronRight, Tv, Video, Gamepad2, Briefcase, Upload, Radio, Home, Youtube, Users, MonitorPlay } from "lucide-react";
import { useCurrentQosStatus } from "../../hooks/useApi";

const profileIcons: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  netflix_4k: Tv,
  youtube_4k: Youtube,
  zoom_hd: Video,
  teams_call: Users,
  cloud_gaming: MonitorPlay,
  online_gaming: Gamepad2,
  vpn_work: Briefcase,
  video_upload: Upload,
  live_streaming: Radio,
  smart_home: Home,
};

export function QuickQosStatus() {
  const { t } = useTranslation();
  const { data: qosStatus, isLoading } = useCurrentQosStatus();

  if (isLoading || !qosStatus) {
    return null;
  }

  const passedCount = qosStatus.passed_profiles;
  const totalCount = qosStatus.total_profiles;
  const passRate = Math.round((passedCount / totalCount) * 100);

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" style={{ color: "var(--g-accent)" }} />
          <h3 className="font-semibold text-sm" style={{ color: "var(--g-text)" }}>
            {t("qos.applicationCompatibility")}
          </h3>
        </div>
        <Link
          to="/qos"
          className="flex items-center gap-1 text-xs hover:underline"
          style={{ color: "var(--g-accent)" }}
        >
          {t("qos.viewAll")}
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Mini progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1" style={{ color: "var(--g-text-secondary)" }}>
          <span>{passedCount} of {totalCount} {t("qos.optimal").toLowerCase()}</span>
          <span>{passRate}%</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--g-surface)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${passRate}%`,
              backgroundColor: passRate >= 80 ? "var(--g-green)" : passRate >= 50 ? "var(--g-amber)" : "var(--g-red)",
            }}
          />
        </div>
      </div>

      {/* Profile icons grid */}
      <div className="flex flex-wrap gap-2">
        {qosStatus.results.slice(0, 6).map((result) => {
          const IconComponent = profileIcons[result.profile_id] || Activity;
          const statusLabel = result.passed ? t("qos.optimal") : t("qos.limited");
          return (
            <div
              key={result.profile_id}
              title={`${result.profile_name}: ${statusLabel}`}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: result.passed ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
              }}
            >
              <IconComponent
                className="w-4 h-4"
                style={{
                  color: result.passed ? "var(--g-green)" : "var(--g-red)",
                }}
              />
            </div>
          );
        })}
        {qosStatus.results.length > 6 && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium"
            style={{
              backgroundColor: "var(--g-surface)",
              color: "var(--g-text-secondary)",
            }}
          >
            +{qosStatus.results.length - 6}
          </div>
        )}
      </div>
    </div>
  );
}
