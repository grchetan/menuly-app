import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Home, ArrowLeft, RotateCcw, AlertTriangle, Copy, Check, ChevronDown, ChevronUp, Compass } from "lucide-react";
import { toast } from "sonner";

import appCss from "../styles.css?url";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Toaster } from "@/components/ui/sonner";
import { MaintenanceScreen } from "@/components/MaintenanceScreen";
import { AutoUpdateDetector } from "@/components/AutoUpdateDetector";
import { NetworkStatusIndicator } from "@/components/NetworkStatusIndicator";
import { CustomCursor } from "@/components/CustomCursor";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";

function NotFoundComponent() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-between bg-hero px-4 py-8 text-foreground selection:bg-primary/20">
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-10 top-20 size-64 rounded-full bg-accent/15 blur-2xl" />
      </div>

      {/* Top Navbar Brand */}
      <header className="relative z-10 w-full max-w-5xl flex justify-between items-center py-2">
        <Link to="/" className="transition-opacity hover:opacity-85">
          <Logo />
        </Link>
        <Link
          to="/"
          className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
        >
          <Home className="size-3.5" /> Back to home
        </Link>
      </header>

      {/* Main 404 Card */}
      <main className="relative z-10 my-auto w-full max-w-lg animate-rise rounded-3xl border border-border/70 bg-card/90 p-8 text-center shadow-lift backdrop-blur-md sm:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
          <Compass className="size-3.5 animate-spin" style={{ animationDuration: "8s" }} /> 404 &bull; Page Not Found
        </div>

        <h1 className="mt-5 font-display text-5xl font-extrabold tracking-tight text-primary sm:text-6xl">
          404
        </h1>

        <h2 className="mt-2 text-2xl font-bold tracking-tight">
          This dish isn't on the menu
        </h2>

        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          The page you're looking for doesn't exist, has been moved, or the link might be broken. Let's get you back on track.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" asChild className="gap-2 shadow-soft">
            <Link to="/">
              <Home className="size-4" /> Go to Homepage
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                window.history.back();
              } else {
                window.location.href = "/";
              }
            }}
          >
            <ArrowLeft className="size-4" /> Go Back
          </Button>
        </div>

        {/* Quick Links */}
        <div className="mt-8 border-t border-border/60 pt-5 text-xs text-muted-foreground">
          <span>Helpful links: </span>
          <Link to="/how-to-use" className="font-medium text-foreground underline underline-offset-2 hover:text-primary">
            How it works
          </Link>
          <span className="mx-2">&bull;</span>
          <Link to="/contact" className="font-medium text-foreground underline underline-offset-2 hover:text-primary">
            Contact
          </Link>
          <span className="mx-2">&bull;</span>
          <Link to="/auth" className="font-medium text-foreground underline underline-offset-2 hover:text-primary">
            Dashboard login
          </Link>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="relative z-10 text-xs text-muted-foreground text-center pt-4">
        &copy; {new Date().getFullYear()} Menuly. Digital QR menus for restaurants.
      </footer>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error && error.stack ? error.stack : null;

  const copyError = () => {
    const text = `${errorMessage}\n\n${errorStack ?? ""}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Error details copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-between bg-hero px-4 py-8 text-foreground selection:bg-destructive/20">
      {/* Decorative Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-destructive/10 blur-3xl" />
        <div className="absolute left-10 top-20 size-64 rounded-full bg-accent/15 blur-2xl" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 w-full max-w-5xl flex justify-between items-center py-2">
        <Link to="/" className="transition-opacity hover:opacity-85">
          <Logo />
        </Link>
        <Link
          to="/"
          className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
        >
          <Home className="size-3.5" /> Back to home
        </Link>
      </header>

      {/* Main Error Card */}
      <main className="relative z-10 my-auto w-full max-w-lg animate-rise rounded-3xl border border-destructive/20 bg-card/95 p-8 text-center shadow-lift backdrop-blur-md sm:p-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shadow-sm">
          <AlertTriangle className="size-7" />
        </div>

        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Kitchen Hiccup
        </h1>

        <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
          Something went wrong while preparing this page. Don't worry, your data is completely safe.
        </p>

        {/* Action Buttons */}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            className="gap-2 shadow-soft"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            <RotateCcw className="size-4" /> Try Again
          </Button>
          <Button size="lg" variant="outline" asChild className="gap-2">
            <Link to="/">
              <Home className="size-4" /> Return to Home
            </Link>
          </Button>
        </div>

        {/* Technical Details Accordion */}
        <div className="mt-6 rounded-2xl border border-border/70 bg-muted/40 p-3.5 text-left text-xs">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex w-full items-center justify-between font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Technical details</span>
            {showDetails ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>

          {showDetails && (
            <div className="mt-3 space-y-2 border-t border-border/50 pt-2.5 text-muted-foreground">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-semibold text-destructive break-all">
                  {errorMessage}
                </span>
                <button
                  type="button"
                  onClick={copyError}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  {copied ? <Check className="size-3 text-veg" /> : <Copy className="size-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              {errorStack && (
                <pre className="max-h-36 overflow-auto rounded-lg bg-foreground/5 p-2 font-mono text-[10px] leading-tight text-foreground/80">
                  {errorStack}
                </pre>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-xs text-muted-foreground text-center pt-4">
        Need assistance? <Link to="/contact" className="underline underline-offset-2 hover:text-foreground">Contact Support</Link>
      </footer>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Menuly — QR digital menus for restaurants" },
      { name: "description", content: "Create a digital menu and share it with a QR code." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0f5132" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/icons/icon-192.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootInner() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  // Digital restaurant menus (/menu/*), Admin console (/admin*), and API routes are strictly exempt
  const isExempt =
    pathname.startsWith("/menu/") ||
    pathname === "/menu" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/");

  const { data: platformData } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/platform/settings");
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
    staleTime: 6_000,
    refetchInterval: 10_000,
  });

  const isMaintenance = Boolean(platformData?.settings?.maintenanceMode);

  if (isMaintenance && !isExempt) {
    return <MaintenanceScreen settings={platformData?.settings} />;
  }

  return <Outlet />;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch((err) => {
          console.debug("[SW] Registration skipped or failed:", err);
        });
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <CustomCursor />
      <AutoUpdateDetector />
      <NetworkStatusIndicator />
      <RootInner />
      <CookieConsentBanner />
      <Toaster position="bottom-right" closeButton />
    </QueryClientProvider>
  );
}
