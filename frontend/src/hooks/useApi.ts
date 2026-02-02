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
