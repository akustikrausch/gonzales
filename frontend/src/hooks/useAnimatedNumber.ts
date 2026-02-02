import { useEffect, useRef, useState } from "react";

/**
 * Animates a numeric value from its previous value to the new target.
 * Uses requestAnimationFrame with easeOutExpo for smooth counting.
 */
export function useAnimatedNumber(
  target: number,
  duration = 600,
): number {
  const [current, setCurrent] = useState(target);
  const prevRef = useRef(target);
  const frameRef = useRef(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    prevRef.current = to;

    if (from === to) return;

    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setCurrent(from + (to - from) * eased);

      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    frameRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return current;
}
