import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie, X, ChevronDown, ChevronUp, ShieldCheck, Lock, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CONSENT_STORAGE_KEY = "menuly_cookie_consent";

export type CookieConsentType = "accepted" | "rejected" | "custom" | "dismissed";

export interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always true & disabled
    functional: true,
    analytics: true,
  });

  useEffect(() => {
    // Check if user has already made a cookie choice
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) {
      // Small delay for smooth entrance after initial page load
      const timer = setTimeout(() => {
        setVisible(true);
      }, 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  // Listen for global re-open requests (e.g. from Cookie Policy page or Footer)
  useEffect(() => {
    const handleReopen = () => {
      setVisible(true);
      setShowSettings(true);
    };

    window.addEventListener("menuly-open-cookie-banner", handleReopen);
    return () => window.removeEventListener("menuly-open-cookie-banner", handleReopen);
  }, []);

  const saveConsent = (type: CookieConsentType, prefs?: CookiePreferences) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CONSENT_STORAGE_KEY, type);
      if (prefs) {
        localStorage.setItem("menuly_cookie_prefs", JSON.stringify(prefs));
      }
    }
    setVisible(false);
  };

  const handleAcceptAll = () => {
    saveConsent("accepted", { essential: true, functional: true, analytics: true });
    toast.success("Cookie preferences saved. Thank you!", { duration: 3000 });
  };

  const handleRejectAll = () => {
    saveConsent("rejected", { essential: true, functional: false, analytics: false });
    toast.info("Only strictly essential cookies will be utilized.", { duration: 3000 });
  };

  const handleSaveCustom = () => {
    saveConsent("custom", preferences);
    toast.success("Custom cookie preferences saved successfully.", { duration: 3000 });
  };

  const handleClose = () => {
    saveConsent("dismissed");
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      className="fixed bottom-3 inset-x-3 sm:bottom-5 sm:inset-x-auto sm:right-6 sm:max-w-[490px] z-50 animate-in fade-in-0 slide-in-from-bottom-5 duration-300 ease-out"
    >
      <div className="relative overflow-hidden rounded-2xl border-2 border-primary/50 bg-[#071f18]/95 p-5 sm:p-6 text-white shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
        
        {/* Subtle decorative glow */}
        <div className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full bg-primary/20 blur-2xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 size-36 rounded-full bg-accent/20 blur-2xl" />

        {/* Top Close Button (Clean 'X' in top-right) */}
        <button
          type="button"
          onClick={handleClose}
          title="Dismiss cookie banner"
          aria-label="Close cookie banner"
          className="absolute right-3.5 top-3.5 flex size-7 items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>

        {/* Header Title with Cookie Icon */}
        <div className="pr-8 space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/30 text-amber-300 border border-primary/40 shadow-xs">
              <Cookie className="size-4" />
            </span>
            <h3 className="font-display text-xs sm:text-sm font-extrabold tracking-wider text-white uppercase">
              We Use Cookies to Improve Your Experience
            </h3>
          </div>
        </div>

        {/* Body Text with highlighted link to Cookie Policy */}
        <div className="mt-2.5 text-xs text-white/85 leading-relaxed space-y-1">
          <p>
            By continuing, you agree to our{" "}
            <Link
              to="/cookies"
              className="font-bold text-accent underline underline-offset-2 hover:text-accent/90"
            >
              Cookie Policy
            </Link>
            . We use strictly essential cookies for secure login sessions and anonymous menu scan telemetry with zero third-party ad tracking.
          </p>
        </div>

        {/* Collapsible Cookie Settings Details Drawer */}
        {showSettings && (
          <div className="mt-4 pt-3 border-t border-white/15 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">
              Customize Your Storage Preferences:
            </p>

            {/* Category 1: Strictly Necessary */}
            <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-2.5 text-xs">
              <div className="space-y-0.5 pr-2">
                <p className="font-bold text-white flex items-center gap-1.5 text-[11px]">
                  <Lock className="size-3 text-emerald-400" /> Strictly Essential
                </p>
                <p className="text-[10px] text-white/60">Required for authentication, OTP verification, and CSRF defense.</p>
              </div>
              <span className="shrink-0 rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[9px] font-bold text-emerald-300 uppercase">
                Always Active
              </span>
            </div>

            {/* Category 2: Functional */}
            <label className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-2.5 text-xs cursor-pointer hover:bg-white/10 transition-colors">
              <div className="space-y-0.5 pr-2">
                <p className="font-bold text-white flex items-center gap-1.5 text-[11px]">
                  <ShieldCheck className="size-3 text-accent" /> Functional Preferences
                </p>
                <p className="text-[10px] text-white/60">Remembers active menu category tabs, studio drawer state, and filters.</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.functional}
                onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                className="size-4 rounded accent-primary cursor-pointer"
              />
            </label>

            {/* Category 3: Analytics */}
            <label className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-2.5 text-xs cursor-pointer hover:bg-white/10 transition-colors">
              <div className="space-y-0.5 pr-2">
                <p className="font-bold text-white flex items-center gap-1.5 text-[11px]">
                  <Cookie className="size-3 text-amber-300" /> Anonymous Scan Telemetry
                </p>
                <p className="text-[10px] text-white/60">Anonymous QR visit counters for restaurant managers without personal tracking.</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                className="size-4 rounded accent-primary cursor-pointer"
              />
            </label>

            <button
              type="button"
              onClick={handleSaveCustom}
              className="w-full mt-1 h-9 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider hover:bg-primary/90 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-soft"
            >
              <Check className="size-3.5" /> Save Preferences
            </button>
          </div>
        )}

        {/* Action Buttons Row matching User's Design Image */}
        <div className="mt-4 flex flex-wrap items-center gap-2 pt-1">
          {/* Accept Cookies */}
          <button
            type="button"
            onClick={handleAcceptAll}
            className="flex-1 sm:flex-none h-10 px-4 rounded-xl bg-primary text-primary-foreground font-extrabold text-xs uppercase tracking-wider hover:bg-primary/90 shadow-soft cursor-pointer active:scale-95 transition-all text-center border border-primary/50"
          >
            [ Accept Cookies ]
          </button>

          {/* Reject All */}
          <button
            type="button"
            onClick={handleRejectAll}
            className="flex-1 sm:flex-none h-10 px-4 rounded-xl bg-white/10 text-white hover:bg-white/20 font-bold text-xs uppercase tracking-wider cursor-pointer active:scale-95 transition-all text-center border border-white/20"
          >
            [ Reject All ]
          </button>

          {/* Cookie Settings Toggle */}
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="w-full sm:w-auto h-9 px-2 text-white/80 hover:text-white text-xs font-bold uppercase tracking-wider underline underline-offset-4 flex items-center justify-center sm:justify-start gap-1 cursor-pointer transition-colors sm:ml-auto"
          >
            <span>Cookies Settings</span>
            {showSettings ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
        </div>

      </div>
    </div>
  );
}
