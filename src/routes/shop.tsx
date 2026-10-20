import { createFileRoute, Link } from "@tanstack/react-router";
import { QrCode, Lock, Clock, PackageCheck, Truck, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { SitePage } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import stand from "@/assets/shop-stand.jpg";
import poster from "@/assets/shop-poster.jpg";
import sticker from "@/assets/shop-sticker.jpg";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "QR Print Shop & Merch — Coming Soon | Menuly" },
      { name: "description", content: "Professional acrylic table stands, wall posters, and vinyl QR stickers custom printed for your restaurant." },
      { property: "og:title", content: "QR Print Shop — Menuly" },
      { property: "og:description", content: "Printed QR products, coming soon." },
    ],
  }),
  component: ShopPublic,
});

export type ShopProduct = {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  badge: string;
};

const shopProducts: ShopProduct[] = [
  {
    id: "table-stand",
    name: "Acrylic Table Stand",
    description: "Clear premium acrylic stand holding your QR card at table height. Wipes clean, stands sturdy, looks elegant on any dining table.",
    price: "₹499",
    image: stand,
    badge: "Most popular",
  },
  {
    id: "wall-poster",
    name: "Wall Poster (A3 Matte)",
    description: "Matte-finish A3 poster printed with your QR code, logo and short tagline. Perfect for entryways, counter, or pickup counters.",
    price: "₹349",
    image: poster,
    badge: "High visibility",
  },
  {
    id: "stickers",
    name: "QR Sticker Pack (12 pcs)",
    description: "Weather-proof vinyl stickers for tables, glass windows, cash registers, and takeout packaging.",
    price: "₹249",
    image: sticker,
    badge: "Pack of 12",
  },
  {
    id: "table-tent",
    name: "Folded Wooden Table Tent",
    description: "Double-sided premium tent card featuring your restaurant branding on one side and a scannable QR code on the other.",
    price: "₹399",
    image: stand,
    badge: "Eco-friendly",
  },
];

const shopSteps = [
  {
    title: "Pick your product",
    text: "Choose table stands, wall posters, or stickers — all custom tailored with your restaurant's digital menu QR code.",
  },
  {
    title: "Secure payment & doorstep delivery",
    text: "UPI, Cards, and Net Banking with fast courier delivery to your restaurant address across India.",
  },
  {
    title: "Pre-linked & ready to use",
    text: "We print your high-res vector QR, brand logo, and name. Unpack and place them on your tables immediately.",
  },
];

function ShopPublic() {
  return (
    <SitePage>
      {/* Header section */}
      <section className="mx-auto max-w-6xl px-5 pb-6 pt-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent/30 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-accent-foreground">
          <Clock className="size-3.5" /> Shop &bull; Coming Soon
        </div>
        <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
          Printed QR Products, on the Way
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Table stands, posters and stickers printed with your restaurant QR code and logo. Ordering opens in the next release — nothing to pay today!
        </p>

        {/* Free QR Callout */}
        <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild className="gap-2 shadow-soft">
            <Link to="/auth" search={{ mode: "signup" }}>
              <QrCode className="size-4" /> Download Free QR Now
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="gap-2">
            <Link to="/how-to-use">
              See How It Works <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Notice Banner */}
      <section className="mx-auto max-w-6xl px-5">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                Checkout and delivery will be switched on soon
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Until then, every QR code is 100% free to download and print yourself using our Print Studio.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild className="shrink-0 gap-1.5">
            <Link to="/auth">
              Login to Studio <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Product Cards Grid */}
      <section className="mx-auto max-w-6xl px-5 py-10" aria-label="Printed menu products">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-semibold">Physical Merchandise</h2>
          <span className="text-xs text-muted-foreground font-semibold">All products custom printed</span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {shopProducts.map((p) => (
            <article
              key={p.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-full bg-card/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground shadow-sm backdrop-blur">
                  {p.badge}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-base font-bold leading-snug">{p.name}</h3>
                <p className="mt-1 flex-1 text-xs text-muted-foreground leading-relaxed">
                  {p.description}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                  <div>
                    <span className="font-display text-xl font-bold text-primary">{p.price}</span>
                    <span className="block text-[10px] text-muted-foreground">incl. custom printing</span>
                  </div>

                  <Button size="sm" variant="secondary" disabled className="gap-1.5 opacity-80 cursor-not-allowed text-xs">
                    <Lock className="size-3.5" /> Coming soon
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* How Ordering Will Work & Express Shipping */}
      <section className="mx-auto max-w-6xl px-5 pb-16 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft md:p-8">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <PackageCheck className="size-5" />
            </span>
            <h2 className="font-display text-xl font-semibold">How Ordering Will Work</h2>
          </div>

          <ol className="mt-6 flex flex-col gap-5">
            {shopSteps.map((step, index) => (
              <li key={step.title} className="flex items-start gap-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{step.title}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col justify-between gap-6 rounded-2xl border border-border/80 bg-card/60 p-6 shadow-soft md:p-8">
          <div>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Truck className="size-6" />
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold">Pan-India Express Delivery</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              All QR merchandise is manufactured with UV-cured waterproof inks that withstand hot spills, oil grease, and frequent sanitizer wipes.
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-background/80 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <ShieldCheck className="size-4 text-veg" />
              100% Scan Guarantee
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Every stand and sticker is machine-tested before packaging. If any code fails to scan, we reprint and replace it free.
            </p>
          </div>
        </div>
      </section>
    </SitePage>
  );
}
