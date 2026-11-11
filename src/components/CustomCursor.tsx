import { useEffect } from "react";

/**
 * Standard Native OS Mouse Pointer
 * Restores 100% natural, hardware-accelerated system pointers across all platforms.
 */
export function CustomCursor() {
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("has-custom-cursor");
    }
  }, []);

  return null;
}
