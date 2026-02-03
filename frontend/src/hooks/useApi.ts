import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ConfigUpdate, SortField, SortOrder } from "../api/types";

export function useLatestMeasurement() {
  return useQuery({
    queryKey: ["measurement", "latest"],
    queryFn: () => api.getLatestMeasurement(),
  });
}

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

export function useStatistics(params?: {
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: ["statistics", params],
    queryFn: () => api.getStatistics(params),
  });
}

export function useEnhancedStatistics(params?: {
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: ["statistics", "enhanced", params],
    queryFn: () => api.getEnhancedStatistics(params),
  });
}

export function useStatus() {
  return useQuery({
    queryKey: ["status"],
    queryFn: () => api.getStatus(),
    refetchInterval: 5000,
  });
}

export function useConfig() {
  return useQuery({
    queryKey: ["config"],
    queryFn: () => api.getConfig(),
  });
}

export function useServers() {
  return useQuery({
    queryKey: ["servers"],
    queryFn: () => api.getServers(),
    staleTime: 300000,
  });
}

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

export function useUpdateConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (update: ConfigUpdate) => api.updateConfig(update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config"] });
    },
  });
}

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

// QoS Hooks
export function useQosProfiles() {
  return useQuery({
    queryKey: ["qos", "profiles"],
    queryFn: () => api.getQosProfiles(),
    staleTime: 60000,
  });
}

export function useCurrentQosStatus() {
  return useQuery({
    queryKey: ["qos", "current"],
    queryFn: () => api.getCurrentQosStatus(),
    refetchInterval: 30000,
  });
}

export function useQosHistory(profileId: string, days: number = 7) {
  return useQuery({
    queryKey: ["qos", "history", profileId, days],
    queryFn: () => api.getQosHistory(profileId, days),
    enabled: !!profileId,
  });
}

// Topology Hooks
export function useLatestTopology() {
  return useQuery({
    queryKey: ["topology", "latest"],
    queryFn: () => api.getLatestTopology(),
  });
}

export function useTopology(id: number | undefined) {
  return useQuery({
    queryKey: ["topology", id],
    queryFn: () => api.getTopology(id!),
    enabled: id !== undefined,
  });
}

export function useTopologyHistory(limit: number = 10) {
  return useQuery({
    queryKey: ["topology", "history", limit],
    queryFn: () => api.getTopologyHistory(limit),
  });
}

export function useNetworkDiagnosis(days: number = 7) {
  return useQuery({
    queryKey: ["topology", "diagnosis", days],
    queryFn: () => api.getNetworkDiagnosis(days),
  });
}

export function useAnalyzeTopology() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.analyzeTopology(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topology"] });
    },
  });
}
