import { createFileRoute, Link } from "@tanstack/react-router";
import { QrCode, Smartphone, RefreshCw, ArrowRight, Sparkles, MessageCircle, Palette, Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SitePage } from "@/components/SiteLayout";
import { HowSteps } from "@/components/HowSteps";
import { AnimatedQR } from "@/components/AnimatedQR";
import hero from "@/assets/hero.png";

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
  { icon: Sparkles, title: "Instant QR Menus", text: "Crisp, interactive digital menu presentation so guests browse dishes with complete ease." },
  { icon: MessageCircle, title: "WhatsApp & Call", text: "Customers reach you with one tap right from the menu." },
  { icon: Palette, title: "Beautiful by default", text: "Photos, categories and a sticky menu bar that looks premium." },
];

function Index() {
  return (
    <SitePage>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-8 md:grid-cols-2 md:pt-14">
        <div className="animate-rise">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-foreground">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" /> For restaurants, cafes & food stalls
          </span>
          <h1 className="mt-5 text-5xl font-semibold leading-[1.05] md:text-6xl">
            Your menu, one <em className="text-primary">scan</em> away.
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            Build a modern digital menu in minutes, share it with a QR code, and never reprint a menu again.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild><Link to="/auth" search={{ mode: "signup" }}>Create your free menu <ArrowRight /></Link></Button>
            <Button size="lg" variant="outline" asChild><Link to="/how-to-use">See how it works</Link></Button>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {["Free to start", "No app needed", "Setup in 5 minutes"].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5"><Check className="size-4 text-primary" />{t}</li>
            ))}
          </ul>
        </div>
        <div className="relative justify-self-center">
          <img src={hero} alt="Customer viewing a digital menu on a phone" width={1024} height={1152}
            className="w-full max-w-md rounded-3xl object-cover shadow-lift" />
          <div className="absolute -bottom-6 -left-6 w-32 animate-float sm:w-36"><AnimatedQR /></div>
          <div className="absolute -right-3 top-8 animate-float rounded-2xl border bg-card px-4 py-3 shadow-lift" style={{ animationDelay: "1.2s" }}>
            <p className="text-xs text-muted-foreground">Menu updated</p>
            <p className="text-sm font-bold text-primary">Paneer Tikka · ₹220</p>
          </div>
        </div>
      </section>

      <section className="border-y bg-card/60">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-8 text-center md:grid-cols-4">
          {[["5 min", "to go live"], ["₹0", "printing cost to update"], ["1 tap", "WhatsApp or call"], ["100%", "mobile friendly"]].map(([a, b]) => (
            <div key={b}><p className="font-display text-3xl font-semibold text-primary">{a}</p><p className="text-sm text-muted-foreground">{b}</p></div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-center text-4xl font-semibold">Everything your menu needs</h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">Simple enough for a chai stall, polished enough for a fine-dine restaurant.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="group rounded-2xl border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift">
              <span className="flex size-11 items-center justify-center rounded-xl bg-secondary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-semibold">Go live in 3 steps</h2>
            <p className="mt-2 text-muted-foreground">Sign up, add dishes, print your QR. That's it.</p>
          </div>
          <Button variant="link" asChild><Link to="/how-to-use">Full setup guide <ArrowRight /></Link></Button>
        </div>
        <div className="mt-8"><HowSteps limit={3} /></div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <figure className="mx-auto max-w-2xl text-center">
          <div className="flex justify-center gap-1 text-accent">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="size-5 fill-current" />)}</div>
          <blockquote className="mt-4 font-display text-2xl leading-snug">"We change our specials every day. Now it takes one minute on the phone instead of reprinting menus every month."</blockquote>
          <figcaption className="mt-4 text-sm text-muted-foreground">— Rohan Verma, Owner of The Roasted Bean Cafe</figcaption>
        </figure>
      </section>

      <section className="mx-auto max-w-6xl px-5">
        <div className="relative overflow-hidden rounded-3xl bg-primary p-10 text-primary-foreground shadow-lift md:p-14">
          <div className="absolute -right-8 -top-8 w-48 rotate-12 opacity-20"><AnimatedQR /></div>
          <h2 className="relative max-w-lg text-4xl font-semibold">Ready to ditch the printed menu?</h2>
          <p className="relative mt-3 max-w-md opacity-85">Create your digital menu and QR code today — it's free to start.</p>
          <Button size="lg" variant="accent" className="relative mt-7" asChild><Link to="/auth" search={{ mode: "signup" }}>Get started free <ArrowRight /></Link></Button>
        </div>
      </section>
    </SitePage>
  );
}
