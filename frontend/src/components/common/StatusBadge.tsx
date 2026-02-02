import { GlassBadge } from "../ui/GlassBadge";

interface StatusBadgeProps {
  active: boolean;
  label?: string;
}

export function StatusBadge({ active, label }: StatusBadgeProps) {
  const color = active ? "var(--g-green)" : "var(--g-red)";
  return (
    <GlassBadge color={color}>
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
      {label ?? (active ? "Active" : "Inactive")}
    </GlassBadge>
  );
}
