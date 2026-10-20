import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Mail, MessageCircle, Menu as MenuIcon, X, ArrowRight, QrCode, LayoutDashboard, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { AnimatedQR } from "./AnimatedQR";
import { APP_NAME, SUPPORT_EMAIL, SUPPORT_WHATSAPP, whatsappLink } from "@/lib/config";
import { isDemoMode } from "@/lib/restaurant";

const publicLinks = [
  { to: "/", label: "Home" },
  { to: "/how-to-use", label: "How to use" },
  { to: "/shop", label: "Shop", soon: true },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

const authenticatedLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/my-menu", label: "My Menu" },
  { to: "/qr", label: "QR Studio" },
  { to: "/profile", label: "My Profile" },
  { to: "/support", label: "Support" },
] as const;

let lastPublicNavPill: { left: number; width: number; show: boolean; to: string } | null = null;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [blob, setBlob] = useState<{ left: number; width: number; show: boolean }>(() => {
    if (lastPublicNavPill) {
      return { left: lastPublicNavPill.left, width: lastPublicNavPill.width, show: lastPublicNavPill.show };
    }
    return { left: 0, width: 0, show: false };
  });
  const [isAnimated, setIsAnimated] = useState(false);
  const [hot, setHot] = useState<string | null>(() => lastPublicNavPill?.to ?? null);

  useEffect(() => {
    setHasSession(typeof window !== "undefined" && Boolean(localStorage.getItem("menuly_token")));
  }, [pathname]);

  const displayedLinks = publicLinks;

  const syncToActive = (enableTransition = false) => {
    if (!navRef.current) return;
    const activeEl = navRef.current.querySelector<HTMLElement>("[data-status=active]");
    if (activeEl) {
      const n = navRef.current.getBoundingClientRect();
      const r = activeEl.getBoundingClientRect();
      const nextLeft = r.left - n.left;
      const nextWidth = r.width;
      const to = activeEl.getAttribute("href") || "";
      lastPublicNavPill = { left: nextLeft, width: nextWidth, show: true, to };
      setBlob({ left: nextLeft, width: nextWidth, show: true });
      setHot(to);
    } else {
      setBlob((b) => ({ ...b, show: false }));
      setHot(null);
    }
    if (enableTransition) {
      setIsAnimated(true);
    }
  };

  useEffect(() => {
    // Snap immediately to active position without glitching/sliding from 0
    syncToActive(false);
    const t = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(t);
  }, [pathname]);

  const moveTo = (el: HTMLElement | null) => {
    if (!el || !navRef.current) return setBlob((b) => ({ ...b, show: false }));
    setIsAnimated(true);
    const n = navRef.current.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const nextLeft = r.left - n.left;
    const nextWidth = r.width;
    const to = el.getAttribute("href") || "";
    lastPublicNavPill = { left: nextLeft, width: nextWidth, show: true, to };
    setBlob({ left: nextLeft, width: nextWidth, show: true });
    setHot(to);
  };

  const resetBlob = () => {
    syncToActive(true);
  };

  const signOut = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("menuly_token");
      localStorage.removeItem("menuly_user");
      localStorage.removeItem("menuly_demo_mode");
      localStorage.removeItem("menuly_demo_menu");
      sessionStorage.removeItem("menuly_admin_auth");
      document.cookie = "menuly_token=; path=/; max-age=0";
    }
    setHasSession(false);
    navigate({ to: "/auth", replace: true });
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border/70 bg-background/95 backdrop-blur-md shadow-xs"
      style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}
    >
      <div className="px-3 sm:px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <Link to="/" className="group flex items-center gap-2 rounded-2xl px-2 py-1.5 transition-all">
            <span className="relative size-9 overflow-hidden rounded-xl transition-transform duration-500 group-hover:scale-110">
              <AnimatedQR className="!rounded-xl !p-1 !shadow-none" />
            </span>
            <span className="font-display text-xl font-semibold">{APP_NAME}</span>
          </Link>

          <nav ref={navRef} onMouseLeave={resetBlob}
            className="relative hidden items-center rounded-full bg-foreground p-1.5 shadow-lift md:flex">
            <span
              aria-hidden
              className={cn(
                "absolute top-1.5 bottom-1.5 rounded-full bg-accent pointer-events-none",
                isAnimated ? "transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]" : "transition-none"
              )}
              style={{ left: blob.left, width: blob.width, opacity: blob.show ? 1 : 0 }}
            />
            {displayedLinks.map((l) => {
              const isActive = pathname === l.to || (l.to !== "/" && pathname.startsWith(`${l.to}/`));
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  onMouseEnter={(e) => moveTo(e.currentTarget)}
                  onClick={(e) => moveTo(e.currentTarget)}
                  data-status={isActive ? "active" : undefined}
                  className={cn(
                    "relative z-10 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors duration-200",
                    hot === l.to && blob.show
                      ? "text-accent-foreground font-extrabold"
                      : isActive
                      ? "text-accent font-extrabold"
                      : "text-background/70 hover:text-background"
                  )}
                >
                  {l.label}
                  {"soon" in l && l.soon && (
                    <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent-foreground">
                      soon
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {hasSession ? (
              <>
                <Link
                  to="/dashboard"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-soft transition-all hover:opacity-90"
                >
                  <LayoutDashboard className="size-3.5" />
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  title="My Profile"
                  className="hidden sm:flex size-9 items-center justify-center rounded-full border border-foreground/20 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <User className="size-4" />
                </Link>
                <Link
                  to="/qr"
                  className="group relative flex items-center gap-1.5 sm:gap-2 overflow-hidden rounded-full border-2 border-foreground bg-background py-1 sm:py-1.5 pl-1 sm:pl-1.5 pr-3 sm:pr-4 text-xs sm:text-sm font-bold shadow-[2px_2px_0_var(--foreground)] sm:shadow-[3px_3px_0_var(--foreground)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                >
                  <span className="relative flex size-6 sm:size-7 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground">
                    <QrCode className="size-3.5 sm:size-4" />
                    <span className="bg-scanline animate-scan absolute inset-x-0 h-0.5 opacity-0 group-hover:opacity-100" />
                  </span>
                  Get QR
                </Link>
                <button
                  onClick={signOut}
                  title="Sign out"
                  className="hidden sm:flex size-9 items-center justify-center rounded-full border border-foreground/20 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                >
                  <LogOut className="size-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/auth" className="hidden text-sm font-bold underline-offset-4 hover:underline sm:block">Log in</Link>
                <Link to="/auth" search={{ mode: "signup" }}
                  className="group relative flex items-center gap-1.5 sm:gap-2 overflow-hidden rounded-full border-2 border-foreground bg-background py-1 sm:py-1.5 pl-1 sm:pl-1.5 pr-3 sm:pr-4 text-xs sm:text-sm font-bold shadow-[2px_2px_0_var(--foreground)] sm:shadow-[3px_3px_0_var(--foreground)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                  <span className="relative flex size-6 sm:size-7 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground">
                    <QrCode className="size-3.5 sm:size-4" />
                    <span className="bg-scanline animate-scan absolute inset-x-0 h-0.5 opacity-0 group-hover:opacity-100" />
                  </span>
                  Start free
                </Link>
              </>
            )}
            <button aria-label="Menu" onClick={() => setOpen(!open)}
              className="flex size-9 sm:size-10 flex-col items-center justify-center gap-1.5 rounded-full bg-foreground md:hidden">
              <span className={cn("h-0.5 w-4 rounded bg-background transition-all", open && "translate-y-1 rotate-45")} />
              <span className={cn("h-0.5 w-4 rounded bg-background transition-all", open && "-translate-y-1 -rotate-45")} />
            </button>
          </div>
        </div>
      </div>

      {open && (
        <nav className="animate-nav-drop mx-3 mt-2 overflow-hidden rounded-3xl bg-foreground p-3 text-background shadow-lift md:hidden">
          {hasSession && (
            <Link
              to="/dashboard"
              onClick={() => setOpen(false)}
              className="animate-rise flex items-center justify-between border-b border-background/10 px-3 py-4 font-display text-2xl text-accent"
            >
              <span className="flex items-center gap-2">
                <LayoutDashboard className="size-5" /> Dashboard
              </span>
              <ArrowRight className="size-5 opacity-60" />
            </Link>
          )}
          {displayedLinks.map((l, i) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              style={{ animationDelay: `${i * 70}ms` }}
              className="animate-rise flex items-center justify-between border-b border-background/10 px-3 py-4 font-display text-2xl last:border-0 data-[status=active]:text-accent"
            >
              <span className="flex items-center gap-2">
                {l.label}
                {"soon" in l && l.soon && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-sans font-bold uppercase tracking-wider text-accent-foreground">
                    soon
                  </span>
                )}
              </span>
              <ArrowRight className="size-5 opacity-60" />
            </Link>
          ))}
          {hasSession ? (
            <button
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="flex w-full items-center justify-between px-3 py-4 font-display text-2xl text-destructive hover:opacity-80"
            >
              <span className="flex items-center gap-2">
                <LogOut className="size-5" /> Sign out
              </span>
              <ArrowRight className="size-5 opacity-60" />
            </button>
          ) : (
            <Link to="/auth" onClick={() => setOpen(false)} className="flex items-center justify-between px-3 py-4 font-display text-2xl text-accent">
              <span>Log in</span>
              <ArrowRight className="size-5 opacity-60" />
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative mt-20 overflow-hidden bg-primary text-primary-foreground">
      <div className="pointer-events-none absolute -right-10 -top-10 size-64 rotate-12 opacity-15 animate-float">
        <AnimatedQR />
      </div>
      <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_auto]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-lg bg-primary-foreground/10 px-3 py-2"><Logo /></span>
          <p className="mt-4 max-w-xs text-sm opacity-80">Digital QR menus for restaurants, cafes and food stalls. Update anytime — no reprinting.</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider opacity-60">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            {publicLinks.map((l) => <li key={l.to}><Link to={l.to} className="opacity-85 hover:opacity-100 hover:underline">{l.label}</Link></li>)}
            <li><Link to="/auth" search={{ mode: "signup" }} className="opacity-85 hover:underline">Create menu</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider opacity-60">Support</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a href={whatsappLink(SUPPORT_WHATSAPP)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 opacity-85 hover:underline"><MessageCircle className="size-4" /> WhatsApp</a></li>
            <li><a href={`mailto:${SUPPORT_EMAIL}`} className="inline-flex items-center gap-2 opacity-85 hover:underline"><Mail className="size-4" /> {SUPPORT_EMAIL}</a></li>
          </ul>
        </div>
        <div className="w-28 animate-float"><AnimatedQR /></div>
      </div>
      <div className="relative border-t border-primary-foreground/15 py-5 text-center text-xs opacity-70 flex items-center justify-center gap-2">
        <span>© {new Date().getFullYear()} {APP_NAME}. Digital QR menus crafted for restaurants, cafes & food businesses.</span>
        <Link to="/admin" title="Staff Access" className="opacity-25 hover:opacity-100 transition-opacity ml-1 text-[11px]">
          🔒
        </Link>
      </div>
    </footer>
  );
}

export function SitePage({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-hero pt-16 sm:pt-[70px]">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
