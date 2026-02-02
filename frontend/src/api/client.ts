import type {
  Config,
  ConfigUpdate,
  Measurement,
  MeasurementPage,
  SortField,
  SortOrder,
  Statistics,
  Status,
} from "./types";

const BASE = "/api/v1";

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
};
