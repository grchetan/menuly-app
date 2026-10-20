import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  UtensilsCrossed,
  QrCode,
  Store,
  HelpCircle,
  LifeBuoy,
  LogOut,
  Eye,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { myMenuQuery, isDemoMode, setDemoMode } from "@/lib/restaurant";
import { APP_NAME } from "@/lib/config";
import { AnimatedQR } from "./AnimatedQR";
import { cn } from "@/lib/utils";

const DASHBOARD_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/my-menu", label: "My Menu" },
  { to: "/qr", label: "QR Studio" },
  { to: "/shop", label: "Shop", soon: true },
  { to: "/how-to-use", label: "How to use" },
  { to: "/support", label: "Support" },
] as const;

const ticker = [
  "Scan the QR",
  "See the menu",
  "Update prices anytime",
  "Mark sold out in 1 tap",
  "100% Pure Veg",
  "Zero reprinting",
  "Made for India",
];

export function AppShell({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const [blob, setBlob] = useState<{ left: number; width: number; show: boolean }>({
    left: 0,
    width: 0,
    show: false,
  });
  const [hot, setHot] = useState<string | null>(null);

  const { data } = useQuery(myMenuQuery);
  const slug = data?.restaurant?.slug;
  const liveMenuUrl = slug ? `/menu/${slug}` : "/menu";

  const isDemo = isDemoMode() && typeof window !== "undefined" && !localStorage.getItem("menuly_token");

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const moveTo = (el: HTMLElement | null) => {
    if (!el || !navRef.current) return setBlob((b) => ({ ...b, show: false }));
    const n = navRef.current.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setBlob({ left: r.left - n.left, width: r.width, show: true });
    setHot(el.getAttribute("href"));
  };

  const resetBlob = () => {
    const activeEl = navRef.current?.querySelector<HTMLElement>("[data-status=active]") ?? null;
    moveTo(activeEl);
  };

  useEffect(() => {
    const t = setTimeout(resetBlob, 50);
    return () => clearTimeout(t);
  }, [pathname]);

  async function signOut() {
    setDemoMode(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("menuly_token");
      localStorage.removeItem("menuly_user");
      localStorage.removeItem("menuly_demo_mode");
      localStorage.removeItem("menuly_demo_menu");
      sessionStorage.removeItem("menuly_admin_auth");
      document.cookie = "menuly_token=; path=/; max-age=0";
    }
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground pt-16 sm:pt-[70px]">
      {/* Top Header — Identical to Home (SiteHeader, Fixed & Frosted) */}
      <header
        className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border/70 bg-background/95 backdrop-blur-md shadow-xs"
        style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}
      >
        <div className="px-3 sm:px-6 py-3">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            {/* Logo */}
            <Link
              to="/"
              className="group flex items-center gap-2 rounded-2xl px-2 py-1.5 transition-all"
            >
              <span className="relative size-9 overflow-hidden rounded-xl transition-transform duration-500 group-hover:scale-110">
                <AnimatedQR className="!rounded-xl !p-1 !shadow-none" />
              </span>
              <span className="font-display text-xl font-semibold">{APP_NAME}</span>
            </Link>

            {/* Pill Navigation (Exact match to Home) */}
            <nav
              ref={navRef}
              onMouseLeave={resetBlob}
              className="relative hidden items-center rounded-full bg-foreground p-1.5 shadow-lift md:flex"
            >
              <span
                aria-hidden
                className="absolute top-1.5 bottom-1.5 rounded-full bg-accent transition-all duration-500 ease-[cubic-bezier(.5,1.6,.4,1)]"
                style={{ left: blob.left, width: blob.width, opacity: blob.show ? 1 : 0 }}
              />
              {DASHBOARD_LINKS.map((l) => {
                const isActive = pathname === l.to || pathname.startsWith(`${l.to}/`);
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    data-status={isActive ? "active" : undefined}
                    onMouseEnter={(e) => moveTo(e.currentTarget)}
                    className={cn(
                      "relative z-10 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors duration-300",
                      (hot === l.to || (isActive && !hot)) && blob.show
                        ? "text-accent-foreground"
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

            {/* Right Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {slug && (
                <a
                  href={liveMenuUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden items-center gap-1.5 text-xs font-bold text-foreground hover:text-primary transition-colors sm:flex px-3 py-2 rounded-full border border-border/80 bg-background/80 hover:bg-secondary"
                >
                  <Eye className="size-3.5 text-primary" />
                  Live menu
                </a>
              )}

              <Link
                to="/qr"
                className="group relative flex items-center gap-1.5 sm:gap-2 overflow-hidden rounded-full border-2 border-foreground bg-background py-1 sm:py-1.5 pl-1 sm:pl-1.5 pr-3 sm:pr-4 text-xs sm:text-sm font-bold shadow-[2px_2px_0_var(--foreground)] sm:shadow-[3px_3px_0_var(--foreground)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              >
                <span className="relative flex size-6 sm:size-7 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground">
                  <QrCode className="size-3.5 sm:size-4" />
                  <span className="bg-scanline animate-scan absolute inset-x-0 h-0.5 opacity-0 group-hover:opacity-100" />
                </span>
                <span>Get QR</span>
              </Link>

              <button
                onClick={signOut}
                title="Sign out"
                className="hidden sm:flex size-9 items-center justify-center rounded-full border border-foreground/20 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <LogOut className="size-4" />
              </button>

              {/* Mobile menu toggle */}
              <button
                aria-label="Menu"
                onClick={() => setOpen(!open)}
                className="flex size-9 sm:size-10 flex-col items-center justify-center gap-1.5 rounded-full bg-foreground md:hidden"
              >
                <span
                  className={cn(
                    "h-0.5 w-4 rounded bg-background transition-all",
                    open && "translate-y-1 rotate-45"
                  )}
                />
                <span
                  className={cn(
                    "h-0.5 w-4 rounded bg-background transition-all",
                    open && "-translate-y-1 -rotate-45"
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown (Identical to SiteHeader) */}
        {open && (
          <nav className="animate-nav-drop mx-3 mt-2 overflow-hidden rounded-3xl bg-foreground p-3 text-background shadow-lift md:hidden">
            {DASHBOARD_LINKS.map((l, i) => (
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
            {slug && (
              <a
                href={liveMenuUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                className="animate-rise flex items-center justify-between border-b border-background/10 px-3 py-4 font-display text-2xl text-accent"
              >
                <span className="flex items-center gap-2">
                  <Eye className="size-5" /> Live menu
                </span>
                <ArrowRight className="size-5 opacity-60" />
              </a>
            )}
            <button
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="flex w-full items-center justify-between px-3 py-4 font-display text-2xl text-destructive hover:opacity-80"
            >
              <span>Sign out</span>
              <LogOut className="size-5" />
            </button>
          </nav>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">
          {/* Page Top Bar if title or actions provided */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>
          <div className="animate-rise">{children}</div>
        </div>
      </main>

      {/* App Footer */}
      <footer className="border-t border-border/80 bg-muted/40 py-6 text-center text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 sm:flex-row md:px-6">
          <p>© {new Date().getFullYear()} {APP_NAME}. 100% Pure Veg digital QR menus for restaurants.</p>
          <div className="flex items-center gap-4">
            <Link to="/how-to-use" className="hover:text-foreground transition-colors">
              How it works
            </Link>
            <Link to="/support" className="hover:text-foreground transition-colors">
              Support
            </Link>
            <Link to="/shop" className="hover:text-foreground transition-colors">
              Shop
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
