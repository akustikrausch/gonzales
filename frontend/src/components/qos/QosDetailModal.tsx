import { useEffect, useRef } from "react";
import { X, CheckCircle, XCircle, Tv, Video, Gamepad2, Briefcase, Upload, Radio, Home, PlayCircle, Users, Swords } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { QosTestResult, QosCheck } from "../../api/types";
import { GlassButton } from "../ui/GlassButton";

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

interface QosDetailModalProps {
  result: QosTestResult;
  onClose: () => void;
}

function CheckBar({ check }: { check: QosCheck }) {
  const { t } = useTranslation();
  const passed = check.passed;
  const color = passed ? "var(--g-green)" : "var(--g-red)";
  const bgColor = passed ? "var(--g-green-muted)" : "var(--g-red-muted)";

  // Calculate bar width (relative to requirement)
  let barWidth = 100;
  if (check.required && check.actual !== null) {
    if (check.threshold_type === "min") {
      barWidth = Math.min(100, (check.actual / check.required) * 100);
    } else {
      barWidth = Math.min(100, (check.required / check.actual) * 100);
    }
  }

  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: "var(--g-text)" }}>{check.label}</span>
        <span style={{ color }}>
          {check.actual?.toFixed(1)} / {check.required?.toFixed(1)} {check.unit}
        </span>
      </div>
      <div className="h-2 rounded-full" style={{ backgroundColor: bgColor }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${barWidth}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] mt-0.5" style={{ color: "var(--g-text-secondary)" }}>
        <span>{check.threshold_type === "min" ? t("qos.minRequired") : t("qos.maxAllowed")}</span>
        <span className="flex items-center gap-1">
          {passed ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {passed ? t("qos.pass") : t("qos.fail")}
        </span>
      </div>
    </div>
  );
}

export function QosDetailModal({ result, onClose }: QosDetailModalProps) {
  const { t } = useTranslation();
  const Icon = iconMap[result.icon] || Tv;
  const statusColor = result.passed ? "var(--g-green)" : "var(--g-red)";
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Focus trap and escape key handler
  useEffect(() => {
    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Handle escape key and focus trap
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      // Focus trap
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Focus the first focusable element
    const firstFocusable = modalRef.current?.querySelector<HTMLElement>("button");
    firstFocusable?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus when modal closes
      previousActiveElement.current?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="glass-card p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="qos-modal-title"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: result.passed ? "var(--g-green-muted)" : "var(--g-red-muted)" }}
            >
              <Icon className="w-6 h-6" style={{ color: statusColor }} />
            </div>
            <div>
              <h3 id="qos-modal-title" className="font-bold" style={{ color: "var(--g-text)" }}>
                {result.profile_name}
              </h3>
              <p className="text-sm" style={{ color: statusColor }}>
                {result.passed ? t("qos.allRequirementsMet") : t("qos.requirementsNotMet")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10"
            aria-label={t("qos.closeDialog")}
          >
            <X className="w-5 h-5" style={{ color: "var(--g-text-secondary)" }} aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-1">
          {result.checks.map((check, i) => (
            <CheckBar key={i} check={check} />
          ))}
        </div>

        {!result.passed && result.recommendation && (
          <div
            className="mt-4 p-3 rounded-lg text-sm"
            style={{ backgroundColor: "var(--g-red-muted)", color: "var(--g-red)" }}
          >
            {result.recommendation}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <GlassButton size="sm" onClick={onClose}>
            {t("qos.close")}
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
