import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { QrCode, Smartphone, RefreshCw, ArrowRight, Sparkles, MessageCircle, Palette, Check, Star, ScanLine, Utensils, Zap, Store, Compass, Users, MapPin, Eye, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SitePage, usePlatformSettings } from "@/components/SiteLayout";
import { HowSteps } from "@/components/HowSteps";
import { AnimatedQR } from "@/components/AnimatedQR";
import { getOptimizedBannerUrl, getDefaultBanner } from "@/lib/banner-presets";
import hero from "@/assets/hero.png";

const DEFAULT_DEMO_URL = "https://www.menulyindia.online/menu/menuly-official";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Menuly — Digital QR menus for restaurants & cafes" },
      { name: "description", content: "Create a beautiful digital menu, share it with a QR code and update it anytime from your phone." },
      { property: "og:title", content: "Menuly — Digital QR menus for restaurants & cafes" },
      { property: "og:description", content: "No more reprinting menus. Update items and prices anytime." },
    ],
  }),
  component: Index,
});

const features = [
  { icon: Smartphone, title: "Made for phones", text: "Opens instantly after a scan — no app download for customers." },
  { icon: RefreshCw, title: "Update anytime", text: "Change prices, add dishes or mark items sold out in seconds." },
  { icon: QrCode, title: "Branded QR code", text: "Your logo in the centre, your colours. PNG, SVG and print-ready." },
  { icon: Sparkles, title: "Instant QR Menus", text: "Crisp, interactive digital menu so guests browse dishes with ease." },
  { icon: MessageCircle, title: "WhatsApp & Call", text: "Customers reach you with one tap right from the menu." },
  { icon: Palette, title: "Beautiful by default", text: "Photos, categories and a sticky menu bar that looks premium." },
];

// Sample dishes shown inside the phone mockup illustration (100% Pure Veg)
const demoItems = [
  { name: "Paneer Butter Masala", price: "₹220", veg: true },
  { name: "Dal Makhani", price: "₹180", veg: true },
  { name: "Hyderabadi Veg Biryani", price: "₹240", veg: true },
  { name: "Masala Chai", price: "₹30", veg: true },
];

