import { type ButtonHTMLAttributes, type ReactNode, type MouseEvent, useCallback } from "react";

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
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
  ...props
}: GlassButtonProps) {
  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      btn.style.setProperty("--ripple-x", `${x}%`);
      btn.style.setProperty("--ripple-y", `${y}%`);
      onClick?.(e);
    },
    [onClick],
  );

  return (
    <button
      className={`${variantMap[variant]} ${sizeMap[size]} ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}
