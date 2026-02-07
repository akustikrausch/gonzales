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
  const currentRef = useRef(target);
  const frameRef = useRef(0);

  useEffect(() => {
    // Animate from the current VISUAL position (not previous target)
    // This prevents jumps when rapid value changes arrive
    const from = currentRef.current;
    const to = target;

    if (from === to) return;

    // Skip animation when tab is not visible
    if (document.hidden) {
      currentRef.current = to;
      setCurrent(to);
      return;
    }

    const start = performance.now();

    function tick(now: number) {
      if (document.hidden) {
        currentRef.current = to;
        setCurrent(to);
        return;
      }
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      const val = from + (to - from) * eased;
      currentRef.current = val;
      setCurrent(val);

      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    frameRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return current;
}
