import React, { useEffect, useRef, useState } from "react";
import cursorImg from "@/assets/Forest Green QR Cursor Icon.png";

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  // Refs for high-performance direct DOM manipulation (bypasses React render loop)
  const cursorRef = useRef<HTMLDivElement>(null);
  const auraRef = useRef<HTMLDivElement>(null);

  // Positional coordinates
  const targetPos = useRef({ x: -100, y: -100 });
  const currentPos = useRef({ x: -100, y: -100 });
  const auraPos = useRef({ x: -100, y: -100 });
  const animFrameId = useRef<number | null>(null);

  // 1. Detect desktop vs touch device
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkFinePointer = () => {
      const finePointer = window.matchMedia("(pointer: fine) and (hover: hover)").matches;
      const isTouch =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia("(pointer: coarse)").matches;

      const isDesktop = finePointer && !isTouch;
      setEnabled(isDesktop);

      if (isDesktop) {
        document.documentElement.classList.add("has-custom-cursor");
      } else {
        document.documentElement.classList.remove("has-custom-cursor");
      }
    };

    checkFinePointer();
    window.addEventListener("resize", checkFinePointer);

    return () => {
      window.removeEventListener("resize", checkFinePointer);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, []);

  // 2. High-speed 120fps animation loop using requestAnimationFrame
  useEffect(() => {
    if (!enabled) return;

    const loop = () => {
      // Fast responsive lerp for cursor pointer (instant feel)
      const cursorLerp = 0.85;
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * cursorLerp;
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * cursorLerp;

      // Softer smoother lerp for the ambient trailing aura
      const auraLerp = 0.35;
      auraPos.current.x += (targetPos.current.x - auraPos.current.x) * auraLerp;
      auraPos.current.y += (targetPos.current.y - auraPos.current.y) * auraLerp;

      // Update Cursor Tip:
      // The arrow tip hotspot in "Forest Green QR Cursor Icon.png" is at ~33% X and ~18% Y.
      // With width: 36px, height: ~32px -> offset is -12px X and -6px Y.
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${currentPos.current.x - 12}px, ${
          currentPos.current.y - 6
        }px, 0)`;
      }

      // Update Ambient Aura
      if (auraRef.current) {
        auraRef.current.style.transform = `translate3d(${auraPos.current.x - 18}px, ${
          auraPos.current.y - 18
        }px, 0)`;
      }

      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [enabled]);

  // 3. Mouse event listeners (Move, Enter, Leave, Click, Hover detection)
  useEffect(() => {
    if (!enabled) return;

    const onMouseMove = (e: MouseEvent) => {
      targetPos.current.x = e.clientX;
      targetPos.current.y = e.clientY;
      if (!isVisible) setIsVisible(true);

      // Check if hovering over clickable or interactive element
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = Boolean(
          target.closest(
            'a, button, [role="button"], input, textarea, select, [tabindex]:not([tabindex="-1"]), label, summary, .cursor-pointer, [data-clickable="true"]'
          )
        );
        setIsHovered(interactive);
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      setIsPressed(true);
      // Spawn orange click ripple exactly at mouse click coordinates
      const id = Date.now() + Math.random();
      const x = e.clientX;
      const y = e.clientY;

      setRipples((prev) => [...prev.slice(-5), { id, x, y }]);

      // Self-cleaning ripple
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 500);
    };

    const onMouseUp = () => {
      setIsPressed(false);
    };

    const onMouseEnter = () => {
      setIsVisible(true);
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    document.addEventListener("mouseenter", onMouseEnter);
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseenter", onMouseEnter);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [enabled, isVisible]);

  // If on mobile/touch or disabled, render nothing
  if (!enabled || !isVisible) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden select-none"
    >
      {/* 1. Ambient Trailing Aura (Smooth forest-green & warm-orange glow) */}
      <div
        ref={auraRef}
        className={`pointer-events-none fixed top-0 left-0 size-9 rounded-full blur-[6px] transition-all duration-300 will-change-transform ${
          isHovered
            ? "bg-amber-500/35 scale-125"
            : "bg-emerald-600/20 scale-90"
        }`}
      />

      {/* 2. Orange Click Ripples */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="pointer-events-none fixed top-0 left-0 size-10 rounded-full border-2 border-amber-500/90 bg-amber-500/25 shadow-[0_0_14px_rgba(245,158,11,0.65)] animate-cursor-ripple"
          style={{
            transform: `translate3d(${ripple.x - 20}px, ${ripple.y - 20}px, 0)`,
          }}
        />
      ))}

      {/* 3. Primary Custom Animated Cursor Icon */}
      <div
        ref={cursorRef}
        className={`pointer-events-none fixed top-0 left-0 will-change-transform transition-transform duration-150 ease-out origin-top-left ${
          isPressed
            ? "scale-90 rotate-[-1deg]"
            : isHovered
            ? "scale-[1.18] rotate-[-4deg]"
            : "scale-100 rotate-0"
        }`}
      >
        <img
          src={cursorImg}
          alt=""
          width={36}
          height={32}
          className="size-9 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.28)]"
          draggable={false}
        />
      </div>
    </div>
  );
}
