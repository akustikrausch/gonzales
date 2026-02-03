import { useState } from "react";
import { Clock, Trash2 } from "lucide-react";
import { useDeleteAllMeasurements, useDeleteMeasurement, useMeasurements } from "../hooks/useApi";
import { GlassCard } from "../components/ui/GlassCard";
import { GlassButton } from "../components/ui/GlassButton";
import { Spinner } from "../components/ui/Spinner";
import { DateRangeFilter } from "../components/history/DateRangeFilter";
import { DeleteAllModal } from "../components/history/DeleteAllModal";
import { MeasurementTable } from "../components/history/MeasurementTable";
import type { SortField, SortOrder } from "../api/types";

export function HistoryPage() {
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("timestamp");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSort = (field: SortField) => {
    if (field === sortBy) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const params = {
    page,
    page_size: 25,
    start_date: startDate ? new Date(startDate).toISOString() : undefined,
    end_date: endDate ? new Date(endDate).toISOString() : undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
  };

  const { data, isLoading } = useMeasurements(params);
  const deleteMutation = useDeleteMeasurement();
  const deleteAllMutation = useDeleteAllMeasurements();

  const handleDeleteAll = () => {
    deleteAllMutation.mutate(undefined, {
      onSuccess: () => {
        setShowDeleteModal(false);
        setPage(1);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between g-animate-in">
        <h2
          className="text-xl font-bold flex items-center gap-2"
          style={{ color: "var(--g-text)" }}
        >
          <Clock className="w-5 h-5" />
          History
        </h2>
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={(v) => { setStartDate(v); setPage(1); }}
          onEndDateChange={(v) => { setEndDate(v); setPage(1); }}
        />
      </div>

      <GlassCard padding="none" className="g-animate-in g-stagger-1">
        <div className="p-5">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Spinner size={32} />
            </div>
          ) : data && data.items.length > 0 ? (
            <>
              <MeasurementTable
                measurements={data.items}
                onDelete={(id) => deleteMutation.mutate(id)}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <div
                className="flex items-center justify-between mt-4 pt-4 border-t"
                style={{ borderColor: "var(--g-border)" }}
              >
                <div className="flex items-center gap-4">
                  <p className="text-xs" style={{ color: "var(--g-text-secondary)" }}>
                    {data.total} measurements total
                  </p>
                  <GlassButton
                    size="sm"
                    onClick={() => setShowDeleteModal(true)}
                    style={{ color: "var(--g-red)" }}
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete All
                  </GlassButton>
                </div>
                <div className="flex gap-2">
                  <GlassButton
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Previous
                  </GlassButton>
                  <span
                    className="text-xs px-2 py-1"
                    style={{ color: "var(--g-text-secondary)" }}
                  >
                    Page {data.page} of {data.pages}
                  </span>
                  <GlassButton
                    size="sm"
                    onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                    disabled={page >= data.pages}
                  >
                    Next
                  </GlassButton>
                </div>
              </div>
            </>
          ) : (
            <p
              className="text-center py-12"
              style={{ color: "var(--g-text-secondary)" }}
            >
              No measurements found.
            </p>
          )}
        </div>
      </GlassCard>

      <DeleteAllModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAll}
        isPending={deleteAllMutation.isPending}
        totalCount={data?.total ?? 0}
      />
    </div>
  );
}
