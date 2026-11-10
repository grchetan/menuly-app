import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CookingPot,
  ExternalLink,
  BarChart3,
  UtensilsCrossed,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { myMenuQuery } from "@/lib/restaurant";
import { LiveOrdersManager } from "@/components/dashboard/LiveOrdersManager";

function OrdersSkeleton() {
  return (
    <AppShell title="Kitchen POS & Live Orders">
      <div className="space-y-6 animate-pulse max-w-7xl mx-auto py-2">
        <div className="h-16 rounded-2xl border border-border/70 bg-card p-4 flex items-center justify-between">
          <div className="h-6 w-56 rounded-lg bg-muted" />
          <div className="h-8 w-32 rounded-lg bg-muted" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl border border-border/70 bg-card p-4 space-y-2">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="h-7 w-16 rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="h-96 rounded-2xl border border-border/70 bg-card p-6" />
      </div>
    </AppShell>
  );
}

export const Route = createFileRoute("/_authenticated/orders")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Live Orders & Kitchen POS — Menuly" },
      { name: "description", content: "Real-time table orders, kitchen ticket management, and order fulfillment." },
      { property: "og:title", content: "Live Orders & Kitchen POS — Menuly" },
    ],
  }),
  pendingComponent: OrdersSkeleton,
  component: OrdersPage,
});

function OrdersPage() {
  const { data, isLoading } = useQuery(myMenuQuery);
  const r = data?.restaurant;

  if (isLoading || !r) {
    return <OrdersSkeleton />;
  }

  return (
    <AppShell
      title="Kitchen POS & Live Orders"
      actions={
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-full text-xs font-bold gap-1.5 border-border/80"
          >
            <Link to="/dashboard">
              <BarChart3 className="size-3.5 text-primary" />
              <span>Order Analytics</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-full text-xs font-bold gap-1.5 border-border/80"
          >
            <a href={`/menu/${r.slug}`} target="_blank" rel="noreferrer">
              <span>Customer Menu</span>
              <ExternalLink className="size-3 text-muted-foreground" />
            </a>
          </Button>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto space-y-6 py-2">
        {/* Quick Header Banner */}
        <div className="rounded-3xl border border-border/70 bg-gradient-to-r from-card via-card to-orange-500/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="font-serif font-black text-lg sm:text-xl text-foreground flex items-center gap-2">
                <CookingPot className="size-5 text-orange-500" />
                Live Kitchen Dispatch &amp; POS
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Direct table-wise orders from QR scans at <strong className="text-foreground">{r.name}</strong>. Auto-refreshes with chime alerts.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              asChild
              size="sm"
              className="rounded-xl font-bold text-xs gap-1 bg-primary text-primary-foreground shadow-xs"
            >
              <Link to="/qr">
                <span>Print Table QRs</span>
                <ArrowRight className="size-3" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Live POS Orders Engine */}
        <LiveOrdersManager
          restaurantId={r.id}
          restaurantSlug={r.slug}
          restaurantName={r.name}
        />
      </div>
    </AppShell>
  );
}
