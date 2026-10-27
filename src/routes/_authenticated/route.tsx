import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatedQR } from "@/components/AnimatedQR";
import { AlertOctagon, ShieldAlert, Mail, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

function AuthenticatedSkeleton() {
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

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  pendingComponent: AuthenticatedSkeleton,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const [accountStatus, setAccountStatus] = useState<"CHECKING" | "ACTIVE" | "DELETED" | "BANNED" | "UNAUTHENTICATED">(() => {
    if (typeof window === "undefined") return "CHECKING";
    return localStorage.getItem("menuly_token") ? "CHECKING" : "UNAUTHENTICATED";
  });
  const [banReason, setBanReason] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
    if (!token) {
      // Check cookie fallback
      if (typeof document !== "undefined") {
        const match = document.cookie.match(/(?:^|;\s*)menuly_token=([^;]*)/);
        if (match && match[1]) {
          const decoded = decodeURIComponent(match[1]);
          if (decoded && decoded !== "undefined" && decoded !== "null") {
            localStorage.setItem("menuly_token", decoded);
            verifyToken(decoded);
            return;
          }
        }
      }
      setAccountStatus("UNAUTHENTICATED");
      navigate({ to: "/auth", replace: true });
      return;
    }

    verifyToken(token);

    function verifyToken(tok: string) {
      fetch("/api/user/status", {
        headers: { Authorization: `Bearer ${tok}` },
      })
        .then(async (res) => {
          if (res.status === 403) {
            const data = await res.json().catch(() => ({}));
            if (data.code === "ACCOUNT_DELETED" || data.isDeleted) {
              localStorage.removeItem("menuly_token");
              localStorage.removeItem("menuly_user");
              setAccountStatus("DELETED");
              return;
            }
            if (data.code === "ACCOUNT_BANNED" || data.isBanned) {
              setBanReason(data.banReason || data.error || "Your account has been suspended by Menuly Administration.");
              setAccountStatus("BANNED");
              return;
            }
          }
          if (res.status === 401) {
            localStorage.removeItem("menuly_token");
            localStorage.removeItem("menuly_user");
            setAccountStatus("UNAUTHENTICATED");
            navigate({ to: "/auth", replace: true });
            return;
          }
          if (res.ok) {
            const data = await res.json().catch(() => ({}));
            if (data.user) {
              localStorage.setItem("menuly_user", JSON.stringify(data.user));
            }
            setAccountStatus("ACTIVE");
            return;
          }
          // Network resilience
          setAccountStatus("ACTIVE");
        })
        .catch(() => {
          setAccountStatus("ACTIVE");
        });
    }
  }, [navigate]);

  if (accountStatus === "CHECKING") {
    return <AuthenticatedSkeleton />;
  }

  if (accountStatus === "DELETED") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 text-center">
        <div className="mx-auto max-w-md w-full space-y-6 rounded-3xl border border-destructive/25 bg-card p-7 sm:p-9 shadow-lift">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 shadow-soft">
            <AlertOctagon className="size-8" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive">
              Menuly Official Notice
            </div>
            <h1 className="text-2xl font-bold font-display text-foreground tracking-tight">
              Your Account Has Been Deleted
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Menuly Official: Your restaurant account has been deleted by administration. If you believe this is an error or wish to request restoration, please contact Menuly Support.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="destructive" className="gap-2 rounded-xl">
              <a href="mailto:menulyofficial@gmail.com">
                <Mail className="size-4" />
                Contact Menuly Support
              </a>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                localStorage.clear();
                window.location.href = "/auth";
              }}
              className="gap-2 rounded-xl"
            >
              <LogOut className="size-4" />
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (accountStatus === "BANNED") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 text-center">
        <div className="mx-auto max-w-md w-full space-y-6 rounded-3xl border border-amber-500/25 bg-card p-7 sm:p-9 shadow-lift">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-soft">
            <ShieldAlert className="size-8" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
              Account Suspended
            </div>
            <h1 className="text-2xl font-bold font-display text-foreground tracking-tight">
              Account Suspended
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your Menuly account has been suspended by Administration. You are restricted from accessing dashboard operations.
            </p>
            {banReason && (
              <div className="rounded-xl border border-amber-500/30 bg-muted/40 p-3 text-xs text-foreground/90 font-mono text-left">
                <span className="font-semibold block text-amber-600 dark:text-amber-400 mb-0.5">Reason:</span>
                {banReason}
              </div>
            )}
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white">
              <a href="mailto:menulyofficial@gmail.com">
                <Mail className="size-4" />
                Appeal Suspension
              </a>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                localStorage.clear();
                window.location.href = "/auth";
              }}
              className="gap-2 rounded-xl"
            >
              <LogOut className="size-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (accountStatus === "UNAUTHENTICATED") return null;

  return <Outlet />;
}
