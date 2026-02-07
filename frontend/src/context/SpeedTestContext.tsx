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
  /** Sticky flag: true from runTest() until complete/error/reset */
  testActive: boolean;
  runTest: () => void;
  reset: () => void;
  isPollingFallback: boolean;
  /** Debug string for on-screen diagnostics */
  _debug: string;
}

const SpeedTestContext = createContext<SpeedTestContextValue | null>(null);

// Don't treat test_in_progress=false as "completed" until we've seen it true
// in an actual poll response. The trigger POST can take several seconds through
// HA Ingress proxy, especially via Nabu Casa remote access.
const GRACE_PERIOD_S = 60;

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
  // ONLY set true when a poll actually sees test_in_progress=true
  const sawTestInProgressRef = useRef(false);
  const [pollCount, setPollCount] = useState(0);
  const [lastPollResult, setLastPollResult] = useState<string>("");

  // Detect if SSE is working - if we receive any event within 5 seconds, SSE works
  const [sseWorking, setSSEWorking] = useState<boolean | null>(null);

  useEffect(() => {
    if (isSSEStreaming && sseProgress.phase !== "idle") {
      // We received an SSE event, SSE is working
      console.log("[gonzales] SSE event received, SSE confirmed working, phase:", sseProgress.phase);
      setSSEWorking(true);
      if (sseTimeoutRef.current) {
        clearTimeout(sseTimeoutRef.current);
        sseTimeoutRef.current = null;
      }
    }
  }, [isSSEStreaming, sseProgress.phase]);

  const startPolling = useCallback(() => {
    // Clear any existing timeout to prevent orphaned timers
    if (sseTimeoutRef.current) {
      clearTimeout(sseTimeoutRef.current);
      sseTimeoutRef.current = null;
    }

    testStartTimeRef.current = Date.now();
    sawTestInProgressRef.current = false;
    setSSEWorking(null);
    setPollingProgress({ phase: "started" });
    setPollCount(0);
    setLastPollResult("waiting");

    // Give SSE 5 seconds to deliver an event (HA ingress adds latency)
    sseTimeoutRef.current = setTimeout(() => {
      // If we haven't received any SSE events, fall back to polling
      setSSEWorking((current) => {
        if (current === null) {
          console.log("[gonzales] SSE not working after 5s, falling back to polling");
          setIsPolling(true);
          return false;
        }
        return current;
      });
    }, 5000);
  }, []);

  // Stop polling interval and timers, but do NOT reset pollingProgress.
  // Progress is only reset by startPolling() or resetProgress().
  const stopPollingInterval = useCallback(() => {
    setIsPolling(false);
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

  // Full reset: stop polling AND reset progress to idle
  const resetPolling = useCallback(() => {
    stopPollingInterval();
    setPollingProgress({ phase: "idle" });
  }, [stopPollingInterval]);

  // Polling logic
  useEffect(() => {
    if (!isPolling) return;

    const poll = async () => {
      try {
        // Add cache-busting param to prevent proxy caching
        const status = await api.getStatus(true);
        const elapsed = (Date.now() - testStartTimeRef.current) / 1000;

        setPollCount((c) => c + 1);

        if (status.scheduler.test_in_progress) {
          sawTestInProgressRef.current = true;

          // Use real progress data from backend if available
          const tp = status.test_progress;
          if (tp && tp.phase !== "started") {
            const phase = tp.phase as SSEProgress["phase"];
            setLastPollResult(`${phase} (${Math.round(elapsed)}s) bw=${tp.bandwidth_mbps ?? "-"}`);
            console.log("[gonzales] poll: real data phase=%s bw=%s elapsed=%ds", phase, tp.bandwidth_mbps, Math.round(elapsed));
            setPollingProgress({
              phase,
              bandwidth_mbps: tp.bandwidth_mbps,
              progress: tp.progress,
              ping_ms: tp.ping_ms,
              elapsed: tp.elapsed ?? elapsed,
            });
          } else {
            setLastPollResult(`in_progress (${Math.round(elapsed)}s)`);

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

            console.log("[gonzales] poll: estimated phase=%s elapsed=%ds", phase, Math.round(elapsed));
            setPollingProgress({
              phase,
              progress: Math.min(progress, 0.99),
              elapsed,
            });
          }
        } else {
          // Grace period: don't treat test_in_progress=false as completion
          // until we've ACTUALLY seen test_in_progress=true in a poll response.
          // The trigger POST may still be in transit through HA Ingress proxy.
          if (!sawTestInProgressRef.current && elapsed < GRACE_PERIOD_S) {
            setLastPollResult(`false, grace (${Math.round(elapsed)}s/${GRACE_PERIOD_S}s)`);
            console.log("[gonzales] poll: waiting for test to start (elapsed=%ds/%ds)", Math.round(elapsed), GRACE_PERIOD_S);
            return; // Keep polling, test probably hasn't started yet
          }

          setLastPollResult(`completed (${Math.round(elapsed)}s)`);
          console.log("[gonzales] poll: test completed (sawInProgress=%s elapsed=%ds)", sawTestInProgressRef.current, Math.round(elapsed));

          // Stop the interval FIRST to prevent duplicate completion
          stopPollingInterval();

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
          onTestComplete();
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setLastPollResult(`error: ${msg}`);
        console.log("[gonzales] poll: error:", msg);
      }
    };

    // Poll immediately, then every 2000ms
    console.log("[gonzales] Polling started (interval=2000ms)");
    poll();
    pollingIntervalRef.current = setInterval(poll, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isPolling, stopPollingInterval, onTestComplete]);

  return {
    isPolling,
    pollingProgress,
    startPolling,
    resetPolling,
    sseWorking,
    pollCount,
    lastPollResult,
  };
}

export function SpeedTestProvider({ children }: { children: ReactNode }) {
  const { progress: sseProgress, isStreaming: isSSEStreaming, startStreaming, reset: resetSSE } = useSSE();
  const { data: status } = useStatus();
  const queryClient = useQueryClient();
  const connectingRef = useRef(false);
  const [triggerState, setTriggerState] = useState<string>("idle");
  const [testActive, setTestActive] = useState(false);

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
    resetPolling,
    sseWorking,
    pollCount,
    lastPollResult,
  } = usePollingFallback(sseProgress, isSSEStreaming, invalidateQueries);

  // Use SSE progress only if SSE is confirmed working
  // Otherwise use polling progress (which shows "started" immediately)
  const progress = sseWorking === true ? sseProgress : pollingProgress;
  const isStreaming = sseWorking === true ? isSSEStreaming : (isPolling || (pollingProgress.phase !== "idle" && pollingProgress.phase !== "complete" && pollingProgress.phase !== "error"));

  // Clear testActive when test reaches terminal state
  useEffect(() => {
    if (progress.phase === "complete" || progress.phase === "error") {
      // Show results for 5 seconds before transitioning to full dashboard
      const t = setTimeout(() => {
        setTestActive(false);
        resetPolling();
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [progress.phase, resetPolling]);

  // Auto-connect to SSE when a test is detected via status polling
  useEffect(() => {
    if (
      status?.scheduler.test_in_progress &&
      !isSSEStreaming &&
      !isPolling &&
      sseProgress.phase === "idle" &&
      pollingProgress.phase === "idle" &&
      !connectingRef.current
    ) {
      console.log("[gonzales] Auto-connect: test_in_progress detected, starting SSE + polling");
      connectingRef.current = true;
      setTestActive(true);
      startStreaming();
      startPolling();
    }
    if (!status?.scheduler.test_in_progress) {
      connectingRef.current = false;
    }
  }, [status?.scheduler.test_in_progress, isSSEStreaming, isPolling, sseProgress.phase, pollingProgress.phase, startStreaming, startPolling]);

  const runTest = useCallback(() => {
    console.log("[gonzales] runTest: starting SSE + polling fallback");
    setTestActive(true);
    setTriggerState("pending");
    startStreaming();
    startPolling();
    api.triggerSpeedtest()
      .then(() => {
        console.log("[gonzales] runTest: trigger accepted (202)");
        setTriggerState("accepted");
        // NOTE: Do NOT set sawTestInProgressRef here - only polls should set it.
        // Setting it from trigger bypasses the grace period, causing premature completion.
      })
      .catch((err) => {
        console.warn("[gonzales] runTest: trigger failed:", err.message);
        setTriggerState(`error: ${err.message}`);
      });
  }, [startStreaming, startPolling]);

  const reset = useCallback(() => {
    resetSSE();
    resetPolling();
    setTestActive(false);
    setTriggerState("idle");
  }, [resetSSE, resetPolling]);

  // Build debug string for on-screen display
  const sseLabel = sseWorking === true ? "OK" : sseWorking === false ? "FAIL" : "?";
  const _debug = `Active:${testActive ? "Y" : "N"} | SSE:${sseLabel} | Poll:${isPolling ? "ON" : "OFF"}(#${pollCount}) | Trigger:${triggerState} | Phase:${progress.phase} | Last:${lastPollResult}`;

  return (
    <SpeedTestContext.Provider
      value={{
        progress,
        isStreaming,
        testActive,
        runTest,
        reset,
        isPollingFallback: sseWorking === false,
        _debug,
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