/** Phone-shaped mockup that previews the digital menu UI */
function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[210px] sm:w-[230px]">
      {/* Phone shell */}
      <div
        className="relative rounded-[2.8rem] border-[6px] border-foreground/80 bg-background shadow-lift overflow-hidden"
        style={{ height: "460px" }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-foreground/80 rounded-b-2xl z-10" />

        {/* Header bar */}
        <div className="pt-6 px-3 pb-2 bg-primary text-primary-foreground">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-full bg-primary-foreground/20 flex items-center justify-center text-[10px]">
              🍽
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black leading-none truncate max-w-[140px]">Menuly HQ (Official Demo)</p>
              <p className="text-[8px] opacity-70 leading-none mt-0.5">Open · 10 AM – 11 PM</p>
            </div>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-1.5 px-3 py-2 bg-card border-b border-border overflow-x-auto">
          {["All", "Mains", "Drinks", "Desserts"].map((c, i) => (
            <span
              key={c}
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[8px] font-bold ${
                i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              {c}
            </span>
          ))}
        </div>

        {/* Dish list */}
        <div className="px-3 py-2 space-y-2" style={{ maxHeight: "300px", overflowY: "auto" }}>
          {demoItems.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-2 shadow-xs"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={`size-2.5 shrink-0 rounded-sm border-2 ${
                    item.veg ? "border-emerald-600" : "border-red-500"
                  }`}
                />
                <p className="text-[9px] font-semibold text-foreground truncate">{item.name}</p>
              </div>
              <span className="text-[9px] font-black text-primary shrink-0 ml-1">{item.price}</span>
            </div>
          ))}
        </div>

        {/* WhatsApp CTA bar */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-card px-3 py-2">
          <div className="flex items-center justify-center gap-1 rounded-lg bg-green-600 py-1.5">
            <MessageCircle className="size-3 text-white" />
            <span className="text-[8px] font-black text-white">Order on WhatsApp</span>
          </div>
        </div>
      </div>

      {/* Live badge */}
      <div className="absolute -bottom-3 -right-4 rounded-2xl bg-primary text-primary-foreground px-2.5 py-1.5 shadow-lift text-[10px] font-black flex items-center gap-1 animate-float">
        <ScanLine className="size-3" /> Live Menu
      </div>
    </div>
  );
}

function Index() {
  const { data: platformData } = usePlatformSettings();
  const demoMenuUrl = platformData?.settings?.demoMenuUrl?.trim() || DEFAULT_DEMO_URL;
  const demoQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&color=1a5c38&bgcolor=ffffff&data=${encodeURIComponent(demoMenuUrl)}&margin=2`;

  const { data: communityData } = useQuery<{ restaurants: any[] }>({
    queryKey: ["community-restaurants-home"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/community/restaurants?sort=popular");
        if (!res.ok) return { restaurants: [] };
        return res.json();
      } catch {
        return { restaurants: [] };
      }
    },
    staleTime: 60_000,
    gcTime: 300_000,
  });

  const featuredCommunity = (communityData?.restaurants || []).slice(0, 3);

  return (
    <SitePage>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-8 md:grid-cols-2 md:pt-14">
        <div className="animate-rise">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-foreground">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" /> For restaurants, cafes &amp; food stalls
          </span>
          <h1 className="mt-5 text-5xl font-semibold leading-[1.05] md:text-6xl">
            Your menu, one <em className="text-primary">scan</em> away.
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            Build a modern digital menu in minutes, share it with a QR code, and never reprint a menu again.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild className="shadow-lift font-bold">
              <Link to="/auth" search={{ mode: "signup" }}>
                Create your free menu <ArrowRight className="size-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href={demoMenuUrl} target="_blank" rel="noreferrer">
                <Utensils className="size-4" /> See live demo
              </a>
            </Button>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {["Free to start", "No app needed", "Setup in 5 minutes"].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-primary" />{t}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative justify-self-center">
          <img
            src={hero}
            alt="Customer viewing a digital menu on a phone"
            width={1024}
            height={1152}
            className="w-full max-w-md rounded-3xl object-cover shadow-lift"
          />
          <div className="absolute -bottom-6 -left-6 w-32 animate-float sm:w-36">
            <AnimatedQR />
          </div>
          <div
            className="absolute -right-3 top-8 animate-float rounded-2xl border bg-card px-4 py-3 shadow-lift"
            style={{ animationDelay: "1.2s" }}
          >
            <p className="text-xs text-muted-foreground">Menu updated</p>
            <p className="text-sm font-bold text-primary">Paneer Tikka · ₹220</p>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────────────── */}
      <section className="border-y bg-card/60">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-8 text-center md:grid-cols-4">
          {[
            ["5 min", "to go live"],
            ["₹0", "printing cost to update"],
            ["1 tap", "WhatsApp or call"],
            ["100%", "mobile friendly"],
          ].map(([a, b]) => (
            <div key={b}>
              <p className="font-display text-3xl font-semibold text-primary">{a}</p>
              <p className="text-sm text-muted-foreground">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── LIVE DEMO QR SECTION ───────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5 p-8 sm:p-12 shadow-soft">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            {/* Left: text + QR code */}
            <div className="space-y-6">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  <ScanLine className="size-3.5" /> Live Demo — Scan &amp; see it yourself
                </span>
                <h2 className="mt-4 text-3xl sm:text-4xl font-semibold leading-tight">
                  See exactly what your <em className="text-primary">customers</em> will see
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Point your phone camera at this QR code — it opens a real Menuly digital menu instantly. No app, no login needed for customers.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* QR code */}
                <div className="relative shrink-0">
                  <div className="rounded-2xl border-2 border-primary/25 bg-white p-3.5 shadow-lift">
                    <img
                      src={demoQrUrl}
                      alt="Scan this QR to open a live demo menu"
                      width={180}
                      height={180}
                      className="rounded-xl block"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-1 text-[10px] font-black text-primary-foreground shadow-soft">
                    📱 Scan with your phone
                  </div>
                </div>

                {/* Benefits + CTA buttons */}
                <div className="space-y-3 text-sm text-center sm:text-left">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Zap className="size-4" />
                    </span>
                    <span className="text-muted-foreground">Opens in <strong className="text-foreground">under 1 second</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Smartphone className="size-4" />
                    </span>
                    <span className="text-muted-foreground">Works on <strong className="text-foreground">any phone camera</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Utensils className="size-4" />
                    </span>
                    <span className="text-muted-foreground">Real categories &amp; <strong className="text-foreground">live dish prices</strong></span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button asChild className="gap-2 font-bold">
                      <Link to="/auth" search={{ mode: "signup" }}>
                        Create yours free <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href={demoMenuUrl} target="_blank" rel="noreferrer">
                        Open demo
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: phone mockup */}
            <div className="flex justify-center">
              <PhoneMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <h2 className="text-center text-4xl font-semibold">Everything your menu needs</h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
          Simple enough for a chai stall, polished enough for a fine-dine restaurant.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-secondary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-semibold">Go live in 3 steps</h2>
            <p className="mt-2 text-muted-foreground">Sign up, add dishes, print your QR. That's it.</p>
          </div>
          <Button variant="link" asChild>
            <Link to="/how-to-use">Full setup guide <ArrowRight /></Link>
          </Button>
        </div>
        <div className="mt-8"><HowSteps limit={3} /></div>
      </section>

      {/* ── RESTAURANT COMMUNITY SHOWCASE ───────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-6 sm:p-10 shadow-soft space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-xl space-y-2 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <Compass className="size-3.5" /> Menuly Verified Community
              </span>
              <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight">
                Discover Restaurants with Live Digital Menus
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                Explore cafes, rooftops, pure veg diners, and food shops powered by Menuly. Browse live menus, check real-time dish counts, scan table QRs, and visit dedicated storefronts.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1 text-xs font-semibold text-foreground">
                <div className="flex items-center gap-1.5">
                  <Store className="size-4 text-primary" />
                  <span>Verified Storefronts</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <QrCode className="size-4 text-emerald-500" />
                  <span>Instant QR Scans</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="size-4 text-amber-500" />
                  <span>Real-time Visits</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col items-center gap-2.5 shrink-0">
              <Button size="default" asChild className="gap-2 font-bold shadow-soft">
                <Link to="/restaurants">
                  <Store className="size-4" /> Explore Community Directory <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/auth" search={{ mode: "signup" }}>
                  Add Your Restaurant Free
                </Link>
              </Button>
            </div>
          </div>

          {/* Featured Community Restaurant Profile Cards Grid with Banners */}
          {featuredCommunity.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              {featuredCommunity.map((r: any) => {
                return (
                  <article
                    key={r.id}
                    className="group relative flex flex-col justify-between rounded-3xl border border-border/70 bg-card overflow-hidden shadow-xs hover:shadow-soft hover:border-primary/40 hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Top Media Banner */}
                    <div className="relative h-40 w-full bg-muted overflow-hidden select-none">
                      <img
                        src={getOptimizedBannerUrl(r.coverUrl, r.id || r.slug, 700)}
                        alt={`${r.name} banner`}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const fallback = getDefaultBanner(r.slug);
                          if (target.src !== fallback) target.src = fallback;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                      {/* Floating Open/Live Status Badge */}
                      <div className="absolute top-2.5 left-2.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/75 backdrop-blur-xl border border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.35)] text-white select-none">
                          <span className="relative flex size-1.5 items-center justify-center">
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex size-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
                          </span>
                          <span className="font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">
                            Live
                          </span>
                          <span className="text-white/30 text-xs">·</span>
                          <span className="font-semibold text-white/95">Open</span>
                        </div>
                      </div>

                      {/* Brand Logo & Name */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end gap-2.5">
                        <div className="size-12 shrink-0 rounded-xl border-2 border-background/90 bg-card overflow-hidden shadow-md flex items-center justify-center">
                          {r.logoUrl ? (
                            <img src={r.logoUrl} alt={r.name} className="size-full object-cover" />
                          ) : (
                            <div className="size-full bg-primary/10 flex items-center justify-center font-display font-black text-base text-primary">
                              {r.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 pb-0.5">
                          <h3 className="font-display text-sm font-black text-white truncate drop-shadow-md flex items-center gap-1">
                            {r.name}
                            <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0 inline" />
                          </h3>
                          <p className="text-[10px] text-white/80 flex items-center gap-1 truncate drop-shadow-xs">
                            <MapPin className="size-2.5 text-amber-400 shrink-0" />
                            <span>{r.address || r.city || "India"}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {r.description || `Explore digital contactless menu at ${r.name}. Powered by Menuly.`}
                      </p>

                      {/* Metrics */}
                      <div className="grid grid-cols-3 gap-1.5 py-2 px-2.5 rounded-xl bg-muted/40 border border-border/60 text-center select-none text-[10px]">
                        <div>
                          <p className="font-bold text-muted-foreground flex items-center justify-center gap-0.5">
                            <Eye className="size-2.5 text-primary" /> Views
                          </p>
                          <p className="font-black text-foreground">{r.menuViews.toLocaleString()}</p>
                        </div>
                        <div className="border-x border-border/60">
                          <p className="font-bold text-muted-foreground flex items-center justify-center gap-0.5">
                            <Users className="size-2.5 text-emerald-500" /> Visits
                          </p>
                          <p className="font-black text-foreground">{r.profileVisits.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="font-bold text-muted-foreground flex items-center justify-center gap-0.5">
                            <Utensils className="size-2.5 text-amber-500" /> Dishes
                          </p>
                          <p className="font-black text-foreground">{r.dishCount}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={`/menu/${r.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-600 hover:via-orange-600 hover:to-rose-700 text-white text-[11px] font-bold shadow-xs border border-amber-300/30 transition-all cursor-pointer"
                        >
                          <QrCode className="size-3" />
                          <span>Live Menu</span>
                          <ExternalLink className="size-2.5 opacity-80" />
                        </a>
                        <Link
                          to={`/restaurants/${r.slug}` as any}
                          className="flex-1 inline-flex items-center justify-center gap-1 h-9 rounded-xl bg-card hover:bg-muted text-foreground border border-border/80 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          <span>Storefront</span>
                          <ArrowRight className="size-2.5 text-muted-foreground" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── TESTIMONIAL ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <figure className="mx-auto max-w-2xl text-center">
          <div className="flex justify-center gap-1 text-accent">
            {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="size-5 fill-current" />)}
          </div>
          <blockquote className="mt-4 font-display text-2xl leading-snug">
            "We change our specials every day. Now it takes one minute on the phone instead of reprinting menus every month."
          </blockquote>
          <figcaption className="mt-4 text-sm text-muted-foreground">
            — Rohan Verma, Owner of The Roasted Bean Cafe
          </figcaption>
        </figure>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-primary p-10 text-primary-foreground shadow-lift md:p-14">
          <div className="absolute -right-8 -top-8 w-48 rotate-12 opacity-20"><AnimatedQR /></div>
          <h2 className="relative max-w-lg text-4xl font-semibold">Ready to ditch the printed menu?</h2>
          <p className="relative mt-3 max-w-md opacity-85">
            Create your digital menu and QR code today — it's free to start. No credit card needed.
          </p>
          <div className="relative mt-7 flex flex-wrap gap-3">
            <Button size="lg" variant="accent" asChild>
              <Link to="/auth" search={{ mode: "signup" }}>
                Get started free <ArrowRight />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <a href={demoMenuUrl} target="_blank" rel="noreferrer">
                <ScanLine className="size-4" /> Try live demo
              </a>
            </Button>
          </div>
        </div>
      </section>
    </SitePage>
  );
}
