interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  className?: string;
  count?: number;
}

export function Skeleton({
  width,
  height,
  circle = false,
  className = "",
  count = 1,
}: SkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <>
      {items.map((i) => (
        <div
          key={i}
          className={`glass-skeleton ${circle ? "glass-skeleton-circle" : ""} ${className}`}
          style={{
            width: width ?? "100%",
            height: height ?? "1em",
          }}
        />
      ))}
    </>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`glass-card p-5 ${className}`}>
      <Skeleton height="0.75em" width="40%" className="mb-3" />
      <Skeleton height="2em" className="mb-3" />
      <Skeleton height="0.75em" width="70%" />
    </div>
  );
}
