/**
 * React Query hooks for the Gonzales API.
 *
 * These hooks provide data fetching, caching, and mutations for all
 * Gonzales API endpoints with automatic cache invalidation.
 *
 * @module hooks/useApi
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ConfigUpdate, SortField, SortOrder } from "../api/types";

/**
 * Fetch the most recent speed test measurement.
 *
 * @returns TanStack Query result with the latest Measurement or null
 *
 * @example
 * const { data: latest, isLoading } = useLatestMeasurement();
 * if (latest) console.log(`Download: ${latest.download_mbps} Mbps`);
 */
export function useLatestMeasurement() {
  return useQuery({
    queryKey: ["measurement", "latest"],
    queryFn: () => api.getLatestMeasurement(),
  });
}

/**
 * Fetch paginated measurement history with filtering and sorting.
 *
 * @param params.page - Page number (1-indexed)
 * @param params.page_size - Items per page (default: 20, max: 100)
 * @param params.start_date - ISO date string for start date filter
 * @param params.end_date - ISO date string for end date filter
 * @param params.sort_by - Column to sort by (timestamp, download_mbps, etc.)
 * @param params.sort_order - Sort direction ('asc' or 'desc')
 * @returns TanStack Query result with MeasurementPage data
 *
 * @example
 * const { data, isLoading } = useMeasurements({
 *   page: 1,
 *   page_size: 50,
 *   sort_by: 'download_mbps',
 *   sort_order: 'desc'
 * });
 */
export function useMeasurements(params?: {
  page?: number;
  page_size?: number;
  start_date?: string;
  end_date?: string;
  sort_by?: SortField;
  sort_order?: SortOrder;
}) {
  return useQuery({
    queryKey: ["measurements", params],
    queryFn: () => api.getMeasurements(params),
  });
}

/**
 * Fetch basic statistics (min, max, avg, percentiles) for measurements.
 *
 * @param params.start_date - ISO date string for start date filter
 * @param params.end_date - ISO date string for end date filter
 * @returns TanStack Query result with StatisticsOut data
 *
 * @example
 * const { data: stats } = useStatistics();
 * console.log(`Average download: ${stats?.download?.avg} Mbps`);
 */
export function useStatistics(params?: {
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: ["statistics", params],
    queryFn: () => api.getStatistics(params),
  });
}

/**
 * Fetch comprehensive analytics including ISP score, trends, and predictions.
 *
 * Includes: ISP scoring (A+ to F), hourly heatmaps, trend analysis,
 * predictive forecasts, SLA compliance, anomaly detection, and more.
 *
 * @param params.start_date - ISO date string for start date filter
 * @param params.end_date - ISO date string for end date filter
 * @returns TanStack Query result with EnhancedStatisticsOut data
 *
 * @example
 * const { data: enhanced } = useEnhancedStatistics();
 * console.log(`ISP Score: ${enhanced?.isp_score?.grade}`);
 */
export function useEnhancedStatistics(params?: {
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: ["statistics", "enhanced", params],
    queryFn: () => api.getEnhancedStatistics(params),
  });
}

/**
 * Fetch current system status including test state and scheduler info.
 *
 * Automatically refetches every 5 seconds for real-time updates.
 *
 * @returns TanStack Query result with StatusOut data
 */
export function useStatus() {
  return useQuery({
    queryKey: ["status"],
    queryFn: () => api.getStatus(),
    refetchInterval: 5000,
  });
}

/**
 * Fetch current configuration settings.
 *
 * @returns TanStack Query result with ConfigOut data
 */
export function useConfig() {
  return useQuery({
    queryKey: ["config"],
    queryFn: () => api.getConfig(),
  });
}

/**
 * Fetch available speed test servers.
 *
 * Results are cached for 5 minutes (staleTime: 300000ms).
 *
 * @returns TanStack Query result with array of Server objects
 */
export function useServers() {
  return useQuery({
    queryKey: ["servers"],
    queryFn: () => api.getServers(),
    staleTime: 300000,
  });
}

/**
 * Mutation to trigger a manual speed test.
 *
 * On success, automatically invalidates measurement, statistics, and status caches.
 *
 * @returns TanStack Mutation with mutate function
 *
 * @example
 * const { mutate: trigger, isPending } = useTriggerSpeedtest();
 * <button onClick={() => trigger()} disabled={isPending}>Run Test</button>
 */
export function useTriggerSpeedtest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.triggerSpeedtest(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["measurement"] });
      queryClient.invalidateQueries({ queryKey: ["measurements"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
      queryClient.invalidateQueries({ queryKey: ["status"] });
    },
  });
}

/**
 * Mutation to update configuration settings.
 *
 * @returns TanStack Mutation with mutate function accepting ConfigUpdate
 *
 * @example
 * const { mutate: updateConfig } = useUpdateConfig();
 * updateConfig({ test_interval_minutes: 30 });
 */
