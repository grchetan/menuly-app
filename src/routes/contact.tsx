import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MessageCircle, Clock } from "lucide-react";
import { SitePage } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP, whatsappLink } from "@/lib/config";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact us — Menuly" },
      { name: "description", content: "Get in touch with the Menuly team on WhatsApp or email." },
      { property: "og:title", content: "Contact Menuly" },
      { property: "og:description", content: "Questions? Reach us on WhatsApp or email." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [form, setForm] = useState({ name: "", restaurant: "", message: "" });
  const text = `Hi! I'm ${form.name || "-"} from ${form.restaurant || "-"}.\n${form.message}`;
  return (
    <SitePage>
      <section className="mx-auto max-w-6xl px-5 pb-6 pt-12 text-center">
        <h1 className="text-5xl font-semibold">Let's talk</h1>
        <p className="mx-auto mt-3 max-w-lg text-lg text-muted-foreground">Questions, feedback or need help setting up? We're happy to help.</p>
      </section>
      <section className="mx-auto grid max-w-5xl gap-6 px-5 py-8 md:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          <a href={whatsappLink(SUPPORT_WHATSAPP)} target="_blank" rel="noreferrer" className="flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-soft transition-transform hover:-translate-y-0.5">
            <span className="flex size-12 items-center justify-center rounded-xl bg-whatsapp text-whatsapp-foreground"><MessageCircle /></span>
            <div><p className="font-semibold">WhatsApp</p><p className="text-sm text-muted-foreground">Fastest way to reach us</p></div>
          </a>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-soft transition-transform hover:-translate-y-0.5">
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Mail /></span>
            <div><p className="font-semibold">Email</p><p className="text-sm text-muted-foreground">{SUPPORT_EMAIL}</p></div>
          </a>
          <div className="flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-soft">
            <span className="flex size-12 items-center justify-center rounded-xl bg-secondary"><Clock /></span>
            <div><p className="font-semibold">Support hours</p><p className="text-sm text-muted-foreground">Mon–Sat, 10am – 7pm IST</p></div>
          </div>
        </div>
        <form className="space-y-4 rounded-2xl border bg-card p-7 shadow-soft" onSubmit={(e) => { e.preventDefault(); window.open(whatsappLink(SUPPORT_WHATSAPP, text), "_blank"); }}>
          <h2 className="text-2xl font-semibold">Send a message</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Your name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Restaurant</Label><Input value={form.restaurant} onChange={(e) => setForm({ ...form, restaurant: e.target.value })} /></div>
          </div>
          <div className="space-y-1.5"><Label>Message</Label><Textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="whatsapp"><MessageCircle /> Send on WhatsApp</Button>
            <Button type="button" variant="outline" asChild>
              <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Menuly enquiry")}&body=${encodeURIComponent(text)}`}><Mail /> Send by email</a>
            </Button>
          </div>
        </form>
      </section>
    </SitePage>
  );
}
