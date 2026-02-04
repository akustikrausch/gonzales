import { Skeleton, SkeletonCard } from "../Skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Speed cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <Skeleton height="0.75em" width="60%" className="mb-3" />
          <Skeleton height="3em" width="80%" className="mb-2" />
          <Skeleton height="0.5em" width="40%" />
        </div>
        <div className="glass-card p-5">
          <Skeleton height="0.75em" width="60%" className="mb-3" />
          <Skeleton height="3em" width="80%" className="mb-2" />
          <Skeleton height="0.5em" width="40%" />
        </div>
        <div className="glass-card p-5">
          <Skeleton height="0.75em" width="60%" className="mb-3" />
          <Skeleton height="3em" width="80%" className="mb-2" />
          <Skeleton height="0.5em" width="40%" />
        </div>
      </div>

      {/* Chart area */}
      <div className="glass-card p-5">
        <Skeleton height="1em" width="30%" className="mb-4" />
        <Skeleton height="200px" />
      </div>

      {/* Status row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
