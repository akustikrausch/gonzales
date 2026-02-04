import { describe, expect, it } from "vitest";
import {
  formatSpeed,
  formatDate,
  formatShortDate,
  formatBytes,
  formatDuration,
} from "./format";

describe("formatSpeed", () => {
  it("formats speeds below 1000 Mbps correctly", () => {
    expect(formatSpeed(0)).toBe("0.0 Mbps");
    expect(formatSpeed(50)).toBe("50.0 Mbps");
    expect(formatSpeed(100.5)).toBe("100.5 Mbps");
    expect(formatSpeed(999.9)).toBe("999.9 Mbps");
  });

  it("formats speeds >= 1000 Mbps as Gbps", () => {
    expect(formatSpeed(1000)).toBe("1.00 Gbps");
    expect(formatSpeed(1500)).toBe("1.50 Gbps");
    expect(formatSpeed(2500)).toBe("2.50 Gbps");
    expect(formatSpeed(10000)).toBe("10.00 Gbps");
  });
});

describe("formatDate", () => {
  it("formats ISO date strings", () => {
    const result = formatDate("2024-01-15T10:30:00Z");
    // Result is locale-dependent, just verify it's a string
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("formatShortDate", () => {
  it("formats date as M/D HH:MM", () => {
    // Use UTC date to ensure consistent test results
    const date = new Date(Date.UTC(2024, 0, 15, 10, 30, 0));
    const result = formatShortDate(date.toISOString());
    // Check it contains the expected parts (locale-adjusted)
    expect(result).toMatch(/\d{1,2}\/\d{1,2}\s\d{2}:\d{2}/);
  });

  it("pads hours and minutes correctly", () => {
    const date = new Date(2024, 5, 5, 5, 5, 0);
    const result = formatShortDate(date.toISOString());
    // Should have two-digit hours and minutes
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});

describe("formatBytes", () => {
  it("formats bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(1023)).toBe("1023 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(10240)).toBe("10.0 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
    expect(formatBytes(1.5 * 1024 * 1024)).toBe("1.5 MB");
    expect(formatBytes(100 * 1024 * 1024)).toBe("100.0 MB");
  });
});

describe("formatDuration", () => {
  it("formats minutes only", () => {
    expect(formatDuration(0)).toBe("0m");
    expect(formatDuration(30)).toBe("0m");
    expect(formatDuration(60)).toBe("1m");
    expect(formatDuration(90)).toBe("1m");
    expect(formatDuration(300)).toBe("5m");
    expect(formatDuration(3599)).toBe("59m");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(3600)).toBe("1h 0m");
    expect(formatDuration(3660)).toBe("1h 1m");
    expect(formatDuration(7200)).toBe("2h 0m");
    expect(formatDuration(7380)).toBe("2h 3m");
    expect(formatDuration(86400)).toBe("24h 0m");
  });
});
