import type { InputHTMLAttributes } from "react";

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function GlassInput({ label, className = "", id, ...props }: GlassInputProps) {
  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm mb-1 transition-colors"
          style={{ color: "var(--g-text-secondary)" }}
        >
          {label}
        </label>
      )}
      <input id={id} className={`glass-input ${className}`} {...props} />
    </div>
  );
}
