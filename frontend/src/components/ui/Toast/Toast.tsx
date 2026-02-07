import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import type { Toast as ToastType, ToastType as ToastVariant } from "../../../context/ToastContext";

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

const iconMap: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap: Record<ToastVariant, string> = {
  success: "var(--g-green)",
  error: "var(--g-red)",
  warning: "var(--g-orange)",
  info: "var(--g-blue)",
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const Icon = iconMap[toast.type];
  const color = colorMap[toast.type];

  return (
    <div
      className="glass-toast"
      style={{ "--toast-color": color } as React.CSSProperties}
      role="alert"
    >
      <div className="glass-toast-icon" style={{ color }}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="glass-toast-message">{toast.message}</p>
      <button
        className="glass-toast-dismiss"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
