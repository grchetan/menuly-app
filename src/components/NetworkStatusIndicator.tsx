import { useEffect, useState } from "react";
import { WifiOff, AlertTriangle, CheckCircle2 } from "lucide-react";

export function NetworkStatusIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [isSlow, setIsSlow] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Online / Offline listeners
    const handleOnline = () => {
      setIsOffline(false);
      setJustReconnected(true);
      setTimeout(() => setJustReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setJustReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial online check
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
        if (conn) {
          const slowType = conn.effectiveType === "2g" || conn.effectiveType === "slow-2g";
          const highRtt = Boolean(conn.rtt && conn.rtt > 1800);
          setIsSlow(slowType || highRtt);
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

  // Display nothing when connection is normal & online
  if (!isOffline && !isSlow && !justReconnected) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[9998] pointer-events-none px-4 w-full max-w-sm animate-rise">
      {isOffline && (
        <div className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs font-bold text-destructive shadow-lift backdrop-blur-md">
          <WifiOff className="size-4 shrink-0 animate-pulse" />
          <span>No internet connection. Waiting to reconnect...</span>
        </div>
      )}

      {!isOffline && isSlow && (
        <div className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-amber-500/40 bg-card/95 px-4 py-2 text-xs font-bold text-amber-700 dark:text-amber-400 shadow-lift backdrop-blur-md">
          <AlertTriangle className="size-4 shrink-0 text-amber-500 animate-bounce" style={{ animationDuration: "2s" }} />
          <span>Slow internet detected. Menus may take a moment to load.</span>
        </div>
      )}

      {!isOffline && !isSlow && justReconnected && (
        <div className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-veg/40 bg-card/95 px-4 py-2 text-xs font-bold text-veg shadow-lift backdrop-blur-md">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>Internet connection restored.</span>
        </div>
      )}
    </div>
  );
}
