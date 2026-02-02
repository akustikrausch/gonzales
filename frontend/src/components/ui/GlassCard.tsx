import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  depth?: "subtle" | "default" | "elevated" | "floating";
  className?: string;
}

const paddingMap = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-8",
};

const depthMap = {
  subtle: "glass-card-subtle",
  default: "",
  elevated: "glass-card-elevated",
  floating: "glass-card-floating",
};

export function GlassCard({
  children,
  padding = "md",
  hover = false,
  depth = "default",
  className = "",
}: GlassCardProps) {
  return (
    <div
      className={`glass-card ${hover ? "glass-card-hover" : ""} ${depthMap[depth]} ${paddingMap[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
