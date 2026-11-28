import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Mail,
  MessageCircle,
  Send,
  CheckCircle2,
  LifeBuoy,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  QrCode,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP, whatsappLink } from "@/lib/config";
import { usePlatformSettings } from "@/components/SiteLayout";
import { myMenuQuery } from "@/lib/restaurant";
import { useQuery } from "@tanstack/react-query";
import type { SupportTicket } from "@/routes/admin";

export const Route = createFileRoute("/_authenticated/support")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Support & Help Desk — Menuly" },
      { name: "description", content: "Submit an inquiry or report an issue with your digital QR menu." },
      { property: "og:title", content: "Support & Help Desk — Menuly" },
    ],
  }),
  component: Support,
});

function Support() {
  const { data: platformSettingsRes } = usePlatformSettings();
  const settings = platformSettingsRes?.settings;
  const whatsappNum = settings?.supportWhatsApp || SUPPORT_WHATSAPP;
  const supportEmail = settings?.supportEmail || SUPPORT_EMAIL;

  const { data } = useQuery(myMenuQuery);
  const restaurantName = data?.restaurant?.name || "Restaurant Partner";
  const restaurantSlug = data?.restaurant?.slug || "";

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<SupportTicket["category"]>("QR Code");
  const [priority, setPriority] = useState<SupportTicket["priority"]>("medium");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState(data?.restaurant?.phone || "");
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncNet = () => setIsOnline(navigator.onLine);
    syncNet();
    window.addEventListener("online", syncNet);
    window.addEventListener("offline", syncNet);
    return () => {
      window.removeEventListener("online", syncNet);
      window.removeEventListener("offline", syncNet);
    };
  }, []);

  const dishCount = data?.items?.length || 0;
  const diagnosticItems = [
    {
      label: "Live Menu Link",
      ok: Boolean(restaurantSlug),
      detail: restaurantSlug ? `/menu/${restaurantSlug}` : "Not assigned yet",
    },
    {
      label: "Published Dishes",
      ok: dishCount > 0,
      detail: dishCount > 0 ? `${dishCount} dishes synced` : "0 dishes — add or scan a menu",
    },
    {
      label: "Order Contact Number",
      ok: Boolean(data?.restaurant?.whatsapp || data?.restaurant?.phone),
      detail: data?.restaurant?.whatsapp || data?.restaurant?.phone || "Missing in Profile",
    },
    {
      label: "Network Sync",
      ok: isOnline,
      detail: isOnline ? "Online & connected to Menuly Cloud" : "Offline mode detected",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill subject and problem description");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
      const userStr = typeof window !== "undefined" ? localStorage.getItem("menuly_user") : null;
      let ownerEmail = "partner@menulyindia.online";
      try {
        if (userStr) {
          const u = JSON.parse(userStr);
          if (u?.email) ownerEmail = u.email;
        }
      } catch {}

      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          restaurantName,
          restaurantSlug,
          ownerEmail,
          ownerPhone: phone.trim() || undefined,
          category,
          subject: subject.trim(),
          description: description.trim(),
          priority,
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || "Failed to submit ticket");
      }

      const ticketId = resData.ticket.id;
      setSubmittedId(ticketId);
      toast.success(`Support Ticket #${ticketId} created! Our team will review it.`);
      setSubject("");
      setDescription("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell title="Support & Help Desk">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Ticket Submission Form */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft md:p-8">
          <div className="flex items-center gap-2.5 border-b border-border/60 pb-4">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <LifeBuoy className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold">Raise a Support Ticket</h2>
              <p className="text-xs text-muted-foreground">Submit any issue or request directly to the admin team.</p>
            </div>
          </div>

          {submittedId ? (
            <div className="my-6 rounded-2xl border border-veg/30 bg-veg/5 p-6 text-center animate-rise">
              <CheckCircle2 className="mx-auto size-12 text-veg" />
              <h3 className="mt-3 text-lg font-bold text-foreground">Ticket #{submittedId} Submitted!</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                Your ticket has been sent to our customer care team. We usually inspect and resolve issues within a few hours.
              </p>
              <div className="mt-5 flex justify-center">
                <Button size="sm" onClick={() => setSubmittedId(null)} className="shadow-soft font-semibold">
                  Submit Another Ticket
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label>Subject / Issue Title *</Label>
                <Input
                  required
                  placeholder="e.g. QR code not scanning properly or price update error"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-card px-3 text-xs"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SupportTicket["category"])}
                  >
                    <option value="QR Code">QR Code Issue</option>
                    <option value="Menu Edit">Menu & Dishes Edit</option>
                    <option value="Printing">Printing & Physical Stands</option>
                    <option value="Account">Account & Settings</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-card px-3 text-xs"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as SupportTicket["priority"])}
                  >
                    <option value="low">Low (General question)</option>
                    <option value="medium">Medium (Standard)</option>
                    <option value="high">High (Urgent meal service)</option>
                    <option value="urgent">Urgent (Live menu down)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Problem Description & Details *</Label>
                <Textarea
                  rows={4}
                  required
                  placeholder="Explain the problem in detail: what happened, what device was used, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Button type="submit" size="lg" disabled={isSubmitting} className="w-full gap-2 shadow-soft font-semibold">
                <Send className="size-4" /> {isSubmitting ? "Submitting Ticket..." : "Submit Support Ticket"}
              </Button>
            </form>
          )}
        </div>

        {/* Instant Self-Help Diagnostics & Contact Channels */}
        <div className="space-y-6">
          {/* Live Account Self-Help Diagnostic */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                <h3 className="font-display text-base font-bold">Instant Account Diagnostic</h3>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                Live Check
              </span>
            </div>
            <div className="mt-4 space-y-2.5">
              {diagnosticItems.map((d) => (
                <div
                  key={d.label}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/60 px-3.5 py-2.5 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {d.ok ? (
                      <CheckCircle2 className="size-4 text-veg shrink-0" />
                    ) : (
                      <AlertCircle className="size-4 text-amber-500 shrink-0" />
                    )}
                    <span className="font-semibold text-foreground">{d.label}</span>
                  </div>
                  <span className="truncate text-[11px] text-muted-foreground max-w-[52%] text-right">
                    {d.detail}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild className="text-xs gap-1.5">
                <Link to="/my-menu">
                  <Sparkles className="size-3.5 text-orange-500" /> Open Menu Studio
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="text-xs gap-1.5">
                <Link to="/qr">
                  <QrCode className="size-3.5 text-primary" /> Test Table QRs
                </Link>
              </Button>
            </div>
          </div>

          {/* Quick Answers / Self-Help FAQ */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft space-y-3">
            <h3 className="font-display text-base font-bold">Quick Self-Help Guides</h3>
            <div className="space-y-2 text-xs">
              <details className="group rounded-xl border border-border/60 bg-background/50 p-3">
                <summary className="cursor-pointer font-bold text-foreground list-none flex items-center justify-between">
                  <span>1. How do I backup &amp; restore my menu?</span>
                  <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  In <strong>My Menu Studio</strong>, click <strong>Backup Menu</strong> to download a JSON snapshot. Click <strong>Restore JSON</strong> anytime to merge dishes back or replace your menu cleanly.
                </p>
              </details>
              <details className="group rounded-xl border border-border/60 bg-background/50 p-3">
                <summary className="cursor-pointer font-bold text-foreground list-none flex items-center justify-between">
                  <span>2. How to use AI Menu Photo Scanner?</span>
                  <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  Take a clear well-lit photo of your printed rate card under 6MB, tap <strong>AI Menu Scanner</strong>, verify extracted categories/prices, and select Append or Replace.
                </p>
              </details>
              <details className="group rounded-xl border border-border/60 bg-background/50 p-3">
                <summary className="cursor-pointer font-bold text-foreground list-none flex items-center justify-between">
                  <span>3. Table QR scan opens an old or missing link?</span>
                  <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  If you edited your custom link slug in Profile/Dashboard, re-download or print your updated table QR cards from <strong>QR Studio</strong> so table posters match your new link.
                </p>
              </details>
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft">
            <h3 className="font-display text-base font-bold">Instant Emergency Channels</h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              If your live restaurant menu is affected during service hours, reach out instantly via WhatsApp:
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <Button variant="whatsapp" size="lg" asChild className="gap-2 shadow-soft">
                <a href={whatsappLink(whatsappNum, "Hi, I need immediate help with my Menuly menu")} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-4" /> Chat on WhatsApp
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild className="gap-2">
                <a href={`mailto:${supportEmail}`}>
                  <Mail className="size-4" /> Email {supportEmail}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
