import { Skeleton } from "../Skeleton";

export function HistorySkeleton() {
  return (
    <div className="space-y-6">
      {/* Filters row */}
      <div className="flex flex-wrap gap-3">
        <Skeleton width="150px" height="36px" />
        <Skeleton width="150px" height="36px" />
        <Skeleton width="100px" height="36px" />
      </div>

      {/* Table */}
      <div className="glass-card p-0 overflow-hidden">
        {/* Table header */}
        <div className="p-4 border-b border-[var(--g-border)]">
          <div className="flex gap-4">
            <Skeleton width="100px" height="0.75em" />
            <Skeleton width="80px" height="0.75em" />
            <Skeleton width="80px" height="0.75em" />
            <Skeleton width="60px" height="0.75em" />
            <Skeleton width="120px" height="0.75em" />
            <Skeleton width="80px" height="0.75em" />
          </div>
        </div>

        {/* Table rows */}
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className="p-4 border-b border-[var(--g-border)] last:border-b-0"
          >
            <div className="flex gap-4">
              <Skeleton width="100px" height="0.875em" />
              <Skeleton width="80px" height="0.875em" />
              <Skeleton width="80px" height="0.875em" />
              <Skeleton width="60px" height="0.875em" />
              <Skeleton width="120px" height="0.875em" />
              <Skeleton width="80px" height="0.875em" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <Skeleton width="150px" height="0.875em" />
        <div className="flex gap-2">
          <Skeleton width="36px" height="36px" />
          <Skeleton width="36px" height="36px" />
          <Skeleton width="36px" height="36px" />
        </div>
      </div>
    </div>
  );
}
