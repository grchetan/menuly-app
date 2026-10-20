import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatedQR } from "@/components/AnimatedQR";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Check localStorage token
    const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
    if (token) {
      setIsAuthenticated(true);
      setChecking(false);
      return;
    }

    // 2. Fallback check for cookie
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|;\s*)menuly_token=([^;]*)/);
      if (match && match[1]) {
        const decoded = decodeURIComponent(match[1]);
        if (decoded && decoded !== "undefined" && decoded !== "null") {
          localStorage.setItem("menuly_token", decoded);
          setIsAuthenticated(true);
          setChecking(false);
          return;
        }
      }
    }

    // 3. Not authenticated -> redirect to /auth
    setIsAuthenticated(false);
    setChecking(false);
    navigate({ to: "/auth", replace: true });
  }, [navigate]);

  if (checking) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground pt-16 sm:pt-[70px]">
        {/* Top Navbar Skeleton */}
        <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border/70 bg-background/95 backdrop-blur-md">
          <div className="px-3 sm:px-6 py-3">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-xl bg-muted animate-pulse" />
                <div className="h-5 w-24 rounded-lg bg-muted animate-pulse" />
              </div>
              <div className="hidden md:flex h-9 w-72 rounded-full bg-muted/60 animate-pulse" />
              <div className="h-8 w-24 rounded-full bg-muted animate-pulse" />
            </div>
          </div>
        </header>

        {/* Content Skeleton */}
        <main className="flex-1 px-4 py-8 max-w-6xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="h-8 w-64 rounded-xl bg-muted animate-pulse" />
            <div className="flex gap-2">
              <div className="h-8 w-28 rounded-xl bg-muted animate-pulse" />
              <div className="h-8 w-24 rounded-xl bg-muted animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl border border-border/70 bg-card p-4 space-y-3">
                <div className="flex justify-between">
                  <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                  <div className="size-6 rounded-lg bg-muted animate-pulse" />
                </div>
                <div className="h-7 w-24 rounded-lg bg-muted animate-pulse" />
                <div className="h-3 w-32 rounded bg-muted/60 animate-pulse" />
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="h-64 rounded-2xl border border-border/70 bg-card p-5 space-y-4">
              <div className="h-4 w-48 rounded bg-muted animate-pulse" />
              <div className="h-40 rounded-xl bg-muted/40 animate-pulse flex items-center justify-center">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground animate-pulse">
                  <AnimatedQR className="size-5 !p-0.5" />
                  <span>Verifying your restaurant session...</span>
                </div>
              </div>
            </div>
            <div className="h-64 rounded-2xl border border-border/70 bg-card p-5 space-y-3">
              <div className="h-4 w-36 rounded bg-muted animate-pulse" />
              <div className="h-10 rounded-xl bg-muted/60 animate-pulse" />
              <div className="h-10 rounded-xl bg-muted/60 animate-pulse" />
              <div className="h-10 rounded-xl bg-muted/60 animate-pulse" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <Outlet />;
}
