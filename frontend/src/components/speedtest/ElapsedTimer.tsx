interface ElapsedTimerProps {
  elapsed: number;
  color?: string;
}

export function ElapsedTimer({ elapsed, color = "var(--g-text-secondary)" }: ElapsedTimerProps) {
  const totalSeconds = Math.floor(elapsed);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const display = `${minutes}:${String(seconds).padStart(2, "0")}`;

  return (
    <span
      className="text-sm tabular-nums"
      style={{ color, fontVariantNumeric: "tabular-nums" }}
    >
      {display}
    </span>
  );
}
