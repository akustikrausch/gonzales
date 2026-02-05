import type {
  Config,
  ConfigUpdate,
  EnhancedStatistics,
  Measurement,
  MeasurementPage,
  NetworkDiagnosis,
  NetworkTopology,
  OutageListResponse,
  OutageStatistics,
  QosHistory,
  QosOverview,
  QosProfile,
  SchedulerControlResponse,
  ServerListResponse,
  SortField,
  SortOrder,
  Statistics,
  Status,
  TopologyHistory,
} from "./types";

function getApiBase(): string {
  const path = window.location.pathname;
  const match = path.match(/^(\/api\/hassio_ingress\/[^/]+)/);
  return match ? `${match[1]}/api/v1` : "/api/v1";
}

const BASE = getApiBase();

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status}: ${body}`);
  }
  return response.json();
}

export const api = {
  getMeasurements(params?: {
    page?: number;
    page_size?: number;
    start_date?: string;
    end_date?: string;
    sort_by?: SortField;
    sort_order?: SortOrder;
  }): Promise<MeasurementPage> {
    const search = new URLSearchParams();
    if (params?.page) search.set("page", String(params.page));
    if (params?.page_size) search.set("page_size", String(params.page_size));
    if (params?.start_date) search.set("start_date", params.start_date);
    if (params?.end_date) search.set("end_date", params.end_date);
    if (params?.sort_by) search.set("sort_by", params.sort_by);
    if (params?.sort_order) search.set("sort_order", params.sort_order);
    const qs = search.toString();
    return fetchJSON(`${BASE}/measurements${qs ? `?${qs}` : ""}`);
  },

  getLatestMeasurement(): Promise<Measurement | null> {
    return fetchJSON(`${BASE}/measurements/latest`);
  },

  getMeasurement(id: number): Promise<Measurement> {
    return fetchJSON(`${BASE}/measurements/${id}`);
  },

  deleteMeasurement(id: number): Promise<void> {
    return fetchJSON(`${BASE}/measurements/${id}`, { method: "DELETE" });
  },

  deleteAllMeasurements(): Promise<{ deleted: number; message: string }> {
    return fetchJSON(`${BASE}/measurements/all?confirm=true`, { method: "DELETE" });
  },

  getStatistics(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<Statistics> {
    const search = new URLSearchParams();
    if (params?.start_date) search.set("start_date", params.start_date);
    if (params?.end_date) search.set("end_date", params.end_date);
    const qs = search.toString();
    return fetchJSON(`${BASE}/statistics${qs ? `?${qs}` : ""}`);
  },

  getEnhancedStatistics(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<EnhancedStatistics> {
    const search = new URLSearchParams();
    if (params?.start_date) search.set("start_date", params.start_date);
    if (params?.end_date) search.set("end_date", params.end_date);
    const qs = search.toString();
    return fetchJSON(`${BASE}/statistics/enhanced${qs ? `?${qs}` : ""}`);
  },

  getStatus(): Promise<Status> {
    return fetchJSON(`${BASE}/status`);
  },

  triggerSpeedtest(): Promise<Measurement> {
    return fetchJSON(`${BASE}/speedtest/trigger`, { method: "POST" });
  },

  getConfig(): Promise<Config> {
    return fetchJSON(`${BASE}/config`);
  },

  updateConfig(update: ConfigUpdate): Promise<Config> {
    return fetchJSON(`${BASE}/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
  },

  getServers(): Promise<ServerListResponse> {
    return fetchJSON(`${BASE}/servers`);
  },

  getExportCsvUrl(params?: { start_date?: string; end_date?: string }): string {
    const search = new URLSearchParams();
    if (params?.start_date) search.set("start_date", params.start_date);
    if (params?.end_date) search.set("end_date", params.end_date);
    const qs = search.toString();
    return `${BASE}/export/csv${qs ? `?${qs}` : ""}`;
  },

  getExportPdfUrl(params?: { start_date?: string; end_date?: string }): string {
    const search = new URLSearchParams();
    if (params?.start_date) search.set("start_date", params.start_date);
    if (params?.end_date) search.set("end_date", params.end_date);
    const qs = search.toString();
    return `${BASE}/export/pdf${qs ? `?${qs}` : ""}`;
  },

  // QoS API
  getQosProfiles(): Promise<QosProfile[]> {
    return fetchJSON(`${BASE}/qos/profiles`);
  },

  getCurrentQosStatus(): Promise<QosOverview | null> {
    return fetchJSON(`${BASE}/qos/current`);
  },

  evaluateMeasurementQos(measurementId: number): Promise<QosOverview> {
    return fetchJSON(`${BASE}/qos/evaluate/${measurementId}`);
  },

  getQosHistory(profileId: string, days: number = 7): Promise<QosHistory> {
    return fetchJSON(`${BASE}/qos/history/${profileId}?days=${days}`);
  },

  // Topology API
  analyzeTopology(): Promise<NetworkTopology> {
    return fetchJSON(`${BASE}/topology/analyze`, { method: "POST" });
  },

  getLatestTopology(): Promise<NetworkTopology | null> {
    return fetchJSON(`${BASE}/topology/latest`);
  },

  getTopology(id: number): Promise<NetworkTopology> {
    return fetchJSON(`${BASE}/topology/${id}`);
  },

  getTopologyHistory(limit: number = 10): Promise<TopologyHistory> {
    return fetchJSON(`${BASE}/topology/history?limit=${limit}`);
  },

  getNetworkDiagnosis(days: number = 7): Promise<NetworkDiagnosis> {
    return fetchJSON(`${BASE}/topology/diagnosis?days=${days}`);
  },

  // Outages API
  getOutages(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<OutageListResponse> {
    const search = new URLSearchParams();
    if (params?.start_date) search.set("start_date", params.start_date);
    if (params?.end_date) search.set("end_date", params.end_date);
    const qs = search.toString();
    return fetchJSON(`${BASE}/outages${qs ? `?${qs}` : ""}`);
  },

  getOutageStatistics(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<OutageStatistics> {
    const search = new URLSearchParams();
    if (params?.start_date) search.set("start_date", params.start_date);
    if (params?.end_date) search.set("end_date", params.end_date);
    const qs = search.toString();
    return fetchJSON(`${BASE}/outages/statistics${qs ? `?${qs}` : ""}`);
  },

  // Scheduler API
  setSchedulerEnabled(enabled: boolean): Promise<SchedulerControlResponse> {
    return fetchJSON(`${BASE}/status/scheduler`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
  },
};
