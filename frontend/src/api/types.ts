export interface Measurement {
  id: number;
  timestamp: string;
  download_bps: number;
  upload_bps: number;
  download_mbps: number;
  upload_mbps: number;
  ping_latency_ms: number;
  ping_jitter_ms: number;
  packet_loss_pct: number | null;
  isp: string;
  server_id: number;
  server_name: string;
  server_location: string;
  server_country: string;
  internal_ip: string;
  external_ip: string;
  interface_name: string;
  is_vpn: boolean;
  result_id: string;
  result_url: string;
  below_download_threshold: boolean;
  below_upload_threshold: boolean;
}

export interface MeasurementPage {
  items: Measurement[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface PercentileValues {
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
}

export interface SpeedStatistics {
  min: number;
  max: number;
  avg: number;
  median: number;
  stddev: number;
  percentiles: PercentileValues;
}

export interface Statistics {
  total_tests: number;
  download: SpeedStatistics | null;
  upload: SpeedStatistics | null;
  ping: SpeedStatistics | null;
  download_violations: number;
  upload_violations: number;
  download_threshold_mbps: number;
  upload_threshold_mbps: number;
}

export interface SchedulerStatus {
  running: boolean;
  next_run_time: string | null;
  interval_minutes: number;
  test_in_progress: boolean;
}

export interface Status {
  scheduler: SchedulerStatus;
  last_test_time: string | null;
  total_measurements: number;
  total_failures: number;
  uptime_seconds: number;
  db_size_bytes: number;
}

export interface Config {
  test_interval_minutes: number;
  download_threshold_mbps: number;
  upload_threshold_mbps: number;
  host: string;
  port: number;
  log_level: string;
  debug: boolean;
}

export interface ConfigUpdate {
  test_interval_minutes?: number;
  download_threshold_mbps?: number;
  upload_threshold_mbps?: number;
}

export type SortField = "timestamp" | "download_mbps" | "upload_mbps" | "ping_latency_ms" | "ping_jitter_ms";

export type SortOrder = "asc" | "desc";
