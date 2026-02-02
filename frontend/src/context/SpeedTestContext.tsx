import { createContext, useCallback, useContext, useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSSE, type SSEProgress } from "../hooks/useSSE";
import { useStatus } from "../hooks/useApi";
import { api } from "../api/client";

interface SpeedTestContextValue {
  progress: SSEProgress;
  isStreaming: boolean;
  runTest: () => void;
  reset: () => void;
}

const SpeedTestContext = createContext<SpeedTestContextValue | null>(null);

export function SpeedTestProvider({ children }: { children: ReactNode }) {
  const { progress, isStreaming, startStreaming, reset } = useSSE();
  const { data: status } = useStatus();
  const queryClient = useQueryClient();

  // Auto-connect to SSE when a test is detected via status polling
  // (e.g. scheduler-triggered tests or page load during active test)
  useEffect(() => {
    if (
      status?.scheduler.test_in_progress &&
      !isStreaming &&
      progress.phase === "idle"
    ) {
      startStreaming();
    }
  }, [status?.scheduler.test_in_progress, isStreaming, progress.phase, startStreaming]);

  const runTest = useCallback(() => {
    startStreaming();
    api.triggerSpeedtest().then(() => {
      queryClient.invalidateQueries({ queryKey: ["measurement"] });
      queryClient.invalidateQueries({ queryKey: ["measurements"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
      queryClient.invalidateQueries({ queryKey: ["status"] });
    });
  }, [startStreaming, queryClient]);

  return (
    <SpeedTestContext.Provider value={{ progress, isStreaming, runTest, reset }}>
      {children}
    </SpeedTestContext.Provider>
  );
}

export function useSpeedTest() {
  const ctx = useContext(SpeedTestContext);
  if (!ctx) throw new Error("useSpeedTest must be used within SpeedTestProvider");
  return ctx;
}
