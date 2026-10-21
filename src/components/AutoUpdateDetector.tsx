import { useEffect, useState } from "react";
import { Sparkles, RefreshCw, X } from "lucide-react";
import { APP_VERSION, isNewerVersion } from "@/lib/version";

export function AutoUpdateDetector() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(6);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
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

    // Also check when tab regains focus
    const handleFocus = () => {
      checkVersion();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, []);

  // Automatic countdown when update is detected
  useEffect(() => {
    if (!updateAvailable || dismissed) return;

    const t = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          applyUpdate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [updateAvailable, dismissed]);

  const applyUpdate = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  if (!updateAvailable || dismissed) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] animate-rise px-4 w-full max-w-md">
      <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-primary/40 bg-card/95 p-3.5 shadow-lift backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="size-4 animate-spin" style={{ animationDuration: "6s" }} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate">
              New Update Live (v{latestVersion || APP_VERSION})
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              Applying newest features in {countdown}s...
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={applyUpdate}
            className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
          >
            <RefreshCw className="size-3" /> Update
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            title="Dismiss update"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
