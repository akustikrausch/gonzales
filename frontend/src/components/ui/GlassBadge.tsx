import type { ReactNode } from "react";

interface GlassBadgeProps {
  children: ReactNode;
  color?: string;
  className?: string;
}

export function GlassBadge({ children, color, className = "" }: GlassBadgeProps) {
  return (
    <span
      className={`glass-badge ${className}`}
      style={color ? { color, borderColor: `${color}33` } : undefined}
    >
      {children}
    </span>
  );
}
