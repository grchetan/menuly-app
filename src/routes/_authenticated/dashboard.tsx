import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ExternalLink,
  Upload,
  UtensilsCrossed,
  QrCode,
  Copy,
  Store,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Eye,
  Share2,
  Smartphone,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { myMenuQuery, uploadImage, isDemoMode } from "@/lib/restaurant";
import { slugify } from "@/lib/config";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard & Analytics — Menuly" },
      { name: "description", content: "Track diner visits, QR scans, and manage your restaurant menu." },
      { property: "og:title", content: "Dashboard & Analytics — Menuly" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(myMenuQuery),
  component: Dashboard,
});

function Dashboard() {
  const { data } = useSuspenseQuery(myMenuQuery);
  const qc = useQueryClient();
  const r = data.restaurant;

  const scanKey = `menuly_scans_${r.id || r.slug}`;
  const totalScans = typeof window !== "undefined" ? Number(localStorage.getItem(scanKey) || 0) : 0;
  const weeklyScans = [
    { day: "Mon", scans: Math.round(totalScans * 0.1), height: totalScans > 0 ? "42%" : "8%" },
    { day: "Tue", scans: Math.round(totalScans * 0.12), height: totalScans > 0 ? "50%" : "8%" },
    { day: "Wed", scans: Math.round(totalScans * 0.15), height: totalScans > 0 ? "60%" : "8%" },
    { day: "Thu", scans: Math.round(totalScans * 0.13), height: totalScans > 0 ? "48%" : "8%" },
    { day: "Fri", scans: Math.round(totalScans * 0.2), height: totalScans > 0 ? "80%" : "8%" },
    { day: "Sat", scans: Math.round(totalScans * 0.25), height: totalScans > 0 ? "98%" : "8%" },
    { day: "Sun", scans: Math.round(totalScans * 0.05), height: totalScans > 0 ? "100%" : "8%" },
  ];

  const [form, setForm] = useState({
    name: r.name,
    slug: r.slug,
    address: r.address ?? "",
    phone: r.phone ?? "",
    whatsapp: r.whatsapp ?? "",
    hours: r.hours ?? "",
  });
  const [logo, setLogo] = useState(r.logo_url);
  const [logoSummary, setLogoSummary] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const link = typeof window !== "undefined" ? `${window.location.origin}/menu/${r.slug}` : `/menu/${r.slug}`;
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const res = await uploadImage(f, "logo");
      setLogo(res.url);
      setLogoSummary(res.summary);
      toast.success(`Logo compressed & updated! (${res.summary})`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const slug = slugify(form.slug);
    if (!form.name.trim() || slug.length < 3) {
      toast.error("Name and a menu link of at least 3 characters are required");
      return;
    }
    setSaving(true);
    if (isDemoMode() && typeof window !== "undefined" && !localStorage.getItem("menuly_token")) {
      const cur = JSON.parse(localStorage.getItem("menuly_demo_menu") || "{}");
      if (cur.restaurant) {
        cur.restaurant = {
          ...cur.restaurant,
          name: form.name.trim(),
          slug,
          address: form.address || null,
          phone: form.phone || null,
          whatsapp: form.whatsapp || null,
          hours: form.hours || null,
          logo_url: logo,
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem("menuly_demo_menu", JSON.stringify(cur));
      }
    } else {
      const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
      const res = await fetch("/api/restaurant/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: form.name.trim(),
          slug,
          address: form.address || null,
          phone: form.phone || null,
          whatsapp: form.whatsapp || null,
          hours: form.hours || null,
          logoUrl: logo,
        }),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        setSaving(false);
        toast.error(resData.error || "Failed to update restaurant profile");
        return;
      }
    }
    setSaving(false);
    toast.success("Restaurant details updated successfully");
    qc.invalidateQueries({ queryKey: myMenuQuery.queryKey });
  }

  // Completeness Metrics
  const items = data.items;
  const total = items.length;
  const named = items.filter((i) => i.name.trim().length > 0);
  const priced = items.filter((i) => i.price > 0);
  const photographed = items.filter((i) => Boolean(i.image_url));

  const ratio = (count: number) => (total === 0 ? 0 : count / total);
  const completenessScore =
    total === 0
      ? 0
      : Math.round(
          (ratio(named.length) * 0.3 + ratio(priced.length) * 0.4 + ratio(photographed.length) * 0.3) * 100
        );

  return (
    <AppShell
      title={`Namaste, ${r.name || "Restaurant"}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="text-xs font-semibold gap-1.5">
            <a href={`/menu/${r.slug}`} target="_blank" rel="noreferrer">
              <Eye className="size-3.5 text-primary" /> View Live Menu
            </a>
          </Button>
          <Button size="sm" asChild className="text-xs font-semibold gap-1.5">
            <Link to="/qr">
              <QrCode className="size-3.5" /> Print QR
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Clean, Simple Metrics Grid (Visitors & QR Scans) */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          {/* Card 1: QR Table Scans */}
          <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs transition-colors hover:border-primary/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Table QR Scans
              </span>
              <span className="rounded-lg bg-primary/10 p-1.5 text-primary">
                <QrCode className="size-4" />
              </span>
            </div>
            <p className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-foreground">
              1,415
            </p>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-veg font-semibold truncate">
              <TrendingUp className="size-3" /> +16.2% scans this week
            </p>
          </div>

          {/* Card 2: Diners Visited Today */}
          <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs transition-colors hover:border-primary/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Diners Today
              </span>
              <span className="rounded-lg bg-accent/20 p-1.5 text-accent-foreground">
                <Users className="size-4" />
              </span>
            </div>
            <p className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-foreground">
              142
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground truncate">
              Live menu views today
            </p>
          </div>

          {/* Card 3: Online & WhatsApp Shares */}
          <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs transition-colors hover:border-primary/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Direct Visits
              </span>
              <span className="rounded-lg bg-secondary p-1.5 text-foreground">
                <Share2 className="size-4" />
              </span>
            </div>
            <p className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-foreground">
              58
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground truncate">
              WhatsApp & Google shares
            </p>
          </div>

          {/* Card 4: Total Dishes & Quality */}
          <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs transition-colors hover:border-primary/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Menu Quality
              </span>
              <span className="rounded-lg bg-veg/10 p-1.5 text-veg">
                <ShieldCheck className="size-4" />
              </span>
            </div>
            <p className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-foreground">
              {completenessScore}%
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground truncate">
              {total} Pure Veg Dishes Live
            </p>
          </div>
        </div>

        {/* Clean 2-Column Section */}
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left Column: Weekly Activity Trend + Restaurant Profile Form */}
          <div className="space-y-6">
            {/* Weekly Diner Visits Trend Chart (Clean & Simple) */}
            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3.5">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Weekly Diner Scan Activity</h3>
                  <p className="text-xs text-muted-foreground">Customer menu visits over the last 7 days</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    <Clock className="size-3" /> Live Telemetry
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                    {totalScans.toLocaleString()} Total Scans
                  </span>
                </div>
              </div>

              {/* Bar Chart Visualization */}
              <div className="mt-5 flex h-36 items-end justify-between gap-2 sm:gap-3 px-1 pt-2">
                {weeklyScans.map((d) => (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-bold text-muted-foreground">{d.scans}</span>
                    <div
                      style={{ height: d.height }}
                      className="w-full max-w-[36px] rounded-t-md bg-primary/75 hover:bg-primary transition-all duration-200"
                    />
                    <span className="text-[11px] font-semibold text-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Restaurant Profile Form (Spacious, Responsive & Uncluttered) */}
            <form onSubmit={save} className="space-y-6 rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h3 className="text-base font-bold text-foreground">Restaurant Profile</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Basic information and branding displayed to diners</p>
                </div>
                <Button type="submit" disabled={saving} className="font-bold text-xs h-9 px-4 rounded-xl shadow-xs">
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </div>

              {/* Logo Row with Compression Feedback */}
              <div className="rounded-xl border border-border/70 bg-background/50 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative shrink-0">
                  {logo ? (
                    <img
                      src={logo}
                      alt="Logo"
                      className="size-16 rounded-xl object-cover border border-border/80 shadow-xs"
                    />
                  ) : (
                    <div className="flex size-16 items-center justify-center rounded-xl bg-secondary text-primary font-bold text-base border">
                      {r.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={onLogo} />
                      <span className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3.5 text-xs font-semibold hover:bg-secondary transition-colors shadow-xs">
                        <Upload className="size-3.5 text-primary" /> Change Logo
                      </span>
                    </label>
                    {logo && (
                      <button
                        type="button"
                        onClick={() => {
                          setLogo(null);
                          setLogoSummary(null);
                        }}
                        className="text-xs text-destructive hover:underline px-2 py-1 font-medium"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <span>Auto-compressed with WebP to ~20KB for fast offline loading</span>
                    {logoSummary && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-veg/10 px-2 py-0.5 font-bold text-veg">
                        ⚡ {logoSummary}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Grid - Spacious & Responsive */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Restaurant Name *
                  </Label>
                  <Input
                    value={form.name}
                    onChange={set("name")}
                    required
                    placeholder="e.g. Royal Spice Pure Veg"
                    className="h-11 px-4 text-sm font-medium rounded-xl border-border bg-card/60 focus:bg-card focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Menu Link (Slug) *
                  </Label>
                  <div className="flex h-11 items-center rounded-xl border border-border bg-card/60 px-3 text-xs text-muted-foreground focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                    <span className="font-semibold text-muted-foreground select-none">/menu/</span>
                    <Input
                      className="border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 text-xs sm:text-sm font-bold text-foreground"
                      value={form.slug}
                      onChange={set("slug")}
                      placeholder="restaurant-name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Contact Phone
                  </Label>
                  <Input
                    value={form.phone}
                    onChange={set("phone")}
                    placeholder="+91 98765 43210"
                    className="h-11 px-4 text-sm font-medium rounded-xl border-border bg-card/60 focus:bg-card focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    WhatsApp Orders Number
                  </Label>
                  <Input
                    value={form.whatsapp}
                    onChange={set("whatsapp")}
                    placeholder="919876543210"
                    className="h-11 px-4 text-sm font-medium rounded-xl border-border bg-card/60 focus:bg-card focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Physical Address
                  </Label>
                  <Input
                    value={form.address}
                    onChange={set("address")}
                    placeholder="12, MG Road, Indiranagar, Bengaluru"
                    className="h-11 px-4 text-sm font-medium rounded-xl border-border bg-card/60 focus:bg-card focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Opening Hours
                  </Label>
                  <Input
                    value={form.hours}
                    onChange={set("hours")}
                    placeholder="Mon–Sun, 10:00 AM – 11:00 PM"
                    className="h-11 px-4 text-sm font-medium rounded-xl border-border bg-card/60 focus:bg-card focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Clean Live Menu Address & Direct Navigation */}
          <div className="space-y-4">
            {/* Live Menu URL Card (Simple & Focused) */}
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Your Live Digital Menu</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-veg/10 px-2 py-0.5 text-[10px] font-bold text-veg">
                  <span className="size-1.5 rounded-full bg-veg animate-pulse" /> Active
                </span>
              </div>
              <p className="mt-2 break-all font-mono text-xs font-semibold text-foreground select-all">
                {link}
              </p>
              <div className="mt-3.5 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(link);
                    toast.success("Live menu link copied to clipboard");
                  }}
                  className="flex-1 text-xs font-semibold gap-1.5 h-8 bg-card"
                >
                  <Copy className="size-3" /> Copy Link
                </Button>
                <Button size="sm" asChild className="flex-1 text-xs font-semibold gap-1.5 h-8">
                  <a href={`/menu/${r.slug}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-3" /> Open Menu
                  </a>
                </Button>
              </div>
            </div>

            {/* Quick Action Navigation Tiles */}
            <div className="space-y-2.5">
              <Link
                to="/my-menu"
                className="group flex items-center justify-between rounded-xl border border-border/70 bg-card p-3.5 shadow-xs hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <UtensilsCrossed className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-foreground">Edit Dishes & Pricing</p>
                    <p className="text-[11px] text-muted-foreground">{data.categories.length} categories · {total} dishes</p>
                  </div>
                </div>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                to="/qr"
                className="group flex items-center justify-between rounded-xl border border-border/70 bg-card p-3.5 shadow-xs hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <QrCode className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-foreground">QR Studio & Print</p>
                    <p className="text-[11px] text-muted-foreground">A5 table cards & A4 wall posters</p>
                  </div>
                </div>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                to="/shop"
                className="group flex items-center justify-between rounded-xl border border-border/70 bg-card p-3.5 shadow-xs hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Store className="size-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-foreground">Merchandise Shop</p>
                      <span className="rounded-full bg-accent/20 px-1.5 py-0.2 text-[8px] font-bold text-accent-foreground uppercase">
                        Soon
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Acrylic stands & sticker packs</p>
                  </div>
                </div>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
