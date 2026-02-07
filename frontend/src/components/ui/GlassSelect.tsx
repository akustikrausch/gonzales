import { useId, type SelectHTMLAttributes } from "react";

interface GlassSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function GlassSelect({ label, className = "", id, children, ...props }: GlassSelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm mb-1"
          style={{ color: "var(--g-text-secondary)" }}
        >
          {label}
        </label>
      )}
      <select id={selectId} className={`glass-select ${className}`} {...props}>
        {children}
      </select>
    </div>
  );
}
