import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type RGB = [number, number, number];

export function NavCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    const rgb: RGB = [46, 125, 82]; // Menuly warm emerald/forest green
    let frame = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const dot = 14;
    const draw = (time: number) => {
      const [r, g, b] = rgb;
      ctx.clearRect(0, 0, width, height);

      // Scanning light beam sweeping left-to-right
      const cycle = (time % 5200) / 5200;
      const beamX = -0.25 + cycle * 1.5;
      const beam = beamX * width;

      for (let x = dot / 2; x < width; x += dot) {
        for (let y = dot / 2; y < height; y += dot) {
          const dist = Math.abs(x - beam);
          const near = Math.max(0, 1 - dist / 90);
          const wave = 0.5 + 0.5 * Math.sin(time / 900 + (x + y) / 46);
          const alpha = 0.04 + near * 0.45 + wave * 0.04;
          const size = 1 + near * 1.2;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Vertical soft glow gradient for the beam
      const grad = ctx.createLinearGradient(beam - 40, 0, beam + 40, 0);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
      grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.14)`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(beam - 40, 0, 80, height);

      if (!reduce) frame = requestAnimationFrame(draw);
    };

    resize();
    if (reduce) {
      draw(0);
    } else {
      frame = requestAnimationFrame(draw);
    }

    const onResize = () => {
      resize();
      if (reduce) draw(0);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 size-full", className)}
    />
  );
}
