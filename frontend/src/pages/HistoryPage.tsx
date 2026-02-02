import { useState } from "react";
import { useDeleteMeasurement, useMeasurements } from "../hooks/useApi";
import { Card } from "../components/common/Card";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { DateRangeFilter } from "../components/history/DateRangeFilter";
import { MeasurementTable } from "../components/history/MeasurementTable";

export function HistoryPage() {
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const params = {
    page,
    page_size: 25,
    start_date: startDate ? new Date(startDate).toISOString() : undefined,
    end_date: endDate ? new Date(endDate).toISOString() : undefined,
  };

  const { data, isLoading } = useMeasurements(params);
  const deleteMutation = useDeleteMeasurement();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1D1D1F]">History</h2>
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={(v) => { setStartDate(v); setPage(1); }}
          onEndDateChange={(v) => { setEndDate(v); setPage(1); }}
        />
      </div>

      <Card>
        {isLoading ? (
          <LoadingSpinner />
        ) : data && data.items.length > 0 ? (
          <>
            <MeasurementTable
              measurements={data.items}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#F5F5F7]">
              <p className="text-xs text-[#86868B]">
                {data.total} measurements total
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 text-xs border border-[#E5E5EA] rounded-lg
                             disabled:opacity-40 hover:bg-[#F5F5F7] transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs text-[#86868B] px-2 py-1">
                  Page {data.page} of {data.pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                  disabled={page >= data.pages}
                  className="px-3 py-1 text-xs border border-[#E5E5EA] rounded-lg
                             disabled:opacity-40 hover:bg-[#F5F5F7] transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="text-center py-12 text-[#86868B]">No measurements found.</p>
        )}
      </Card>
    </div>
  );
}
