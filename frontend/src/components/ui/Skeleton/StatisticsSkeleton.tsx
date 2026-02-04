import { Skeleton, SkeletonCard } from "../Skeleton";

export function StatisticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex gap-2">
        <Skeleton width="80px" height="36px" />
        <Skeleton width="80px" height="36px" />
        <Skeleton width="80px" height="36px" />
        <Skeleton width="80px" height="36px" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <Skeleton height="0.75em" width="50%" className="mb-3" />
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton width="30%" height="0.875em" />
              <Skeleton width="40%" height="0.875em" />
            </div>
            <div className="flex justify-between">
              <Skeleton width="30%" height="0.875em" />
              <Skeleton width="40%" height="0.875em" />
            </div>
            <div className="flex justify-between">
              <Skeleton width="30%" height="0.875em" />
              <Skeleton width="40%" height="0.875em" />
            </div>
            <div className="flex justify-between">
              <Skeleton width="30%" height="0.875em" />
              <Skeleton width="40%" height="0.875em" />
            </div>
          </div>
        </div>
        <div className="glass-card p-5">
          <Skeleton height="0.75em" width="50%" className="mb-3" />
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton width="30%" height="0.875em" />
              <Skeleton width="40%" height="0.875em" />
            </div>
            <div className="flex justify-between">
              <Skeleton width="30%" height="0.875em" />
              <Skeleton width="40%" height="0.875em" />
            </div>
            <div className="flex justify-between">
              <Skeleton width="30%" height="0.875em" />
              <Skeleton width="40%" height="0.875em" />
            </div>
            <div className="flex justify-between">
              <Skeleton width="30%" height="0.875em" />
              <Skeleton width="40%" height="0.875em" />
            </div>
          </div>
        </div>
        <div className="glass-card p-5">
          <Skeleton height="0.75em" width="50%" className="mb-3" />
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton width="30%" height="0.875em" />
              <Skeleton width="40%" height="0.875em" />
            </div>
            <div className="flex justify-between">
              <Skeleton width="30%" height="0.875em" />
              <Skeleton width="40%" height="0.875em" />
            </div>
            <div className="flex justify-between">
              <Skeleton width="30%" height="0.875em" />
              <Skeleton width="40%" height="0.875em" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="glass-card p-5">
        <Skeleton height="1em" width="40%" className="mb-4" />
        <Skeleton height="300px" />
      </div>

      {/* Predictions */}
      <SkeletonCard />
    </div>
  );
}
