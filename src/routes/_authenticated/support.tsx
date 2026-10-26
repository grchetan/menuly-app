import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, MessageCircle, Send, CheckCircle2, LifeBuoy, Clock, ArrowRight } from "lucide-react";
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
      let ownerEmail = "partner@menuly.app";
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

        {/* Instant Contact & Admin Portal Shortcut */}
        <div className="space-y-6">
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
