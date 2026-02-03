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
  tolerance_percent: number;
  effective_download_threshold_mbps: number;
  effective_upload_threshold_mbps: number;
  total_data_used_bytes: number;
}

export interface SchedulerStatus {
  running: boolean;
  next_run_time: string | null;
  interval_minutes: number;
  test_in_progress: boolean;
}

export interface OutageStatus {
  outage_active: boolean;
  outage_started_at: string | null;
  consecutive_failures: number;
  last_failure_message: string;
}

export interface Status {
  version: string;
  scheduler: SchedulerStatus;
  outage: OutageStatus;
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
  tolerance_percent: number;
  preferred_server_id: number;
  manual_trigger_cooldown_seconds: number;
  theme: string;
  isp_name: string;
  host: string;
  port: number;
  log_level: string;
  debug: boolean;
}

export interface ConfigUpdate {
  test_interval_minutes?: number;
  download_threshold_mbps?: number;
  upload_threshold_mbps?: number;
  tolerance_percent?: number;
  preferred_server_id?: number;
  manual_trigger_cooldown_seconds?: number;
  theme?: string;
  isp_name?: string;
}

export type SortField = "timestamp" | "download_mbps" | "upload_mbps" | "ping_latency_ms" | "ping_jitter_ms";

export type SortOrder = "asc" | "desc";

// Server types
export interface SpeedtestServer {
  id: number;
  host: string;
  port: number;
  name: string;
  location: string;
  country: string;
}

export interface ServerListResponse {
  servers: SpeedtestServer[];
}

// Enhanced statistics types
export interface HourlyAverage {
  hour: number;
  avg_download_mbps: number;
  avg_upload_mbps: number;
  avg_ping_ms: number;
  count: number;
}

export interface DayOfWeekAverage {
  day: number;
  day_name: string;
  avg_download_mbps: number;
  avg_upload_mbps: number;
  avg_ping_ms: number;
  count: number;
}

export interface TrendPoint {
  timestamp: string;
  download_mbps: number;
  upload_mbps: number;
  ping_ms: number;
}

export interface TrendAnalysis {
  points: TrendPoint[];
  download_slope: number;
  upload_slope: number;
  ping_slope: number;
}

export interface SlaCompliance {
  total_tests: number;
  download_compliant: number;
  upload_compliant: number;
  download_compliance_pct: number;
  upload_compliance_pct: number;
}

export interface ReliabilityScore {
  download_cv: number;
  upload_cv: number;
  ping_cv: number;
  composite_score: number;
}

export interface ServerStats {
  server_id: number;
  server_name: string;
  server_location: string;
  test_count: number;
  avg_download_mbps: number;
  avg_upload_mbps: number;
  avg_ping_ms: number;
}

// Phase 6: Innovative Statistics

export interface AnomalyPoint {
  timestamp: string;
  metric: string;
  value: number;
  mean: number;
  stddev: number;
  z_score: number;
}

export interface PeriodStats {
  label: string;
  hours: string;
  avg_download_mbps: number;
  avg_upload_mbps: number;
  avg_ping_ms: number;
  count: number;
}

export interface TimePeriodStats {
  period: string;
  period_label: string;
  hours: string;
  avg_download_mbps: number;
  avg_upload_mbps: number;
  avg_ping_ms: number;
  test_count: number;
  compliance_pct: number;
}

export interface TimePeriodAnalysis {
  periods: TimePeriodStats[];
  best_period: string;
  worst_period: string;
}

export interface PeakOffPeakAnalysis {
  peak: PeriodStats;
  offpeak: PeriodStats;
  night: PeriodStats;
  best_period: string;
  worst_period: string;
}

export interface IspScoreBreakdown {
  speed_score: number;
  reliability_score: number;
  latency_score: number;
  consistency_score: number;
}

export interface IspScore {
  composite: number;
  grade: string;
  breakdown: IspScoreBreakdown;
}

export interface TimeWindowResult {
  hour: number;
  label: string;
  avg_download_mbps: number;
  avg_upload_mbps: number;
  avg_ping_ms: number;
}

