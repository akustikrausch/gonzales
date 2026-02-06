import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSSE, type SSEProgress } from "../hooks/useSSE";
import { useStatus } from "../hooks/useApi";
import { api } from "../api/client";

interface SpeedTestContextValue {
  progress: SSEProgress;
  isStreaming: boolean;
  runTest: () => void;
  reset: () => void;
  isPollingFallback: boolean;
}

const SpeedTestContext = createContext<SpeedTestContextValue | null>(null);

/**
 * Polling fallback for when SSE doesn't work (e.g., Home Assistant Ingress).
 * Polls the status endpoint to detect when a test completes.
 */
function usePollingFallback(
  sseProgress: SSEProgress,
  isSSEStreaming: boolean,
  onTestComplete: () => void
) {
  const [isPolling, setIsPolling] = useState(false);
  const [pollingProgress, setPollingProgress] = useState<SSEProgress>({ phase: "idle" });
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const testStartTimeRef = useRef<number>(0);

  // Detect if SSE is working - if we receive any event within 3 seconds, SSE works
  const [sseWorking, setSSEWorking] = useState<boolean | null>(null);

  useEffect(() => {
    if (isSSEStreaming && sseProgress.phase !== "idle") {
      // We received an SSE event, SSE is working
      setSSEWorking(true);
      if (sseTimeoutRef.current) {
        clearTimeout(sseTimeoutRef.current);
        sseTimeoutRef.current = null;
      }
    }
  }, [isSSEStreaming, sseProgress.phase]);

  const startPolling = useCallback(() => {
    testStartTimeRef.current = Date.now();
    setSSEWorking(null);
    setPollingProgress({ phase: "started" });

    // Give SSE 3 seconds to deliver an event
    sseTimeoutRef.current = setTimeout(() => {
      // If we haven't received any SSE events, fall back to polling
      setSSEWorking((current) => {
        if (current === null) {
          // SSE didn't work, start polling
          setIsPolling(true);
          return false;
        }
        return current;
      });
    }, 3000);
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    setPollingProgress({ phase: "idle" });
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (sseTimeoutRef.current) {
      clearTimeout(sseTimeoutRef.current);
      sseTimeoutRef.current = null;
    }
    setSSEWorking(null);
  }, []);

  // Polling logic
  useEffect(() => {
    if (!isPolling) return;

    const poll = async () => {
      try {
        const status = await api.getStatus();
        const elapsed = (Date.now() - testStartTimeRef.current) / 1000;

        if (status.scheduler.test_in_progress) {
          // Estimate phase based on elapsed time
          // Typical test: 0-5s ping, 5-20s download, 20-35s upload
          let phase: SSEProgress["phase"] = "started";
          let progress = 0;

          if (elapsed < 5) {
            phase = "ping";
            progress = elapsed / 5;
          } else if (elapsed < 20) {
            phase = "download";
            progress = (elapsed - 5) / 15;
          } else if (elapsed < 35) {
            phase = "upload";
            progress = (elapsed - 20) / 15;
          } else {
            phase = "upload";
            progress = 0.95;
          }

          setPollingProgress({
            phase,
            progress: Math.min(progress, 0.99),
            elapsed,
          });
        } else {
          // Test completed - fetch the latest measurement
          const latest = await api.getLatestMeasurement();
          if (latest) {
            setPollingProgress({
              phase: "complete",
              download_mbps: latest.download_mbps,
              upload_mbps: latest.upload_mbps,
              ping_ms: latest.ping_latency_ms,
              jitter_ms: latest.ping_jitter_ms,
              measurement_id: latest.id,
            });
          } else {
            setPollingProgress({ phase: "complete" });
          }
          stopPolling();
          onTestComplete();
        }
      } catch {
        // Ignore errors, keep polling
      }
    };

    // Poll immediately, then every 500ms
    poll();
    pollingIntervalRef.current = setInterval(poll, 500);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isPolling, stopPolling, onTestComplete]);

  return {
    isPolling,
    pollingProgress,
    startPolling,
    stopPolling,
    sseWorking,
  };
}

export function SpeedTestProvider({ children }: { children: ReactNode }) {
  const { progress: sseProgress, isStreaming: isSSEStreaming, startStreaming, reset: resetSSE } = useSSE();
  const { data: status } = useStatus();
  const queryClient = useQueryClient();

  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["measurement"] });
    queryClient.invalidateQueries({ queryKey: ["measurements"] });
    queryClient.invalidateQueries({ queryKey: ["statistics"] });
    queryClient.invalidateQueries({ queryKey: ["status"] });
  }, [queryClient]);

  const {
    isPolling,
    pollingProgress,
    startPolling,
    stopPolling,
    sseWorking,
  } = usePollingFallback(sseProgress, isSSEStreaming, invalidateQueries);

  // Use SSE progress only if SSE is confirmed working
  // Otherwise use polling progress (which shows "started" immediately)
  const progress = sseWorking === true ? sseProgress : pollingProgress;
  const isStreaming = sseWorking === true ? isSSEStreaming : (isPolling || pollingProgress.phase !== "idle");

  // Auto-connect to SSE when a test is detected via status polling
  useEffect(() => {
    if (
      status?.scheduler.test_in_progress &&
      !isSSEStreaming &&
      !isPolling &&
      sseProgress.phase === "idle"
    ) {
      startStreaming();
      startPolling();
    }
  }, [status?.scheduler.test_in_progress, isSSEStreaming, isPolling, sseProgress.phase, startStreaming, startPolling]);

  const runTest = useCallback(() => {
    startStreaming();
    startPolling();
    api.triggerSpeedtest().then(() => {
      invalidateQueries();
    });
  }, [startStreaming, startPolling, invalidateQueries]);

  const reset = useCallback(() => {
    resetSSE();
    stopPolling();
  }, [resetSSE, stopPolling]);

  return (
    <SpeedTestContext.Provider
      value={{
        progress,
        isStreaming,
        runTest,
        reset,
        isPollingFallback: sseWorking === false,
      }}
    >
      {children}
    </SpeedTestContext.Provider>
  );
}

export function useSpeedTest() {
  const ctx = useContext(SpeedTestContext);
  if (!ctx) throw new Error("useSpeedTest must be used within SpeedTestProvider");
  return ctx;
}
