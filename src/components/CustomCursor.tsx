import React, { useEffect, useRef, useState } from "react";
import cursorImg from "@/assets/Forest Green QR Cursor Icon.png";
import { cn } from "@/lib/utils";

interface Ripple {
  id: number;
  x: number;
  y: number;
}

// Exact Arrow Tip hotspot offset in 1335x1178 image:
// x = 447px (33.48%), y = 208px (17.66%)
// At width = 52px, height = 45.88px:
// offsetX = 52 * 0.3348 = 17.4px
// offsetY = 45.88 * 0.1766 = 8.1px
const CURSOR_WIDTH = 52;
const HOTSPOT_OFFSET_X = 17.4;
const HOTSPOT_OFFSET_Y = 8.1;

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  // Ref to outer container: handles real-time position with ZERO transition lag
  const cursorContainerRef = useRef<HTMLDivElement>(null);

  // 1. Detect desktop fine pointer vs touch/mobile device
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

  // 2. High-speed, 0-lag pointermove tracking with requestAnimationFrame
  useEffect(() => {
    if (!enabled) return;

    let targetX = -100;
    let targetY = -100;
    let rafId: number | null = null;
    let hasMoved = false;

    const updatePosition = () => {
      if (cursorContainerRef.current) {
        cursorContainerRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      }
      rafId = null;
    };

    const onPointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!hasMoved) {
        hasMoved = true;
        setIsVisible(true);
      }

      // Schedule real-time position update on the very next animation frame
      if (!rafId) {
        rafId = requestAnimationFrame(updatePosition);
      }

      // Detect hover over interactive elements
      const target = e.target as Element | null;
      if (target) {
        const interactive = Boolean(
          target.closest(
            'a, button, [role="button"], input, textarea, select, [tabindex]:not([tabindex="-1"]), label, summary, .cursor-pointer, [data-clickable="true"]'
          )
        );
        setIsHovered(interactive);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      setIsPressed(true);

      // Spawn orange click ripple centered directly on the arrow tip click point
      const id = Date.now() + Math.random();
      const x = e.clientX;
      const y = e.clientY;

      setRipples((prev) => [...prev.slice(-4), { id, x, y }]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 450);
    };

    const onPointerUp = () => {
      setIsPressed(false);
    };

    const onPointerEnter = () => {
      setIsVisible(true);
    };

    const onPointerLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    document.addEventListener("pointerenter", onPointerEnter);
    document.addEventListener("pointerleave", onPointerLeave);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointerenter", onPointerEnter);
      document.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [enabled]);

  // If mobile/touch or disabled, render nothing
  if (!enabled || !isVisible) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[999999] overflow-hidden select-none"
    >
      {/* 1. Orange Click Ripples */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="pointer-events-none fixed size-12 rounded-full border-2 border-amber-500/90 bg-amber-500/20 shadow-[0_0_16px_rgba(245,158,11,0.65)] animate-cursor-ripple"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
          }}
        />
      ))}

      {/* 2. Custom Cursor Outer Container: Real-time 0-lag position tracking */}
      <div
        ref={cursorContainerRef}
        className="pointer-events-none fixed top-0 left-0 will-change-transform"
        style={{
          transform: "translate3d(-100px, -100px, 0)",
          transition: "none",
        }}
      >
        {/* Inner wrapper: Handles subtle hover scaling & click press without affecting position */}
        <div
          className={cn(
            "origin-top-left transition-transform duration-200 ease-out select-none",
            isPressed
              ? "scale-90 rotate-[-1deg]"
              : isHovered
              ? "scale-[1.14] rotate-[-3deg]"
              : "scale-100 rotate-0"
          )}
        >
          <img
            src={cursorImg}
            alt=""
            width={CURSOR_WIDTH}
            height={46}
            style={{
              width: `${CURSOR_WIDTH}px`,
              height: "auto",
              transform: `translate(-${HOTSPOT_OFFSET_X}px, -${HOTSPOT_OFFSET_Y}px)`,
            }}
            className="object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)] select-none pointer-events-none"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
