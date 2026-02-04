import { useId, type InputHTMLAttributes } from "react";
import { AlertCircle } from "lucide-react";

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function GlassInput({
  label,
  error,
  helperText,
  className = "",
  id,
  ...props
}: GlassInputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const hasError = Boolean(error);
  const describedBy = [
    hasError ? errorId : null,
    helperText ? helperId : null,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm mb-1 transition-colors"
          style={{ color: hasError ? "var(--g-red)" : "var(--g-text-secondary)" }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`glass-input ${hasError ? "glass-input-error" : ""} ${className}`}
        aria-invalid={hasError}
        aria-describedby={describedBy}
        {...props}
      />
      {error && (
        <p
          id={errorId}
          className="flex items-center gap-1 mt-1 text-xs"
          style={{ color: "var(--g-red)" }}
          role="alert"
        >
          <AlertCircle className="w-3 h-3" aria-hidden="true" />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p
          id={helperId}
          className="mt-1 text-xs"
          style={{ color: "var(--g-text-tertiary)" }}
        >
          {helperText}
        </p>
      )}
    </div>
  );
}
