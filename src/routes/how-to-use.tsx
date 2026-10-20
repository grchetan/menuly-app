import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SitePage } from "@/components/SiteLayout";
import { HowSteps } from "@/components/HowSteps";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/how-to-use")({
  head: () => ({
    meta: [
      { title: "How to use — Setup guide | Menuly" },
      { name: "description", content: "Step-by-step guide to set up your digital QR menu in 5 minutes." },
      { property: "og:title", content: "How to use Menuly — Setup guide" },
      { property: "og:description", content: "Create your account, add dishes, print your QR code." },
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

const faqs: [string, string][] = [
  ["Do customers need to install an app?", "No. They just open their phone camera, scan the QR code and the menu opens in the browser."],
  ["If I change my menu, do I need a new QR code?", "No. Your QR code always points to the same link, so changes show instantly."],
  ["Can I change my menu link?", "Yes, on the Dashboard. But if you already printed QR codes, changing the link will break them — download and print the new one."],
  ["How do customers contact me?", "Add your WhatsApp and phone number on the Dashboard. Buttons appear at the bottom of your menu."],
  ["Can I use it on my phone?", "Yes, the whole dashboard works on mobile, tablet and laptop."],
];

function HowTo() {
  return (
    <SitePage>
      <section className="mx-auto max-w-6xl px-5 pb-6 pt-12 text-center">
        <span className="rounded-full bg-accent/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-foreground">Setup guide</span>
        <h1 className="mt-4 text-5xl font-semibold">How to use Menuly</h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-muted-foreground">Follow these 6 easy steps — your digital menu will be live in about 5 minutes.</p>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-8"><HowSteps /></section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-7 shadow-soft">
          <h2 className="flex items-center gap-2 text-2xl font-semibold"><Lightbulb className="text-accent" /> Pro tips</h2>
          <ul className="mt-4 space-y-3">
            {tips.map((t) => <li key={t} className="flex gap-3 text-sm"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />{t}</li>)}
          </ul>
        </div>
        <div className="rounded-2xl border bg-card p-7 shadow-soft">
          <h2 className="text-2xl font-semibold">Common questions</h2>
          <Accordion type="single" collapsible className="mt-2">
            {faqs.map(([q, a]) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger className="text-left">{q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
      <div className="text-center">
        <Button size="lg" asChild><Link to="/auth" search={{ mode: "signup" }}>Start setup now <ArrowRight /></Link></Button>
      </div>
    </SitePage>
  );
}
