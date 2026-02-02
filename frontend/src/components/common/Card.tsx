import { GlassCard } from "../ui/GlassCard";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return <GlassCard className={className}>{children}</GlassCard>;
}
