import { useState, useEffect, useRef } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { GlassButton } from "../ui/GlassButton";

interface DeleteAllModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  totalCount: number;
}

export function DeleteAllModal({
  isOpen,
  onClose,
  onConfirm,
  isPending,
  totalCount,
}: DeleteAllModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const CONFIRM_WORD = "DELETE";
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Focus trap and escape key handler
  useEffect(() => {
    if (!isOpen) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Handle escape key
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

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus when modal closes
      previousActiveElement.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const canDelete = confirmText.toUpperCase() === CONFIRM_WORD;

  const handleConfirm = () => {
    if (canDelete) {
      onConfirm();
      setConfirmText("");
    }
  };

  const handleClose = () => {
    setConfirmText("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(4px)" }}
      onClick={handleClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-xl p-6 shadow-xl"
        style={{
          background: "var(--g-glass)",
          border: "1px solid var(--g-border)",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        aria-describedby="delete-modal-description"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ background: "var(--g-red)20" }}
            >
              <AlertTriangle className="w-5 h-5" style={{ color: "var(--g-red)" }} />
            </div>
            <h3 id="delete-modal-title" className="text-lg font-semibold" style={{ color: "var(--g-text)" }}>
              Delete All Measurements
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg transition-colors"
            style={{ color: "var(--g-text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--g-border)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4">
          <p id="delete-modal-description" style={{ color: "var(--g-text-secondary)" }}>
            You are about to permanently delete <strong style={{ color: "var(--g-text)" }}>{totalCount}</strong> measurements.
            This action cannot be undone.
          </p>

          <div
            className="p-3 rounded-lg"
            style={{ background: "var(--g-red)08", border: "1px solid var(--g-red)30" }}
          >
            <p className="text-sm" style={{ color: "var(--g-red)" }}>
              All historical data, statistics, and trends will be lost permanently.
            </p>
          </div>

          <div>
            <label
              className="block text-sm mb-2"
              style={{ color: "var(--g-text-secondary)" }}
            >
              Type <strong style={{ color: "var(--g-text)" }}>{CONFIRM_WORD}</strong> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_WORD}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                background: "var(--g-input-bg)",
                border: "1px solid var(--g-border)",
                color: "var(--g-text)",
              }}
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-2">
            <GlassButton onClick={handleClose} className="flex-1">
              Cancel
            </GlassButton>
            <GlassButton
              onClick={handleConfirm}
              disabled={!canDelete || isPending}
              className="flex-1"
              style={{
                background: canDelete ? "var(--g-red)" : undefined,
                color: canDelete ? "white" : undefined,
                opacity: canDelete ? 1 : 0.5,
              }}
            >
              <Trash2 className="w-4 h-4" />
              {isPending ? "Deleting..." : "Delete All"}
            </GlassButton>
          </div>
        </div>
      </div>
    </div>
  );
}
