import { createContext, useCallback, useContext, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSSE, type SSEProgress } from "../hooks/useSSE";
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
  const queryClient = useQueryClient();

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
