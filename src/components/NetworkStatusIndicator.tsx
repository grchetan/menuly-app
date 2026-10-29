import { useEffect, useState, useRef, useCallback } from "react";
import { WifiOff, CheckCircle2, X, RotateCw, Wifi } from "lucide-react";

export function NetworkStatusIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [isSlow, setIsSlow] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Track auto-dismiss timers
  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
    };
  }, []);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
  }, []);

  // 1. Online / Offline listeners
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOffline(false);
      setIsDismissed(false);
      setJustReconnected(true);
      if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = setTimeout(() => {
        setJustReconnected(false);
      }, 4000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setIsDismissed(false);
      setJustReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setIsOffline(true);
    }

    // 2. Slow Network Detection using Network Information API
    const checkConnectionSpeed = () => {
      try {
        const nav = navigator as Navigator & {
          connection?: {
            effectiveType?: string;
            saveData?: boolean;
            rtt?: number;
            addEventListener?: (type: string, listener: () => void) => void;
            removeEventListener?: (type: string, listener: () => void) => void;
          };
        };

        const conn = nav.connection;
        if (conn && navigator.onLine) {
          const slowType = conn.effectiveType === "2g" || conn.effectiveType === "slow-2g";
          const highRtt = Boolean(conn.rtt && conn.rtt > 1800);
          const detectedSlow = slowType || highRtt;

          if (detectedSlow) {
            setIsSlow((prev) => {
              if (!prev) {
                // When newly detected as slow, show toast and auto-dismiss after 7.5s
                setIsDismissed(false);
                if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
                autoDismissTimerRef.current = setTimeout(() => {
                  setIsDismissed(true);
                }, 7500);
              }
              return true;
            });
          } else {
            setIsSlow(false);
          }
        }
      } catch {
        // Network Information API not supported on this browser
      }
    };

    checkConnectionSpeed();

    const nav = navigator as any;
    if (nav.connection?.addEventListener) {
      nav.connection.addEventListener("change", checkConnectionSpeed);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (nav.connection?.removeEventListener) {
        nav.connection.removeEventListener("change", checkConnectionSpeed);
      }
    };
  }, []);

  // Quick connectivity test function
  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Lightweight probe ping
      const res = await fetch("/api/auth/me", { method: "HEAD", cache: "no-store" });
      if (res.ok || res.status < 500) {
        setIsOffline(false);
        setJustReconnected(true);
        setIsDismissed(false);
        if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
        autoDismissTimerRef.current = setTimeout(() => {
          setJustReconnected(false);
        }, 3500);
      }
    } catch {
      // Still offline
    } finally {
      setIsRetrying(false);
    }
  };

  // Determine current active state
  const hasActiveNotice = isOffline || isSlow || justReconnected;
  const isVisible = hasActiveNotice && !isDismissed;

  if (!hasActiveNotice && !isVisible) {
    return null;
  }

  return (
    <aside
      role="status"
      aria-live="polite"
      className={`fixed z-[9999] pointer-events-none transition-all duration-300 ease-out 
        bottom-4 inset-x-3.5 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:max-w-sm
        ${isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95 pointer-events-none"}
      `}
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* 1. Offline Alert Card */}
      {isOffline && (
        <div className="pointer-events-auto rounded-2xl border border-destructive/35 bg-card/95 dark:bg-neutral-900/95 backdrop-blur-2xl p-3.5 shadow-[0_12px_40px_rgba(239,68,68,0.22)] dark:shadow-[0_14px_45px_rgba(0,0,0,0.7)] flex items-start gap-3 select-none">
          {/* Pulsing Beacon Icon */}
          <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-destructive/15 text-destructive border border-destructive/25 mt-0.5">
            <span className="absolute inline-flex size-full animate-ping rounded-xl bg-destructive/20 opacity-75" />
            <WifiOff className="size-4 relative z-10" />
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-xs font-bold text-foreground">Internet Connection Lost</h4>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-destructive/15 text-destructive border border-destructive/20">
                Offline
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              You are currently offline. Menus and updates will resume automatically once connected.
            </p>
            <div className="flex items-center gap-2 mt-2.5">
              <button
                type="button"
                onClick={handleRetry}
                disabled={isRetrying}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-destructive text-white text-[11px] font-bold shadow-xs hover:bg-destructive/90 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={`size-3 ${isRetrying ? "animate-spin" : ""}`} />
                <span>{isRetrying ? "Checking..." : "Retry Now"}</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss offline alert"
            className="size-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* 2. Slow Network Alert Card */}
      {!isOffline && isSlow && (
        <div className="pointer-events-auto rounded-2xl border border-amber-500/35 bg-card/95 dark:bg-neutral-900/95 backdrop-blur-2xl p-3.5 shadow-[0_12px_40px_rgba(245,158,11,0.22)] dark:shadow-[0_14px_45px_rgba(0,0,0,0.7)] flex items-start gap-3 select-none">
          {/* Animated Solar Amber Wave Icon */}
          <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 mt-0.5">
            <span className="absolute inline-flex size-full animate-ping rounded-xl bg-amber-400/25 opacity-75" />
            <Wifi className="size-4 relative z-10" />
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-xs font-bold text-foreground">Slow Connection Detected</h4>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                2G / Slow
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              Network speed is low. Food photos and menu updates may take an extra moment to load.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss slow network alert"
            className="size-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* 3. Reconnected Success Card */}
      {!isOffline && !isSlow && justReconnected && (
        <div className="pointer-events-auto rounded-2xl border border-emerald-500/35 bg-card/95 dark:bg-neutral-900/95 backdrop-blur-2xl p-3 shadow-[0_12px_40px_rgba(16,185,129,0.22)] dark:shadow-[0_14px_45px_rgba(0,0,0,0.7)] flex items-center gap-3 select-none">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="size-4" />
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <h4 className="text-xs font-bold text-foreground">Internet Connection Restored</h4>
            <p className="text-[11px] text-muted-foreground leading-snug">
              You are back online. Real-time menu features active.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss restored alert"
            className="size-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </aside>
  );
}
