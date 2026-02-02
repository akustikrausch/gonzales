import { Calendar, X } from "lucide-react";

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangeFilterProps) {
  const hasFilter = startDate || endDate;

  return (
    <div className="flex items-center gap-3">
      <Calendar className="w-4 h-4" style={{ color: "var(--g-text-secondary)" }} />
      <label className="text-sm" style={{ color: "var(--g-text-secondary)" }}>From</label>
      <input
        type="datetime-local"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        className="glass-input"
        style={{ width: "auto" }}
      />
      <label className="text-sm" style={{ color: "var(--g-text-secondary)" }}>To</label>
      <input
        type="datetime-local"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        className="glass-input"
        style={{ width: "auto" }}
      />
      {hasFilter && (
        <button
          onClick={() => { onStartDateChange(""); onEndDateChange(""); }}
          className="transition-colors"
          style={{ color: "var(--g-text-secondary)" }}
          title="Clear filter"
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--g-red)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--g-text-secondary)")}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
