import { createFileRoute } from "@tanstack/react-router";
import { Heart, Leaf, Zap } from "lucide-react";
import { SitePage } from "@/components/SiteLayout";
import { AnimatedQR } from "@/components/AnimatedQR";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About us — Menuly" },
      { name: "description", content: "Why we built simple digital QR menus for local restaurants and food stalls." },
      { property: "og:title", content: "About Menuly" },
      { property: "og:description", content: "Simple digital menus for local food businesses." },
    ],
  }),
  component: About,
});

const values = [
  { icon: Zap, title: "Simple first", text: "If a chai stall owner can't set it up in 5 minutes, we haven't done our job." },
  { icon: Leaf, title: "Less paper", text: "No reprinting every time a price changes. Better for your pocket and the planet." },
  { icon: Heart, title: "Local at heart", text: "Built for Indian restaurants, cafes and food corners — veg tags, ₹ prices and WhatsApp built in." },
];

function About() {
  return (
    <SitePage>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 md:grid-cols-[1.3fr_1fr]">
        <div className="animate-rise">
          <span className="rounded-full bg-accent/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-foreground">About us</span>
          <h1 className="mt-4 text-5xl font-semibold leading-tight">Helping local food businesses go digital — simply.</h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Printed menus get old fast. Prices change, dishes sell out, specials come and go. We built Menuly so any restaurant,
            café or food stall can have a beautiful menu on every customer's phone and update it whenever they want.
          </p>
          <p className="mt-4 text-muted-foreground">No tech skills, no expensive hardware — just a QR code on the table.</p>
        </div>
        <div className="mx-auto w-64 animate-float"><AnimatedQR /></div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-5 md:grid-cols-3">
        {values.map((v) => (
          <div key={v.title} className="rounded-2xl border bg-card p-7 shadow-soft">
            <v.icon className="size-6 text-primary" />
            <h2 className="mt-4 text-xl font-semibold">{v.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{v.text}</p>
          </div>
        ))}
      </section>
    </SitePage>
  );
}
