import { useCallback, useRef, useState } from "react";

export interface SpeedSample {
  time: number;
  value: number;
}

/**
 * Accumulates bandwidth samples during a speed test phase.
 * Throttles re-renders to ~250ms via a version counter.
 */
export function useSpeedHistory() {
  const samplesRef = useRef<SpeedSample[]>([]);
  const peakRef = useRef(0);
  const [version, setVersion] = useState(0);
  const lastRenderRef = useRef(0);

  const push = useCallback((value: number, elapsed: number) => {
    samplesRef.current.push({ time: elapsed, value });
    if (value > peakRef.current) {
      peakRef.current = value;
    }
    const now = performance.now();
    if (now - lastRenderRef.current > 250) {
      lastRenderRef.current = now;
      setVersion((v) => v + 1);
    }
  }, []);

  const reset = useCallback(() => {
    samplesRef.current = [];
    peakRef.current = 0;
    lastRenderRef.current = 0;
    setVersion(0);
  }, []);

  // Force a final render (used when phase ends)
  const flush = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  return {
    samples: samplesRef.current,
    peak: peakRef.current,
    push,
    reset,
    flush,
    /** Subscribe to this in dependency arrays to get throttled updates */
    version,
  };
}
