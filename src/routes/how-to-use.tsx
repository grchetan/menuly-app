import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Lightbulb,
  Wifi,
  QrCode,
  Smartphone,
  ShieldCheck,
  FileText,
  BatteryCharging,
  Layers,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SitePage } from "@/components/SiteLayout";
import { HowSteps } from "@/components/HowSteps";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/how-to-use")({
  head: () => ({
    meta: [
      { title: "How to use — Setup guide | Menuly" },
      { name: "description", content: "Step-by-step guide to set up your digital QR menu in 5 minutes, plus zero-network offline solutions for remote dhabas and highway stops." },
      { property: "og:title", content: "How to use Menuly — Setup guide & Offline Solutions" },
      { property: "og:description", content: "Create your account, add dishes, print your QR code, and operate seamlessly even with zero internet." },
    ],
  }),
  component: HowTo,
});

const tips = [
  "Use square photos with good light — dishes look much tastier.",
  "Keep descriptions short: main ingredients + spice level.",
  "Turn off the Available switch when a dish runs out — customers see 'Sold out'.",
  "Keep the QR dark on a light background for the most reliable scanning.",
  "Place one QR card on every table and one at the entrance.",
];

const offlineSolutions = [
  {
    icon: Wifi,
    badge: "Most Recommended",
    title: "1. Local No-Internet Wi-Fi Router",
    subtitle: "Ideal for highway dhabas, basements & metal roofs",
    description:
      "Buy an inexpensive ₹800–₹1,200 standard Wi-Fi router. You do NOT need any active internet line, SIM card, or broadband connection! Keep the Wi-Fi open as 'Free-Menu-WiFi'. Customers connect with 1 tap, and the local menu opens instantly with 0 data required.",
    benefits: ["Zero monthly internet bills", "Works even in deep valleys & basements", "Fast 1-second load times"],
  },
  {
    icon: QrCode,
    badge: "Built into Menuly",
    title: "2. Offline Plain Text QR Mode",
    subtitle: "Menu text appears directly in phone camera app",
    description:
      "In Menuly QR Studio, switch to 'Offline Plain Text QR'. This encodes your top categories, dishes, and prices directly inside the QR code pixels. When a customer scans with any smartphone camera (iPhone, Samsung, Xiaomi, Vivo), the camera immediately displays the menu on screen — no web browser, no mobile data, and no recharge needed!",
    benefits: ["Works with 0 mobile data / no recharge", "Native phone camera popup", "Zero dependence on servers"],
  },
  {
    icon: Smartphone,
    badge: "Automatic PWA",
    title: "3. PWA & Automatic Device Caching",
    subtitle: "Previously loaded menu stays saved on customer phones",
    description:
      "Menuly is built with progressive offline caching. When a customer opens your menu, the dishes and prices are automatically cached to their phone storage. If their mobile data fluctuates or disconnects while eating, they can continue browsing categories and dishes seamlessly.",
    benefits: ["Zero disruption during network drops", "Ambient offline mode indicator", "Saves mobile data for customers"],
  },
  {
    icon: BatteryCharging,
    badge: "5% Edge-Case Rule",
    title: "4. Emergency Counter Master Cards",
    subtitle: "For dead phone batteries & non-smartphone guests",
    description:
      "Always keep 2–3 physical laminated master cards at your cash billing counter. This covers guests whose phone battery died during highway travel (switched off phone), elderly guests without smartphones, or customers whose camera lens is broken.",
    benefits: ["Never lose an order", "Senior-citizen friendly", "Laminated cards last years"],
  },
];

const faqs: [string, string][] = [
  ["Do customers need to install an app?", "No. They just open their phone camera, scan the QR code and the menu opens in the browser."],
  ["If I change my menu, do I need a new QR code?", "No. Your digital QR code always points to the same link, so changes show instantly."],
  ["Can I change my menu link?", "Yes, on the Dashboard. But if you already printed QR codes, changing the link will break them — download and print the new one."],
  ["How do customers contact me?", "Add your WhatsApp and phone number on the Dashboard. Buttons appear at the bottom of your menu."],
  ["Can I use it on my phone?", "Yes, the whole dashboard works on mobile, tablet and laptop."],
  [
    "What if my dhaba or restaurant has no internet or zero network coverage?",
    "Use Menuly's built-in 'Offline Plain Text QR' mode in QR Studio, or set up a local ₹800 Wi-Fi hotspot router with no internet connection. When guests scan, the menu appears natively on their phone camera screen without requiring any mobile data pack or SIM recharge.",
  ],
  [
    "What if a customer has a switched-off phone or dead battery?",
    "Always keep 2–3 physical laminated master cards at your cash or reception counter. This professional 5% backup rule ensures elderly guests or travelers with discharged phones can order without delay.",
  ],
];

function HowTo() {
  return (
    <SitePage>
      <section className="mx-auto max-w-6xl px-5 pb-6 pt-12 text-center">
        <span className="rounded-full bg-accent/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-foreground">
          Setup guide
        </span>
        <h1 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">
          How to use Menuly
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base sm:text-lg text-muted-foreground">
          Follow these 6 easy steps — your digital menu will be live in about 5 minutes.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-8">
        <HowSteps />
      </section>

      {/* Zero Network & Highway Dhaba Solutions Section */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="rounded-3xl border border-border/80 bg-gradient-to-b from-card to-card/50 p-6 sm:p-10 shadow-soft">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              <ShieldCheck className="size-3.5" /> Zero-Network & Highway Dhaba Solutions
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground">
              No Internet? No Mobile Recharge? No Problem!
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Don't let remote highway locations, metal roofs, basement halls, or dead phone batteries stop your business. Here is how professional restaurant and dhaba owners manage 100% smooth operations:
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:gap-6 md:grid-cols-2">
            {offlineSolutions.map((sol) => (
              <div
                key={sol.title}
                className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-soft transition-all hover:border-primary/40 hover:shadow-lift"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
                      <sol.icon className="size-5" />
                    </span>
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-bold text-foreground">
                      {sol.badge}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground">{sol.title}</h3>
                  <p className="text-xs font-semibold text-primary mt-0.5">{sol.subtitle}</p>
                  <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">{sol.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Key Advantages
                  </p>
                  <ul className="space-y-1">
                    {sol.benefits.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-xs text-foreground/80">
                        <span className="size-1.5 rounded-full bg-veg shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl bg-primary/5 border border-primary/20 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <p className="text-sm font-bold text-foreground">Ready to try Offline Plain Text QR in your dashboard?</p>
              <p className="text-xs text-muted-foreground">Customize styling, preview camera view, and print clean A5 / A4 sheets in seconds.</p>
            </div>
            <Button asChild size="sm" className="gap-2 shrink-0 shadow-soft">
              <Link to="/qr">
                <QrCode className="size-4" /> Open QR Studio
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pro Tips & FAQs */}
      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-8 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6 sm:p-7 shadow-soft">
          <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-semibold">
            <Lightbulb className="text-accent" /> Pro tips
          </h2>
          <ul className="mt-4 space-y-3">
            {tips.map((t) => (
              <li key={t} className="flex gap-3 text-sm">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border bg-card p-6 sm:p-7 shadow-soft">
          <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-semibold">
            <HelpCircle className="text-primary" /> Common questions
          </h2>
          <Accordion type="single" collapsible className="mt-2">
            {faqs.map(([q, a]) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger className="text-left text-sm font-semibold">{q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <div className="text-center py-6">
        <Button size="lg" asChild className="gap-2 shadow-soft">
          <Link to="/auth" search={{ mode: "signup" }}>
            Start setup now <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </SitePage>
  );
}
