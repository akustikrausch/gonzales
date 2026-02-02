interface StatusBadgeProps {
  active: boolean;
  label?: string;
}

export function StatusBadge({ active, label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        active
          ? "bg-green-50 text-green-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          active ? "bg-green-500" : "bg-red-500"
        }`}
      />
      {label ?? (active ? "Active" : "Inactive")}
    </span>
  );
}
