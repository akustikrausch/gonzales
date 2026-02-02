import { useCallback, useRef, useState } from "react";

export interface SSEProgress {
  phase: "idle" | "started" | "ping" | "download" | "upload" | "complete" | "error";
  bandwidth_mbps?: number;
  progress?: number;
  ping_ms?: number;
  elapsed?: number;
  download_mbps?: number;
  upload_mbps?: number;
  jitter_ms?: number;
  measurement_id?: number;
  message?: string;
}

export function useSSE() {
  const [progress, setProgress] = useState<SSEProgress>({ phase: "idle" });
  const [isStreaming, setIsStreaming] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const receivedTerminalRef = useRef(false);

  const startStreaming = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
    }

    setProgress({ phase: "idle" });
    setIsStreaming(true);
    receivedTerminalRef.current = false;

    const es = new EventSource("/api/v1/speedtest/stream");
    esRef.current = es;

    es.addEventListener("started", () => {
      setProgress({ phase: "started" });
    });

    es.addEventListener("progress", (e) => {
      try {
        const data = JSON.parse(e.data);
        setProgress({
          phase: data.phase || "started",
          bandwidth_mbps: data.bandwidth_mbps,
          progress: data.progress,
          ping_ms: data.ping_ms,
          elapsed: data.elapsed,
        });
      } catch {
        /* ignore malformed event */
      }
    });

    es.addEventListener("complete", (e) => {
      receivedTerminalRef.current = true;
      try {
        const data = JSON.parse(e.data);
        setProgress({
          phase: "complete",
          download_mbps: data.download_mbps,
          upload_mbps: data.upload_mbps,
          ping_ms: data.ping_ms,
          jitter_ms: data.jitter_ms,
          measurement_id: data.measurement_id,
        });
      } catch {
        setProgress({ phase: "complete" });
      }
      setIsStreaming(false);
      es.close();
      esRef.current = null;
    });

    es.addEventListener("error", (e) => {
      // Only handle server-sent error events (MessageEvent), not connection errors
      if (e instanceof MessageEvent) {
        receivedTerminalRef.current = true;
        try {
          const data = JSON.parse(e.data);
          setProgress({ phase: "error", message: data.message });
        } catch {
          setProgress({ phase: "error", message: "Unknown error" });
        }
        setIsStreaming(false);
        es.close();
        esRef.current = null;
      }
      // Connection errors: let EventSource auto-reconnect.
      // The backend buffers the last event so reconnected subscribers catch up.
    });

    es.onerror = () => {
      // If we already received complete/error, no need to reconnect
      if (receivedTerminalRef.current) {
        return;
      }
      // Otherwise let EventSource auto-reconnect.
      // If the connection was permanently lost (readyState === CLOSED),
      // clean up so auto-detect via status polling can take over.
      if (es.readyState === EventSource.CLOSED) {
        if (esRef.current === es) {
          setIsStreaming(false);
          esRef.current = null;
        }
      }
    };
  }, []);

  const reset = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    receivedTerminalRef.current = false;
    setProgress({ phase: "idle" });
    setIsStreaming(false);
  }, []);

  return { progress, isStreaming, startStreaming, reset };
}
