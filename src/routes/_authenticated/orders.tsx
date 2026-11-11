import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ExternalLink,
  BarChart3,
  Printer,
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
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-full text-xs font-bold gap-1.5 border-border/80 h-8 sm:h-9"
          >
            <Link to="/dashboard">
              <BarChart3 className="size-3.5 text-primary" />
              <span className="hidden sm:inline">Order Analytics</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-full text-xs font-bold gap-1.5 border-border/80 h-8 sm:h-9"
          >
            <a href={`/menu/${r.slug}`} target="_blank" rel="noreferrer">
              <span className="hidden sm:inline">Customer Menu</span>
              <span className="sm:hidden">Menu</span>
              <ExternalLink className="size-3 text-muted-foreground" />
            </a>
          </Button>
          <Button
            asChild
            size="sm"
            className="rounded-full font-bold text-xs gap-1.5 bg-primary text-primary-foreground shadow-xs h-8 sm:h-9"
          >
            <Link to="/qr">
              <Printer className="size-3.5" />
              <span>Print Table QRs</span>
              <ArrowRight className="size-3 hidden sm:inline" />
            </Link>
          </Button>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto space-y-4 py-1 sm:py-2">
        {/* Live POS Orders Engine (Directly visible without duplicate outer banners) */}
        <LiveOrdersManager
          restaurantId={r.id}
          restaurantSlug={r.slug}
          restaurantName={r.name}
        />
      </div>
    </AppShell>
  );
}
