import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import cursorImg from "@/assets/Forest Green QR Cursor Icon.png";
import { cn } from "@/lib/utils";

interface Ripple {
  id: number;
  x: number;
  y: number;
}

// Exact Arrow Tip hotspot offset in 1335x1178 source image:
// Arrow Tip: x = 447px (33.4831%), y = 208px (17.6570%)
// At width = 62px, height = 54.71px:
// offsetX = 62 * (447 / 1335) = 20.76px
// offsetY = 54.71 * (208 / 1178) = 9.66px
const CURSOR_WIDTH = 62;
const CURSOR_HEIGHT = Math.round(CURSOR_WIDTH * (1178 / 1335) * 100) / 100; // 54.71px
const HOTSPOT_OFFSET_X = Math.round(CURSOR_WIDTH * (447 / 1335) * 100) / 100; // 20.76px
const HOTSPOT_OFFSET_Y = Math.round(CURSOR_HEIGHT * (208 / 1178) * 100) / 100; // 9.66px

// Strict mobile / touch screen detector
function isTouchOrMobileDevice(): boolean {
  if (typeof window === "undefined") return true;

  // 1. Mobile & tablet user agent check
  const isMobileUA =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(
      navigator.userAgent
    );

  // 2. Hardware touch detection
  const hasTouchScreen =
    "ontouchstart" in window ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
    // @ts-expect-error legacy touch points
    Boolean(navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0);

  // 3. Screen width check (phones and tablets <= 1024px)
  const isMobileViewport = window.innerWidth <= 1024;

  // 4. Pointer capability media queries
  const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const hasNoHover = window.matchMedia("(hover: none)").matches;
  const hasFinePointer = window.matchMedia("(pointer: fine) and (hover: hover)").matches;

  // If any mobile characteristic is present, disable custom cursor completely
  if (
    isMobileUA ||
    hasCoarsePointer ||
    hasNoHover ||
    (hasTouchScreen && isMobileViewport) ||
    !hasFinePointer
  ) {
    return true;
  }

  return false;
}

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [mounted, setMounted] = useState(false);

  // Ref to outer container: handles real-time position with ZERO transition lag
  const cursorContainerRef = useRef<HTMLDivElement>(null);

  // 1. Detect desktop fine pointer vs touch/mobile device
  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    const checkDevice = () => {
      const isMobile = isTouchOrMobileDevice();
      const isDesktop = !isMobile;
      setEnabled(isDesktop);

      if (isDesktop) {
        document.documentElement.classList.add("has-custom-cursor");
      } else {
        document.documentElement.classList.remove("has-custom-cursor");
      }
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
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
      // Strictly ignore any touch event (mobile touches)
      if (e.pointerType === "touch") {
        setIsVisible(false);
        return;
      }

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
      if (e.pointerType === "touch") return;
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

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      setIsPressed(false);
    };

    const onPointerEnter = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      setIsVisible(true);
    };

    const onPointerLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    document.addEventListener("pointerenter", onPointerEnter as EventListener);
    document.addEventListener("pointerleave", onPointerLeave);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointerenter", onPointerEnter as EventListener);
      document.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [enabled]);

  // If mobile/touch, unmounted, or hidden, render nothing
  if (!mounted || !enabled || !isVisible || typeof document === "undefined") {
    return null;
  }

  // Render directly into document.body with max z-index (2147483647)
  // so the cursor ALWAYS floats on top of toasts, modals, sheets, and popovers
  return createPortal(
    <div
      aria-hidden="true"
      className="menuly-custom-cursor-layer select-none pointer-events-none"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        pointerEvents: "none",
        overflow: "hidden",
      }}
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
              ? "scale-[1.12] rotate-[-3deg]"
              : "scale-100 rotate-0"
          )}
        >
          <img
            src={cursorImg}
            alt=""
            width={CURSOR_WIDTH}
            height={Math.round(CURSOR_HEIGHT)}
            style={{
              width: `${CURSOR_WIDTH}px`,
              height: "auto",
              transform: `translate(-${HOTSPOT_OFFSET_X}px, -${HOTSPOT_OFFSET_Y}px)`,
            }}
            className="object-contain drop-shadow-[0_4px_14px_rgba(0,0,0,0.32)] select-none pointer-events-none"
            draggable={false}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
