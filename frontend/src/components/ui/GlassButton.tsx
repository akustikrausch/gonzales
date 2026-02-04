import { type ButtonHTMLAttributes, type ReactNode, type MouseEvent, type KeyboardEvent, useCallback } from "react";

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  /** Accessible label for screen readers when button content is icon-only */
  "aria-label"?: string;
  /** Loading state - disables button and shows loading indicator */
  loading?: boolean;
}

const sizeMap = {
  sm: "px-3 py-1 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-2.5 text-base",
};

const variantMap = {
  default: "glass-btn",
  primary: "glass-btn glass-btn-primary",
  danger: "glass-btn glass-btn-danger",
};

export function GlassButton({
  variant = "default",
  size = "md",
  children,
  className = "",
  onClick,
  loading = false,
  disabled,
  "aria-label": ariaLabel,
  ...props
}: GlassButtonProps) {
  const isDisabled = disabled || loading;

  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) return;
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      btn.style.setProperty("--ripple-x", `${x}%`);
      btn.style.setProperty("--ripple-y", `${y}%`);
      onClick?.(e);
    },
    [onClick, isDisabled],
  );

  // Handle keyboard activation (Enter and Space)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (isDisabled) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const btn = e.currentTarget;
        btn.style.setProperty("--ripple-x", "50%");
        btn.style.setProperty("--ripple-y", "50%");
      }
    },
    [isDisabled],
  );

  return (
    <button
      className={`${variantMap[variant]} ${sizeMap[size]} ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-label={ariaLabel}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
            aria-hidden="true"
          />
          <span className="sr-only">Loading...</span>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
