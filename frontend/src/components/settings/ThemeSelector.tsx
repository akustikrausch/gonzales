import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

const options = [
  { value: "auto" as const, label: "Auto", Icon: Monitor },
  { value: "light" as const, label: "Light", Icon: Sun },
  { value: "dark" as const, label: "Dark", Icon: Moon },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex gap-2">
      {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className="glass-btn flex-1 flex-col gap-1 py-3"
          style={{
            borderColor: theme === value ? "var(--g-blue)" : undefined,
            background: theme === value ? "rgba(0, 122, 255, 0.1)" : undefined,
            color: theme === value ? "var(--g-blue)" : "var(--g-text)",
          }}
        >
          <Icon className="w-5 h-5" />
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}
