import type { SelectHTMLAttributes } from "react";

interface GlassSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function GlassSelect({ label, className = "", id, children, ...props }: GlassSelectProps) {
  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm mb-1"
          style={{ color: "var(--g-text-secondary)" }}
        >
          {label}
        </label>
      )}
      <select id={id} className={`glass-select ${className}`} {...props}>
        {children}
      </select>
    </div>
  );
}
