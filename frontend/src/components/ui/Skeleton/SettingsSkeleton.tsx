import { Skeleton } from "../Skeleton";

export function SettingsSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Section 1 */}
      <div className="glass-card p-5">
        <Skeleton height="1.25em" width="40%" className="mb-4" />
        <div className="space-y-4">
          <div>
            <Skeleton height="0.75em" width="30%" className="mb-2" />
            <Skeleton height="40px" />
          </div>
          <div>
            <Skeleton height="0.75em" width="35%" className="mb-2" />
            <Skeleton height="40px" />
          </div>
        </div>
      </div>

      {/* Section 2 */}
      <div className="glass-card p-5">
        <Skeleton height="1.25em" width="35%" className="mb-4" />
        <div className="space-y-4">
          <div>
            <Skeleton height="0.75em" width="40%" className="mb-2" />
            <Skeleton height="40px" />
          </div>
          <div>
            <Skeleton height="0.75em" width="40%" className="mb-2" />
            <Skeleton height="40px" />
          </div>
          <div>
            <Skeleton height="0.75em" width="25%" className="mb-2" />
            <Skeleton height="40px" />
          </div>
        </div>
      </div>

      {/* Section 3 */}
      <div className="glass-card p-5">
        <Skeleton height="1.25em" width="25%" className="mb-4" />
        <div className="space-y-4">
          <div>
            <Skeleton height="0.75em" width="30%" className="mb-2" />
            <Skeleton height="40px" />
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Skeleton width="100px" height="40px" />
      </div>
    </div>
  );
}