export function useUpdateConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (update: ConfigUpdate) => api.updateConfig(update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config"] });
    },
  });
}

/**
 * Mutation to delete a single measurement by ID.
 *
 * @returns TanStack Mutation with mutate function accepting measurement ID
 */
export function useDeleteMeasurement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteMeasurement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["measurements"] });
      queryClient.invalidateQueries({ queryKey: ["measurement"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
    },
  });
}

/**
 * Mutation to delete all measurements.
 *
 * Use with caution - this action is irreversible.
 *
 * @returns TanStack Mutation with mutate function
 */
export function useDeleteAllMeasurements() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.deleteAllMeasurements(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["measurements"] });
      queryClient.invalidateQueries({ queryKey: ["measurement"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
      queryClient.invalidateQueries({ queryKey: ["status"] });
    },
  });
}

// =============================================================================
// QoS (Quality of Service) Hooks
// =============================================================================

/**
 * Fetch available QoS test profiles (Netflix 4K, Zoom HD, etc.).
 *
 * Results are cached for 1 minute (staleTime: 60000ms).
 *
 * @returns TanStack Query result with array of QosProfile objects
 */
export function useQosProfiles() {
  return useQuery({
    queryKey: ["qos", "profiles"],
    queryFn: () => api.getQosProfiles(),
    staleTime: 60000,
  });
}

/**
 * Fetch current QoS status for all profiles based on latest measurement.
 *
 * Automatically refetches every 30 seconds.
 *
 * @returns TanStack Query result with QosStatus data
 */
export function useCurrentQosStatus() {
  return useQuery({
    queryKey: ["qos", "current"],
    queryFn: () => api.getCurrentQosStatus(),
    refetchInterval: 30000,
  });
}

/**
 * Fetch QoS test history for a specific profile.
 *
 * @param profileId - The profile ID to fetch history for
 * @param days - Number of days of history (default: 7)
 * @returns TanStack Query result with QosHistory data
 */
export function useQosHistory(profileId: string, days: number = 7) {
  return useQuery({
    queryKey: ["qos", "history", profileId, days],
    queryFn: () => api.getQosHistory(profileId, days),
    enabled: !!profileId,
  });
}

// =============================================================================
// Network Topology Hooks
// =============================================================================

/**
 * Fetch the most recent network topology analysis (traceroute).
 *
 * @returns TanStack Query result with NetworkTopology or null
 */
export function useLatestTopology() {
  return useQuery({
    queryKey: ["topology", "latest"],
    queryFn: () => api.getLatestTopology(),
  });
}

/**
 * Fetch a specific topology analysis by ID.
 *
 * @param id - The topology analysis ID
 * @returns TanStack Query result with NetworkTopology data
 */
export function useTopology(id: number | undefined) {
  return useQuery({
    queryKey: ["topology", id],
    queryFn: () => api.getTopology(id!),
    enabled: id !== undefined,
  });
}

/**
 * Fetch history of network topology analyses.
 *
 * @param limit - Maximum number of entries to return (default: 10)
 * @returns TanStack Query result with TopologyHistory data
 */
export function useTopologyHistory(limit: number = 10) {
  return useQuery({
    queryKey: ["topology", "history", limit],
    queryFn: () => api.getTopologyHistory(limit),
  });
}

/**
 * Fetch aggregated network diagnosis based on recent topology analyses.
 *
 * @param days - Number of days to analyze (default: 7)
 * @returns TanStack Query result with NetworkDiagnosis data
 */
export function useNetworkDiagnosis(days: number = 7) {
  return useQuery({
    queryKey: ["topology", "diagnosis", days],
    queryFn: () => api.getNetworkDiagnosis(days),
  });
}

/**
 * Mutation to trigger a new network topology analysis (traceroute).
 *
 * @returns TanStack Mutation with mutate function
 */
export function useAnalyzeTopology() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.analyzeTopology(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topology"] });
    },
  });
}

// =============================================================================
// Outage Detection Hooks
// =============================================================================

/**
 * Fetch detected network outages within a date range.
 *
 * @param params.start_date - ISO date string for start date filter
 * @param params.end_date - ISO date string for end date filter
 * @returns TanStack Query result with array of Outage objects
 */
export function useOutages(params?: {
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: ["outages", params],
    queryFn: () => api.getOutages(params),
  });
}

/**
 * Fetch outage statistics (total count, duration, MTBF, etc.).
 *
 * @param params.start_date - ISO date string for start date filter
 * @param params.end_date - ISO date string for end date filter
 * @returns TanStack Query result with OutageStatistics data
 */
export function useOutageStatistics(params?: {
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: ["outages", "statistics", params],
    queryFn: () => api.getOutageStatistics(params),
  });
}
