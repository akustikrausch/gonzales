import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-[#E5E5EA] p-6 ${className}`}
    >
      {children}
    </div>
  );
}
