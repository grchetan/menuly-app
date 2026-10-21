import { createFileRoute, Link } from "@tanstack/react-router";
import {
  QrCode,
  Smartphone,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  UtensilsCrossed,
  Coffee,
  ShoppingBag,
  Store,
  Clock,
  Leaf,
  Heart,
  Zap,
  Printer,
  XCircle,
  MessageCircle,
  ShieldCheck,
  Check,
  Layers,
  ChefHat,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SitePage } from "@/components/SiteLayout";
import { AnimatedQR } from "@/components/AnimatedQR";
import hero from "@/assets/hero.png";
import shopStand from "@/assets/shop-stand.png";
import shopSticker from "@/assets/shop-sticker.png";
import shopPoster from "@/assets/shop-poster.png";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Menuly | Digital QR Menus for Restaurants" },
      {
        name: "description",
        content:
          "Learn how Menuly empowers Indian restaurants, cafes, dhabas, and local food brands to replace printed paper menus with fast, interactive digital QR menus.",
      },
      { property: "og:title", content: "About Menuly — Digital QR Menus for Food Businesses" },
      {
        property: "og:description",
        content:
          "Helping local food brands go digital simply: instant camera scan, real-time price updates, zero reprint costs, and direct WhatsApp ordering.",
      },
    ],
  }),
  component: About,
});

const audienceCategories = [
  {
    icon: Coffee,
    title: "Cafés & Bakeries",
    badge: "Specialty & Brews",
    text: "Easily update daily fresh bakes, seasonal roast blends, and pastry specials without having to reprint fancy cards every week.",
  },
  {
    icon: Store,
    title: "Dhabas & Family Restaurants",
    badge: "High-Rush Dining",
    text: "Handle packed dining halls effortlessly. Guests scan the QR stand on their table instantly instead of waiting for waitstaff to bring physical menus.",
  },
  {
    icon: UtensilsCrossed,
    title: "Street Food & Chai Points",
    badge: "Quick Turnover",
    text: "Keep counters clean and clutter-free. Customers scan from their bikes or tables, order quickly, and pay with zero hassle.",
  },
  {
    icon: ShoppingBag,
    title: "Cloud Kitchens & Takeaways",
    badge: "Direct Re-Orders",
    text: "Stick branded QR stickers on meal delivery packaging. Customers reorder directly with you, saving high 30% aggregator commissions.",
  },
  {
    icon: ChefHat,
    title: "Fine Dine & Restrobars",
    badge: "Premium Experience",
    text: "Elevate your dining atmosphere with sleek acrylic table stands, high-res dish photos, allergy notes, and table-specific identifiers.",
  },
  {
    icon: Leaf,
    title: "Pure-Veg & Health Cafes",
    badge: "Dietary Verified",
    text: "Prominently display certified 100% Pure Veg badges, ingredient notes, and spice levels that build instant trust with health-conscious diners.",
  },
];

const howItWorksSteps = [
  {
    step: "01",
    title: "Customer Scans Table QR",
    text: "No mobile app download, no registration, no waiting. The customer simply points their phone camera at the QR stand on the table.",
    icon: QrCode,
  },
  {
    step: "02",
    title: "Interactive Menu Opens Instantly",
    text: "Your full categorized menu loads in under 1 second with mouth-watering photos, ₹ pricing, dish descriptions, and veg/non-veg tags.",
    icon: Smartphone,
  },
  {
    step: "03",
    title: "Real-Time Updates & Direct Order",
    text: "Kitchen ran out of paneer? 1 tap on your dashboard marks it 'Sold Out' on all phones immediately. Guests order via waiter or direct WhatsApp.",
    icon: Zap,
  },
];

const brandBenefits = [
  {
    icon: Printer,
    title: "Save ₹15,000–₹50,000 Every Year",
    description:
      "No more paying designers and printers every time ingredient costs shift or you add a new recipe. Update prices anytime for ₹0.",
  },
  {
    icon: Clock,
    title: "Instant 2-Second Menu Edits",
    description:
      "Change dish prices, add festival specials, or mark sold-out items from your mobile phone in real-time. Changes reflect immediately on all customer screens.",
  },
  {
    icon: TrendingUp,
    title: "Boost Average Order Value by 25%",
    description:
      "Visual menus with appetizing dish photos and recommended pairings tempt guests to order more starters, drinks, and desserts.",
  },
  {
    icon: Sparkles,
    title: "Build Your Own Local Brand",
    description:
      "Custom branded QR codes featuring your restaurant's logo in the center, customized accent colors, and your own custom menu link.",
  },
  {
    icon: MessageCircle,
    title: "Direct WhatsApp & Call Ordering",
    description:
      "Customers can tap the WhatsApp button to message special requests, order ahead for takeaway, or book future party catering.",
  },
  {
    icon: ShieldCheck,
    title: "100% Clean, Hygienic & Contactless",
    description:
      "Say goodbye to sticky, stained, germ-ridden laminated menu cards. Every diner views a fresh, crisp menu right on their personal smartphone.",
  },
];

