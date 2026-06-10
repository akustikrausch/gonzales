export function formatSpeed(mbps: number): string {
  if (mbps >= 1000) {
    return `${(mbps / 1000).toFixed(2)} Gbps`;
  }
  return `${mbps.toFixed(1)} Mbps`;
}

import i18n from "../i18n";

/** Locale for date formatting: explicit for German, browser default otherwise. */
export function dateLocale(): string | undefined {
  return i18n.language?.toLowerCase().startsWith("de") ? "de-DE" : undefined;
}

/**
 * Parse an ISO timestamp from the API as UTC.
 * The backend stores UTC, but SQLite drops the timezone info, so strings can
 * arrive without a 'Z' suffix - new Date() would interpret them as local time.
 */
export function parseUtcDate(iso: string): Date {
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(iso);
  return new Date(hasTimezone ? iso : `${iso}Z`);
}

export function formatDate(iso: string): string {
  return parseUtcDate(iso).toLocaleString(dateLocale());
}

export function formatShortDate(iso: string): string {
  const d = parseUtcDate(iso);
  const date = d.toLocaleDateString(dateLocale(), {
    day: "numeric",
    month: "short",
  });
  const time = d.toLocaleTimeString(dateLocale(), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${date} ${time}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes < 1024 * 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  return `${(bytes / (1024 * 1024 * 1024 * 1024)).toFixed(2)} TB`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