export interface BestWorstTimes {
  best_download: TimeWindowResult | null;
  worst_download: TimeWindowResult | null;
  best_upload: TimeWindowResult | null;
  worst_upload: TimeWindowResult | null;
  best_ping: TimeWindowResult | null;
  worst_ping: TimeWindowResult | null;
}

export interface CorrelationPair {
  metric_a: string;
  metric_b: string;
  coefficient: number;
}

export interface CorrelationMatrix {
  pairs: CorrelationPair[];
  metrics: string[];
}

export interface DegradationAlert {
  metric: string;
  severity: string;
  description: string;
  current_avg: number;
  historical_avg: number;
  drop_pct: number;
}

export interface PredictionPoint {
  timestamp: string;
  download_mbps: number;
  upload_mbps: number;
  ping_ms: number;
}

export interface PredictiveTrend {
  points: PredictionPoint[];
  confidence: string;
}

export interface EnhancedStatistics {
  basic: Statistics;
  hourly: HourlyAverage[];
  daily: DayOfWeekAverage[];
  trend: TrendAnalysis;
  sla: SlaCompliance;
  reliability: ReliabilityScore;
  by_server: ServerStats[];
  anomalies: AnomalyPoint[];
  peak_offpeak: PeakOffPeakAnalysis | null;
  time_periods: TimePeriodAnalysis | null;
  isp_score: IspScore | null;
  best_worst_times: BestWorstTimes | null;
  correlations: CorrelationMatrix | null;
  degradation_alerts: DegradationAlert[];
  predictions: PredictiveTrend | null;
}

// QoS Types
export interface QosProfile {
  id: string;
  name: string;
  icon: string;
  description: string;
  min_download_mbps: number | null;
  min_upload_mbps: number | null;
  max_ping_ms: number | null;
  max_jitter_ms: number | null;
  max_packet_loss_pct: number | null;
}

export interface QosCheck {
  metric: string;
  label: string;
  required: number | null;
  actual: number | null;
  passed: boolean;
  unit: string;
  threshold_type: string;
}

export interface QosTestResult {
  profile_id: string;
  profile_name: string;
  icon: string;
  passed: boolean;
  checks: QosCheck[];
  passed_count: number;
  total_checks: number;
  recommendation: string | null;
}

export interface QosOverview {
  measurement_id: number | null;
  timestamp: string;
  results: QosTestResult[];
  passed_profiles: number;
  total_profiles: number;
  summary: string;
}

export interface QosHistoryEntry {
  timestamp: string;
  measurement_id: number;
  passed: boolean;
  download_mbps: number;
  upload_mbps: number;
  ping_ms: number;
  jitter_ms: number | null;
  packet_loss_pct: number | null;
}

export interface QosHistory {
  profile_id: string;
  profile_name: string;
  entries: QosHistoryEntry[];
  compliance_pct: number;
  total_tests: number;
  passed_tests: number;
}

// Topology Types
export interface NetworkHop {
  hop_number: number;
  ip_address: string | null;
  hostname: string | null;
  latency_ms: number | null;
  packet_loss_pct: number;
  is_local: boolean;
  is_timeout: boolean;
  status: string;
}

export interface NetworkTopology {
  id: number | null;
  timestamp: string;
  target_host: string;
  total_hops: number;
  total_latency_ms: number;
  hops: NetworkHop[];
  bottleneck_hop: number | null;
  local_network_ok: boolean;
  diagnosis: string;
}

export interface TopologyHistoryEntry {
  id: number;
  timestamp: string;
  target_host: string;
  total_hops: number;
  total_latency_ms: number;
  local_network_ok: boolean;
}

export interface TopologyHistory {
  entries: TopologyHistoryEntry[];
  total: number;
}

export interface NetworkDiagnosis {
  total_analyses: number;
  local_network_issues: number;
  local_network_health_pct: number;
  avg_total_hops: number;
  avg_total_latency_ms: number;
  common_bottleneck_hops: number[];
  overall_status: string;
  recommendations: string[];
}
