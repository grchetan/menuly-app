import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";

const SESSION_KEY = "menuly_vid";
const CAMPAIGN_KEY = "menuly_campaign_data";

export function VisitorTracker() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const currentSearch = routerState.location.searchStr;
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Avoid duplicate pings for identical path in short burst
    if (lastTrackedPath.current === currentPath) return;
    lastTrackedPath.current = currentPath;

    try {
      // 1. Session ID (persisted for the browser session)
      let sessionId = sessionStorage.getItem(SESSION_KEY);
      if (!sessionId) {
        sessionId = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
        sessionStorage.setItem(SESSION_KEY, sessionId);
      }

      // 2. Extract UTM parameters from current URL
      const searchParams = new URLSearchParams(window.location.search);
      const urlSource = searchParams.get("utm_source") || searchParams.get("source");
      const urlMedium = searchParams.get("utm_medium") || searchParams.get("medium");
      const urlCampaign = searchParams.get("utm_campaign") || searchParams.get("campaign");

      // 3. First-Touch Attribution: If landing with UTM, save to sessionStorage for conversion tracking
      if (urlSource || urlCampaign) {
        sessionStorage.setItem(
          CAMPAIGN_KEY,
          JSON.stringify({
            source: urlSource,
            medium: urlMedium,
            campaign: urlCampaign,
            landedAt: new Date().toISOString(),
          })
        );
      }

      // 4. Fallback to stored campaign data if navigating subpages
      let storedCampaign: { source?: string; medium?: string; campaign?: string } = {};
      try {
        const raw = sessionStorage.getItem(CAMPAIGN_KEY);
        if (raw) storedCampaign = JSON.parse(raw);
      } catch {
        // ignore
      }

      const activeSource = urlSource || storedCampaign.source || undefined;
      const activeMedium = urlMedium || storedCampaign.medium || undefined;
      const activeCampaign = urlCampaign || storedCampaign.campaign || undefined;

      // 5. Device detection
      const isMobile =
        window.innerWidth < 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const device = isMobile ? "mobile" : "desktop";

      // 6. Build payload
      const payload = {
        path: currentPath,
        source: activeSource,
        medium: activeMedium,
        campaign: activeCampaign,
        referrer: document.referrer || undefined,
        device,
        browser: navigator.userAgent.slice(0, 80),
        sessionId,
      };

      const jsonStr = JSON.stringify(payload);

      // 7. High-performance non-blocking transmission
      if (navigator.sendBeacon) {
        const blob = new Blob([jsonStr], { type: "application/json" });
        navigator.sendBeacon("/api/analytics/track", blob);
      } else {
        fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: jsonStr,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Non-blocking telemetry
    }
  }, [currentPath, currentSearch]);

  return null;
}
