import { useCallback, useRef, useState } from "react";

function getSSEBase(): string {
  const path = window.location.pathname;
  const match = path.match(/^(\/api\/hassio_ingress\/[^/]+)/);
  return match ? `${match[1]}/api/v1` : "/api/v1";
}

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

interface SSEEvent {
  event: string;
  data: string;
}

/** Parse raw SSE text chunk into events */
function parseSSEEvents(raw: string): SSEEvent[] {
  const events: SSEEvent[] = [];
  const blocks = raw.split("\n\n");
  for (const block of blocks) {
    if (!block.trim()) continue;
    let eventName = "message";
    let data = "";
    for (const line of block.split("\n")) {
      if (line.startsWith(":")) continue; // comment / keepalive
      if (line.startsWith("event: ")) eventName = line.slice(7);
      else if (line.startsWith("data: ")) data = line.slice(6);
    }
    if (data || eventName !== "message") {
      events.push({ event: eventName, data });
    }
  }
  return events;
}

export function useSSE() {
  const [progress, setProgress] = useState<SSEProgress>({ phase: "idle" });
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const receivedTerminalRef = useRef(false);

  const startStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }

    setProgress({ phase: "idle" });
    setIsStreaming(true);
    receivedTerminalRef.current = false;

    const controller = new AbortController();
    abortRef.current = controller;

    const url = `${getSSEBase()}/speedtest/stream`;
    console.debug("[gonzales] SSE: connecting to", url);

    (async () => {
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: { "Accept": "text/event-stream" },
        });

        if (!response.ok || !response.body) {
          console.debug("[gonzales] SSE: failed with status", response.status);
          throw new Error(`Stream failed: ${response.status}`);
        }
        console.debug("[gonzales] SSE: connected, reading stream...");

        const reader = response.body
          .pipeThrough(new TextDecoderStream())
          .getReader();

        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += value;

          const lastDoubleNewline = buffer.lastIndexOf("\n\n");
          if (lastDoubleNewline === -1) continue;

          const complete = buffer.slice(0, lastDoubleNewline + 2);
          buffer = buffer.slice(lastDoubleNewline + 2);

          const events = parseSSEEvents(complete);

          for (const evt of events) {
            if (evt.event === "started") {
              setProgress({ phase: "started" });
            } else if (evt.event === "progress") {
              try {
                const data = JSON.parse(evt.data);
                setProgress({
                  phase: data.phase || "started",
                  bandwidth_mbps: data.bandwidth_mbps,
                  progress: data.progress,
                  ping_ms: data.ping_ms,
                  elapsed: data.elapsed,
                });
              } catch { /* ignore malformed */ }
            } else if (evt.event === "complete") {
              receivedTerminalRef.current = true;
              try {
                const data = JSON.parse(evt.data);
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
              abortRef.current = null;
              return;
            } else if (evt.event === "error") {
              receivedTerminalRef.current = true;
              try {
                const data = JSON.parse(evt.data);
                setProgress({ phase: "error", message: data.message });
              } catch {
                setProgress({ phase: "error", message: "Unknown error" });
              }
              setIsStreaming(false);
              abortRef.current = null;
              return;
            }
          }
        }

        if (!receivedTerminalRef.current) {
          setIsStreaming(false);
          abortRef.current = null;
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        console.debug("[gonzales] SSE: connection error:", err instanceof Error ? err.message : err);
        if (!receivedTerminalRef.current) {
          setIsStreaming(false);
          abortRef.current = null;
        }
      }
    })();
  }, []);

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    receivedTerminalRef.current = false;
    setProgress({ phase: "idle" });
    setIsStreaming(false);
  }, []);

  return { progress, isStreaming, startStreaming, reset };
}
