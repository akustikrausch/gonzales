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
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-[#86868B]">From</label>
      <input
        type="datetime-local"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        className="px-3 py-1.5 text-sm border border-[#E5E5EA] rounded-lg bg-white
                   focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]"
      />
      <label className="text-sm text-[#86868B]">To</label>
      <input
        type="datetime-local"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        className="px-3 py-1.5 text-sm border border-[#E5E5EA] rounded-lg bg-white
                   focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]"
      />
    </div>
  );
}
