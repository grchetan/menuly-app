import { useEffect, useState } from "react";
import { Sparkles, RefreshCw, X, ArrowUpRight } from "lucide-react";
import { APP_VERSION, isNewerVersion } from "@/lib/version";

export function AutoUpdateDetector() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    // 1. Service Worker Update Listener
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        // If a worker is already waiting in background
        if (reg.waiting && navigator.serviceWorker.controller) {
          setUpdateAvailable(true);
        }

        // Listen for new worker installation
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        });
      });

      // Handle controller change (worker took over)
      let isRefreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!isRefreshing) {
          isRefreshing = true;
          window.location.reload();
        }
      });
    }

    // 2. Server API Version Check
    const checkVersion = async () => {
      try {
        const res = await fetch(`/api/version?_t=${Date.now()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.success && data.version) {
          if (isNewerVersion(data.version, APP_VERSION)) {
            setLatestVersion(data.version);
            setUpdateAvailable(true);
          }
        }
      } catch {
        // Silently ignore network check failures
      }
    };

    // Check on mount
    checkVersion();

    // Check periodically every 30 seconds
    const interval = setInterval(checkVersion, 30_000);

    // Also check when tab regains focus or visibility
    const handleFocus = () => {
      checkVersion();
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistration().then((reg) => {
          reg?.update().catch(() => {});
        });
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, []);

  const applyUpdate = async () => {
    setApplying(true);
    try {
      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
          // controllerchange will trigger reload
          setTimeout(() => window.location.reload(), 400);
          return;
        }
      }
    } catch {
      // Fallback direct reload
    }
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  if (!updateAvailable || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[99999] animate-rise max-w-md mx-auto sm:mx-0">
      <div className="rounded-2xl border-2 border-primary/30 bg-card/95 p-4 shadow-lift backdrop-blur-md space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-4.5 animate-spin" style={{ animationDuration: "6s" }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-display text-sm font-bold text-foreground">
                  New Update Available!
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.2 text-[10px] font-extrabold text-primary">
                  v{latestVersion || APP_VERSION}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                New features, faster loading, and performance improvements are ready for your device.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer shrink-0"
            title="Dismiss for now"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/50">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-xl px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
          >
            Later
          </button>
          <button
            type="button"
            onClick={applyUpdate}
            disabled={applying}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-soft cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`size-3.5 ${applying ? "animate-spin" : ""}`} />
            <span>{applying ? "Updating..." : "Update Now"}</span>
            <ArrowUpRight className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
