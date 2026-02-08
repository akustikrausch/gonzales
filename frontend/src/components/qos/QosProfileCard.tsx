import { CheckCircle, XCircle, Tv, Video, Gamepad2, Briefcase, Upload, Radio, Home, PlayCircle, Users, Swords } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { QosTestResult } from "../../api/types";

const iconMap: Record<string, React.ElementType> = {
  tv: Tv,
  video: Video,
  "gamepad-2": Gamepad2,
  briefcase: Briefcase,
  upload: Upload,
  radio: Radio,
  home: Home,
  "play-circle": PlayCircle,
  users: Users,
  swords: Swords,
};

interface QosProfileCardProps {
  result: QosTestResult;
  onClick?: () => void;
}

export function QosProfileCard({ result, onClick }: QosProfileCardProps) {
  const { t } = useTranslation();
  const Icon = iconMap[result.icon] || Tv;
  const StatusIcon = result.passed ? CheckCircle : XCircle;
  const statusColor = result.passed ? "var(--g-green)" : "var(--g-red)";

  return (
    <div
      className="glass-card p-4 cursor-pointer transition-all hover:scale-[1.02]"
      onClick={onClick}
      style={{ borderColor: result.passed ? "var(--g-green-muted)" : "var(--g-red-muted)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: result.passed ? "var(--g-green-muted)" : "var(--g-red-muted)" }}
        >
          <Icon className="w-5 h-5" style={{ color: statusColor }} />
        </div>
        <span title={result.passed ? t("qos.allRequirementsMetForApp") : t("qos.someRequirementsNotMetDetails")}>
          <StatusIcon className="w-5 h-5" style={{ color: statusColor }} />
        </span>
      </div>

      <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--g-text)" }}>
        {result.profile_name}
      </h3>

      <div
        className="flex items-center gap-1 text-xs cursor-help"
        style={{ color: "var(--g-text-secondary)" }}
        title="Number of quality requirements met (download, upload, ping, jitter, packet loss)"
      >
        <span>{t("qos.checksPassed", { passed: result.passed_count, total: result.total_checks })}</span>
      </div>

      {!result.passed && result.recommendation && (
        <p className="text-xs mt-2 line-clamp-2" style={{ color: "var(--g-red)" }}>
          {result.recommendation}
        </p>
      )}
    </div>
  );
}
