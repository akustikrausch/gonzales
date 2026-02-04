import type { ReactNode, HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  depth?: "subtle" | "default" | "elevated" | "floating";
  className?: string;
  /** Section heading for accessibility - creates a region landmark */
  "aria-labelledby"?: string;
  /** Direct label for the card region */
  "aria-label"?: string;
  /** Role override - defaults to region if labeled */
  role?: string;
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
  "aria-labelledby": ariaLabelledby,
  "aria-label": ariaLabel,
  role,
  ...props
}: GlassCardProps) {
  // If card has a label, make it a region landmark for screen readers
  const computedRole = role || (ariaLabelledby || ariaLabel ? "region" : undefined);

  return (
    <div
      className={`glass-card ${hover ? "glass-card-hover" : ""} ${depthMap[depth]} ${paddingMap[padding]} ${className}`}
      role={computedRole}
      aria-labelledby={ariaLabelledby}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </div>
  );
}
