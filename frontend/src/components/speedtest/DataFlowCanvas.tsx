import { useCallback, useEffect, useRef } from "react";

interface DataFlowCanvasProps {
  /** Current phase direction: "download" flows down, "upload" flows up */
  direction: "download" | "upload";
  /** Current bandwidth in Mbps - controls particle density & speed */
  bandwidth: number;
  /** Phase color as CSS color string */
  color: string;
}

interface Particle {
  x: number;
  y: number;
  speed: number;
  radius: number;
  opacity: number;
}

/** Parse CSS color variable or hex to rgba components */
function parseColor(color: string): [number, number, number] {
  // Common phase colors
  if (color.includes("--g-blue") || color === "#007AFF") return [0, 122, 255];
  if (color.includes("--g-green") || color === "#34C759") return [52, 199, 89];
  if (color.includes("--g-teal")) return [0, 199, 190];
  if (color.includes("--g-orange")) return [255, 149, 0];
  // Fallback: try hex
  if (color.startsWith("#") && color.length === 7) {
    return [
      parseInt(color.slice(1, 3), 16),
      parseInt(color.slice(3, 5), 16),
      parseInt(color.slice(5, 7), 16),
    ];
  }
  return [0, 122, 255];
}

export function DataFlowCanvas({ direction, bandwidth, color }: DataFlowCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });
  const propsRef = useRef({ direction, bandwidth, color });
  propsRef.current = { direction, bandwidth, color };

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const initParticle = useCallback(
    (w: number, h: number, scatter: boolean): Particle => {
      const bw = propsRef.current.bandwidth;
      const speedFactor = Math.min(1, Math.max(0.1, bw / 500));
      return {
        x: Math.random() * w,
        y: scatter ? Math.random() * h : propsRef.current.direction === "download" ? -10 : h + 10,
        speed: (1 + Math.random() * 2) * (0.5 + speedFactor * 2),
        radius: 1 + Math.random() * 2.5,
        opacity: 0.3 + Math.random() * 0.5,
      };
    },
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Reduced motion: draw static gradient overlay
    if (prefersReducedMotion) {
      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        const [r, g, b] = parseColor(propsRef.current.color);
        const grad = ctx.createLinearGradient(0, 0, 0, rect.height);
        grad.addColorStop(0, `rgba(${r},${g},${b},0.03)`);
        grad.addColorStop(0.5, `rgba(${r},${g},${b},0.08)`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0.03)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, rect.width, rect.height);
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);
      return () => ro.disconnect();
    }

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        sizeRef.current = { w: width, h: height };
      }
    });
    ro.observe(canvas);

    // Initialize particles
    const w = canvas.clientWidth || 400;
    const h = canvas.clientHeight || 300;
    sizeRef.current = { w, h };
    particlesRef.current = Array.from({ length: 80 }, () => initParticle(w, h, true));

    function tick() {
      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) {
        animRef.current = requestAnimationFrame(tick);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      ctx!.clearRect(0, 0, w * dpr, h * dpr);
      ctx!.save();
      ctx!.scale(dpr, dpr);

      const { direction: dir, bandwidth: bw, color: c } = propsRef.current;
      const [r, g, b] = parseColor(c);

      // Target particle count scales with bandwidth
      const targetCount = Math.min(120, Math.max(60, Math.floor(40 + bw / 5)));
      const particles = particlesRef.current;

      // Add or remove particles to match target
      while (particles.length < targetCount) {
        particles.push(initParticle(w, h, false));
      }
      if (particles.length > targetCount + 10) {
        particles.splice(targetCount, particles.length - targetCount);
      }

      ctx!.globalCompositeOperation = "lighter";

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Move
        if (dir === "download") {
          p.y += p.speed;
          if (p.y > h + 10) {
            particles[i] = initParticle(w, h, false);
            continue;
          }
        } else {
          p.y -= p.speed;
          if (p.y < -10) {
            particles[i] = initParticle(w, h, false);
            continue;
          }
        }

        // Draw with radial gradient glow
        const grad = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
        grad.addColorStop(0, `rgba(${r},${g},${b},${p.opacity})`);
        grad.addColorStop(0.4, `rgba(${r},${g},${b},${p.opacity * 0.4})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        ctx!.fillStyle = grad;
        ctx!.fill();
      }

      ctx!.restore();
      animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [prefersReducedMotion, initParticle]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}
