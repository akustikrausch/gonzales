import { useTranslation } from "react-i18next";
import { Calendar, X } from "lucide-react";

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
}

function toLocalISOString(date: Date): string {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  return new Date(d.setDate(diff));
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangeFilterProps) {
  const { t } = useTranslation();
  const hasFilter = startDate || endDate;

  const presets = [
    { label: t("history.today"), getStart: () => startOfDay(new Date()) },
    { label: t("history.thisWeek"), getStart: () => startOfWeek(new Date()) },
    { label: t("history.thisMonth"), getStart: () => startOfMonth(new Date()) },
    { label: t("history.thisYear"), getStart: () => startOfYear(new Date()) },
  ];

  const applyPreset = (getStart: () => Date) => {
    onStartDateChange(toLocalISOString(getStart()));
    onEndDateChange(toLocalISOString(new Date()));
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => applyPreset(preset.getStart)}
            className="px-2 py-1 text-xs rounded-md transition-colors"
            style={{
              background: "var(--g-glass)",
              color: "var(--g-text-secondary)",
              border: "1px solid var(--g-border)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--g-accent)";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--g-glass)";
              e.currentTarget.style.color = "var(--g-text-secondary)";
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="h-4 w-px" style={{ background: "var(--g-border)" }} />
      <Calendar className="w-4 h-4" style={{ color: "var(--g-text-secondary)" }} />
      <label className="text-sm" style={{ color: "var(--g-text-secondary)" }}>{t("history.startDate")}</label>
      <input
        type="datetime-local"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        className="glass-input"
        style={{ width: "auto" }}
      />
      <label className="text-sm" style={{ color: "var(--g-text-secondary)" }}>{t("history.endDate")}</label>
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
          title={t("history.clearFilter")}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--g-red)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--g-text-secondary)")}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