const coreValues = [
  {
    icon: Zap,
    title: "Simple First (Aasan & Tez)",
    text: "If a busy cook or local chai stall owner cannot set up their menu in 5 minutes, we haven't done our job. Zero tech jargon, 100% effortless.",
  },
  {
    icon: Leaf,
    title: "Save Paper & Trees (Eco-Friendly)",
    text: "Millions of plastic-laminated menu cards end up in landfills every month. Digital menus save your wallet and protect the planet.",
  },
  {
    icon: Heart,
    title: "Made for Indian Food Businesses",
    text: "Crafted specifically for the Indian restaurant ecosystem: ₹ pricing, high-rush management, WhatsApp integration, and pure-veg verification.",
  },
];

function About() {
  return (
    <SitePage>
      {/* 1. HERO SECTION: MISSION & CORE STORY */}
      <section className="relative overflow-hidden px-5 pb-16 pt-10 md:pt-16">
        {/* Glow backdrop */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-10 -translate-x-1/2 size-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute right-10 top-32 size-64 rounded-full bg-accent/15 blur-2xl" />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.25fr_1fr]">
          <div className="animate-rise space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              <Sparkles className="size-3.5" /> About Menuly · India's QR Menu Engine
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Empowering local food brands to go <em className="text-primary not-italic">digital</em> — simply.
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Printed paper menus get old fast. Prices fluctuate, dishes sell out during dinner rush, and specials come and go.
              We built <strong>Menuly</strong> so that every restaurant, café, dhaba, and street food corner across India can have a
              stunning, interactive digital menu on every customer's phone — updated whenever you want in seconds.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-semibold text-foreground pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 shadow-xs">
                <Check className="size-4 text-veg" /> No App Download Needed
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 shadow-xs">
                <Check className="size-4 text-veg" /> ₹0 Reprinting Cost Forever
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 shadow-xs">
                <Check className="size-4 text-veg" /> 1-Tap Sold-Out Sync
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button size="lg" asChild className="gap-2 font-bold shadow-soft">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Create Free Digital Menu <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="font-semibold">
                <Link to="/how-to-use">See How It Works</Link>
              </Button>
            </div>
          </div>

          {/* Hero Visual Mockup */}
          <div className="relative justify-self-center lg:justify-self-end w-full max-w-md">
            <div className="relative rounded-3xl border border-border/80 bg-card p-3 shadow-lift">
              <img
                src={hero}
                alt="Customers scanning QR digital menu on smartphone in a restaurant"
                width={1024}
                height={1152}
                className="w-full rounded-2xl object-cover shadow-sm aspect-[4/3.8]"
              />

              {/* Floating QR Badge */}
              <div className="absolute -bottom-6 -left-6 w-32 sm:w-36 animate-float rounded-2xl shadow-lift">
                <AnimatedQR />
              </div>

              {/* Floating Live Update Badge */}
              <div
                className="absolute -right-3 top-6 animate-float rounded-2xl border border-border/70 bg-card/95 px-4 py-2.5 shadow-lift backdrop-blur-sm"
                style={{ animationDelay: "1.2s" }}
              >
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-veg animate-pulse" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Live Kitchen Sync</p>
                </div>
                <p className="text-xs sm:text-sm font-bold text-primary mt-0.5">Paneer Butter Masala · ₹240</p>
                <p className="text-[10px] text-muted-foreground">Updated 1 sec ago</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS & IMPACT TICKER */}
      <section className="border-y border-border/70 bg-card/60">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-8 text-center md:grid-cols-4">
          <div>
            <p className="font-display text-3xl sm:text-4xl font-extrabold text-primary">&lt; 1 sec</p>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-0.5">Camera Scan & Menu Load</p>
          </div>
          <div>
            <p className="font-display text-3xl sm:text-4xl font-extrabold text-primary">₹0</p>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-0.5">Reprint Cost on Price Change</p>
          </div>
          <div>
            <p className="font-display text-3xl sm:text-4xl font-extrabold text-primary">1 Tap</p>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-0.5">Instant Sold-Out Toggle</p>
          </div>
          <div>
            <p className="font-display text-3xl sm:text-4xl font-extrabold text-primary">100%</p>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-0.5">Mobile-Friendly on 4G</p>
          </div>
        </div>
      </section>

      {/* 3. OLD PAPER VS MENULY COMPARISON */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="rounded-full bg-accent/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-foreground">
            The Transformation
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            Why Traditional Menus Hold Your Business Back
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            See how switching to an online QR menu eliminates daily kitchen friction and saves your restaurant thousands of rupees.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Old Paper Menu Card */}
          <div className="rounded-3xl border border-destructive/25 bg-destructive/5 p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-3 border-b border-destructive/20 pb-4">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
                <XCircle className="size-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Old Printed Paper Menus</h3>
                <p className="text-xs text-muted-foreground">Outdated, expensive, and inflexible</p>
              </div>
            </div>

            <ul className="space-y-3 text-sm text-foreground/90">
              <li className="flex items-start gap-2.5">
                <XCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                <span><strong>Expensive reprinting:</strong> Spending ₹10,000–₹35,000 yearly every time fuel, vegetable, or dairy costs change.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <XCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                <span><strong>Awkward kitchen apologies:</strong> Customers order an item only for the waiter to return saying "Sir, ye dish khatam ho gayi hai."</span>
              </li>
              <li className="flex items-start gap-2.5">
                <XCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                <span><strong>Unhygienic & damaged:</strong> Laminated cards get sticky, gravy-stained, dog-eared, and torn within weeks.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <XCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                <span><strong>No visual appeal:</strong> Plain black-and-white text fails to tempt hungry customers into trying high-margin specialties.</span>
              </li>
            </ul>
          </div>

          {/* Menuly Digital Menu Card */}
          <div className="rounded-3xl border-2 border-primary/40 bg-card p-6 sm:p-8 space-y-5 shadow-soft relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary px-3 py-1 rounded-bl-xl text-[10px] font-extrabold uppercase tracking-wider text-primary-foreground">
              Modern Solution
            </div>

            <div className="flex items-center gap-3 border-b border-border/70 pb-4">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Menuly Digital QR Menu</h3>
                <p className="text-xs text-muted-foreground">Instant, interactive, and ₹0 reprint forever</p>
              </div>
            </div>

            <ul className="space-y-3 text-sm text-foreground/90">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4 text-veg shrink-0 mt-0.5" />
                <span><strong>Instant 2-second price updates:</strong> Update dishes or change prices directly from your phone. Zero reprinting bills.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4 text-veg shrink-0 mt-0.5" />
                <span><strong>1-Tap Sold-Out Toggle:</strong> Mark any dish unavailable in real time. Customers see "Sold out" and choose an alternative instantly.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4 text-veg shrink-0 mt-0.5" />
                <span><strong>100% Hygienic & Contactless:</strong> Diners scan from their personal mobile phone cameras. Always clean, modern, and inviting.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4 text-veg shrink-0 mt-0.5" />
                <span><strong>Photos & Dietary Tags:</strong> High-res dish images, spicy indicators, and Pure-Veg tags tempt customers to order 25% more.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. WHO DOES MENULY HELP? (KIN-KIN BUSINESSES KE LIYE HELPFUL HAI) */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="rounded-full bg-accent/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-foreground">
            Tailored For Every Kitchen
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            Who Does Menuly Help?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Whether you run a 4-table neighborhood cafe or a 100-table highway dhaba, Menuly is crafted to fit your everyday workflow seamlessly.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {audienceCategories.map((cat) => (
            <div
              key={cat.title}
              className="group rounded-3xl border border-border/80 bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift hover:border-primary/40 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <cat.icon className="size-6" />
                  </div>
                  <span className="rounded-full border border-border/80 bg-muted/50 px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground">
                    {cat.badge}
                  </span>
                </div>

                <h3 className="font-display text-xl font-bold text-foreground">{cat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{cat.text}</p>
              </div>

              <div className="pt-4 border-t border-border/50 mt-4 flex items-center justify-between text-xs font-semibold text-primary">
                <span>View Digital Menu Flow</span>
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. HOW IT WORKS: ONLINE QR MENU ACCESS WORKFLOW */}
      <section className="border-y border-border/70 bg-card/40 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="rounded-full bg-accent/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-foreground">
              Customer Experience
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
              How Customers Access Your Menu Online
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Simple 3-step scan experience with zero hurdles. Works smoothly on every iPhone and Android device.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3 relative">
            {howItWorksSteps.map((s) => (
              <div
                key={s.step}
                className="relative rounded-3xl border border-border/80 bg-card p-7 shadow-soft space-y-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-3xl font-extrabold text-primary/40">{s.step}</span>
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <s.icon className="size-5" />
                  </div>
                </div>

                <h3 className="font-display text-xl font-bold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. ADVANTAGES FOR LOCAL BRANDS (GAME CHANGER) */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="rounded-full bg-accent/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-foreground">
            Grow Your Local Brand
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            How Menuly Helps Local Brands Flourish
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            We don't put giant tech watermarks or hijack your diner relationships. Menuly is built to celebrate your brand.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {brandBenefits.map((b) => (
            <div
              key={b.title}
              className="rounded-3xl border border-border/80 bg-card p-6 shadow-soft space-y-3.5 transition-all hover:shadow-lift"
            >
              <div className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary">
                <b.icon className="size-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">{b.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. PHYSICAL DISPLAY MATERIALS SHOWCASE */}
      <section className="border-t border-border/70 bg-card/50 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="rounded-full bg-accent/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-foreground">
              Print-Ready QR Display Options
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
              Designed For Real Dining Tables
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Download high-res print templates for free or explore custom acrylic table stands, counter stickers, and posters.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Stand */}
            <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-soft group hover:shadow-lift transition-all">
              <div className="overflow-hidden aspect-[4/3]">
                <img
                  src={shopStand}
                  alt="Acrylic table stand with QR code on restaurant table"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">Table Display</span>
                <h3 className="text-base font-bold text-foreground">Acrylic QR Table Stands</h3>
                <p className="text-xs text-muted-foreground">
                  Sturdy, wipe-clean acrylic stands placed on every table so guests scan right from their seats.
                </p>
              </div>
            </div>

            {/* Sticker */}
            <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-soft group hover:shadow-lift transition-all">
              <div className="overflow-hidden aspect-[4/3]">
                <img
                  src={shopSticker}
                  alt="Weatherproof QR stickers on food packaging and table counter"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">Counter & Parcels</span>
                <h3 className="text-base font-bold text-foreground">Vinyl Weather-Proof Stickers</h3>
                <p className="text-xs text-muted-foreground">
                  Waterproof stickers for billing counters, glass doors, and takeaway parcel packaging.
                </p>
              </div>
            </div>

            {/* Poster */}
            <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-soft group hover:shadow-lift transition-all">
              <div className="overflow-hidden aspect-[4/3]">
                <img
                  src={shopPoster}
                  alt="Restaurant entrance QR poster"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">Entrance & Wall</span>
                <h3 className="text-base font-bold text-foreground">High-Res Wall Menu Posters</h3>
                <p className="text-xs text-muted-foreground">
                  Hang near the entry gate so waiting guests can browse dishes before they are seated.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. OUR CORE VALUES */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="rounded-full bg-accent/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-foreground">
            Our Guiding Philosophy
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            The Values Behind Menuly
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            We measure our success not by complex software bells and whistles, but by how easily a busy kitchen operates every single day.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {coreValues.map((v) => (
            <div key={v.title} className="rounded-3xl border border-border/80 bg-card p-7 shadow-soft space-y-3.5">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                <v.icon className="size-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 9. FINAL CALL TO ACTION (CTA) */}
      <section className="mx-auto max-w-5xl px-5 pb-20">
        <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/10 p-8 sm:p-14 text-center shadow-lift relative overflow-hidden">
          <div className="pointer-events-none absolute -right-20 -bottom-20 size-64 rounded-full bg-primary/10 blur-3xl" />

          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
            <Sparkles className="size-3.5" /> Start Free in 5 Minutes
          </span>

          <h2 className="mt-5 font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            Ready to upgrade your restaurant's menu?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            Join forward-thinking Indian food businesses who have said goodbye to printed paper menus.
            Set up your digital QR menu in 5 minutes. No credit card required.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" asChild className="w-full sm:w-auto font-bold gap-2 shadow-soft">
              <Link to="/auth" search={{ mode: "signup" }}>
                Create Your Free Menu <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto font-semibold">
              <Link to="/contact">Talk to Our Team</Link>
            </Button>
          </div>
        </div>
      </section>
    </SitePage>
  );
}
