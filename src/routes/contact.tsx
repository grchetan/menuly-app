import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Mail,
  MessageCircle,
  Clock,
  Send,
  Star,
  CheckCircle2,
  LifeBuoy,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  Instagram,
} from "lucide-react";
import { toast } from "sonner";
import { SitePage, usePlatformSettings } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { APP_NAME, SUPPORT_EMAIL, SUPPORT_WHATSAPP, whatsappLink, INSTAGRAM_URL, FACEBOOK_URL } from "@/lib/config";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: `Contact & Support Desk — ${APP_NAME}` },
      {
        name: "description",
        content: `Contact ${APP_NAME} for technical support, report a bug, or share your valuable restaurant feedback. Our support desk responds rapidly.`,
      },
      { property: "og:title", content: `Contact & Feedback — ${APP_NAME}` },
      {
        property: "og:description",
        content: `Get in touch with ${APP_NAME} technical support or submit restaurant feedback.`,
      },
    ],
  }),
  component: ContactPage,
});

const INQUIRY_CATEGORIES = [
  "Technical Issue / Bug Report",
  "QR Code & Print Studio Help",
  "Menu Setup & Dish Configuration",
  "Account, Login & Billing Support",
  "Feature Request / Suggestion",
  "General Inquiry",
];

const FEEDBACK_TOPICS = [
  "Overall Experience",
  "QR Code Scanning Speed",
  "Digital Menu Design & UI",
  "Menu Management Dashboard",
  "Pricing & Subscription Value",
  "Customer Support Quality",
];

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: "Needs Significant Improvement",
  2: "Fair / Had Some Difficulties",
  3: "Good / Satisfactory Service",
  4: "Very Good / Smooth Experience",
  5: "Outstanding / Absolutely Loved It!",
};

function ContactPage() {
  const { data: platformSettingsRes } = usePlatformSettings();
  const settings = platformSettingsRes?.settings;
  const whatsappNum = settings?.supportWhatsApp || SUPPORT_WHATSAPP;
  const supportEmail = settings?.supportEmail || SUPPORT_EMAIL;
  const supportHours = settings?.supportHours || "Mon–Sat, 10:00 AM – 7:00 PM IST";
  const supportSlaText = settings?.supportSlaText || "All bug reports and tickets submitted via this form are dispatched directly to our priority queue and reviewed by engineers within 2 to 4 business hours.";
  const instagramUrl = settings?.instagramUrl || INSTAGRAM_URL;
  const instagramHandle = settings?.instagramHandle || "@menulyofficial";
  const facebookUrl = settings?.facebookUrl || FACEBOOK_URL;
  const facebookName = settings?.facebookName || "Menuly Official";

  const [activeTab, setActiveTab] = useState<"support" | "feedback">("support");

  // Support Form State
  const [supportForm, setSupportForm] = useState({
    name: "",
    email: "",
    phone: "",
    restaurant: "",
    category: INQUIRY_CATEGORIES[0],
    subject: "",
    message: "",
    additionalInfo: "",
    priority: "normal",
  });
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [supportSuccessTicket, setSupportSuccessTicket] = useState<string | null>(null);
  const [copiedTicket, setCopiedTicket] = useState(false);

  // Feedback Form State
  const [feedbackForm, setFeedbackForm] = useState({
    name: "",
    email: "",
    restaurant: "",
    rating: 5,
    category: FEEDBACK_TOPICS[0],
    message: "",
    recommend: true,
  });
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Submit Support Ticket
  const handleSubmitSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportForm.name.trim() || !supportForm.email.trim() || !supportForm.message.trim()) {
      toast.error("Please fill in all required fields (Name, Email, Message).");
      return;
    }

    setIsSubmittingSupport(true);
    try {
      const res = await fetch("/api/contact/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: supportForm.name.trim(),
          email: supportForm.email.trim(),
          phone: supportForm.phone.trim() || null,
          restaurantName: supportForm.restaurant.trim() || "Menuly Guest Partner",
          category: supportForm.category,
          subject: supportForm.subject.trim() || supportForm.category,
          message: supportForm.message.trim(),
          additionalInfo: supportForm.additionalInfo.trim() || null,
          priority: supportForm.priority,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit inquiry. Please try again.");
      }

      setSupportSuccessTicket(data.ticketId || `TKT-${Math.floor(1000 + Math.random() * 9000)}`);
      toast.success("Support ticket registered successfully!");
      setSupportForm({
        name: "",
        email: "",
        phone: "",
        restaurant: "",
        category: INQUIRY_CATEGORIES[0],
        subject: "",
        message: "",
        additionalInfo: "",
        priority: "normal",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  // Submit Customer Feedback
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackForm.name.trim() || !feedbackForm.message.trim()) {
      toast.error("Please provide your name and a brief feedback message.");
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const res = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: feedbackForm.name.trim(),
          email: feedbackForm.email.trim() || null,
          restaurantName: feedbackForm.restaurant.trim() || "Menuly Hospitality",
          rating: feedbackForm.rating,
          category: feedbackForm.category,
          message: feedbackForm.message.trim(),
          recommend: feedbackForm.recommend,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save feedback. Please try again.");
      }

      setFeedbackSuccess(true);
      toast.success("Thank you for your feedback!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const copyTicketId = () => {
    if (supportSuccessTicket && typeof navigator !== "undefined") {
      navigator.clipboard.writeText(supportSuccessTicket);
      setCopiedTicket(true);
      toast.success("Ticket ID copied to clipboard!");
      setTimeout(() => setCopiedTicket(false), 2000);
    }
  };

  return (
    <SitePage>
      {/* ================================================================= */}
      {/* HERO SECTION                                                      */}
      {/* ================================================================= */}
      <section className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-12 pb-6 text-center">
        {/* Subtle decorative glow */}
        <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 size-80 rounded-full bg-primary/5 blur-3xl" />

        <div className="inline-flex items-center gap-2 rounded-full bg-secondary border border-border/80 px-3.5 py-1 text-xs font-bold text-muted-foreground mb-4">
          <LifeBuoy className="size-3.5 text-primary" /> Official Helpdesk & Feedback Center
        </div>

        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
          How can we help your restaurant?
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base text-muted-foreground leading-relaxed">
          Submit technical issues, bug reports, and billing inquiries to our engineering desk, or share your valuable experience with the platform.
        </p>

        {/* Dual Tab Switcher */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center rounded-2xl bg-card border border-border/80 p-1.5 shadow-soft">
            <button
              type="button"
              onClick={() => {
                setActiveTab("support");
                setSupportSuccessTicket(null);
              }}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap",
                activeTab === "support"
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              <LifeBuoy className="size-4" />
              <span>Support & Bug Reports</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("feedback");
                setFeedbackSuccess(false);
              }}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap",
                activeTab === "feedback"
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              <Star className="size-4 text-amber-400" />
              <span>Share Feedback</span>
            </button>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 2-COLUMN MAIN CONTENT GRID                                        */}
      {/* ================================================================= */}
      <section className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 py-6 sm:py-10 md:grid-cols-[320px_minmax(0,1fr)] items-start">
        
        {/* LEFT COLUMN: Channels & Quick Contacts */}
        <aside className="space-y-4">
          <a
            href={whatsappLink(whatsappNum, "Hi Menuly team, I need support with my restaurant menu.")}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-soft"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-whatsapp text-whatsapp-foreground shadow-xs group-hover:scale-105 transition-transform">
              <MessageCircle className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-bold text-sm text-foreground">WhatsApp Support</p>
              <p className="text-xs text-muted-foreground truncate">Fastest resolution (+{whatsappNum})</p>
            </div>
          </a>

          <a
            href={`mailto:${supportEmail}?subject=Support%20Enquiry`}
            className="group flex items-center gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-soft"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs group-hover:scale-105 transition-transform">
              <Mail className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-bold text-sm text-foreground">Email Helpdesk</p>
              <p className="text-xs text-muted-foreground truncate">{supportEmail}</p>
            </div>
          </a>

          <div className="flex items-center gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
              <Clock className="size-5 text-primary" />
            </span>
            <div className="min-w-0">
              <p className="font-bold text-sm text-foreground">Operating Hours</p>
              <p className="text-xs text-muted-foreground">{supportHours}</p>
            </div>
          </div>

          {/* SLA Guarantee Box */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-primary" /> Rapid Response SLA
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {supportSlaText}
            </p>
          </div>

          {/* Social Media Links */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-3">
            <p className="text-xs font-bold text-foreground">Follow &amp; Stay Updated</p>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-3 rounded-xl p-2 -mx-2 transition-all hover:bg-secondary/60"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 via-fuchsia-500 to-amber-400 text-white shadow-xs group-hover:scale-105 transition-transform">
                <Instagram className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-sm text-foreground">Instagram</p>
                <p className="text-xs text-muted-foreground truncate">{instagramHandle}</p>
              </div>
            </a>
            <a
              href={facebookUrl}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-3 rounded-xl p-2 -mx-2 transition-all hover:bg-secondary/60"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="font-bold text-sm text-foreground">Facebook</p>
                <p className="text-xs text-muted-foreground truncate">{facebookName}</p>
              </div>
            </a>
          </div>
        </aside>

        {/* RIGHT COLUMN: Interactive Forms or Success State */}
        <main className="min-w-0">
          
          {/* ============================================================= */}
          {/* TAB 1: SUPPORT & BUG REPORT FORM                             */}
          {/* ============================================================= */}
          {activeTab === "support" && (
            <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-9 shadow-soft">
              {supportSuccessTicket ? (
                /* Success Confirmation State */
                <div className="py-8 text-center space-y-4 animate-in fade-in-50 zoom-in-95 duration-300">
                  <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-500/5">
                    <CheckCircle2 className="size-9" />
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <h2 className="font-display text-2xl font-bold text-foreground">
                      Inquiry Registered Successfully
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      Thank you! Our support engineers have received your inquiry. A confirmation has been logged with reference ID:
                    </p>
                  </div>

                  {/* Ticket Badge */}
                  <div className="inline-flex items-center gap-2 rounded-xl bg-muted/60 border border-border px-4 py-2 font-mono text-sm font-bold text-foreground shadow-xs">
                    <span>{supportSuccessTicket}</span>
                    <button
                      type="button"
                      onClick={copyTicketId}
                      className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Copy Ticket ID"
                    >
                      {copiedTicket ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    We will send reply updates to your provided email address.
                  </p>

                  <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setSupportSuccessTicket(null)}
                      className="rounded-xl font-bold text-xs h-10 px-5"
                    >
                      Submit Another Ticket
                    </Button>
                    <Button
                      asChild
                      variant="whatsapp"
                      className="rounded-xl font-bold text-xs h-10 px-5 gap-2"
                    >
                      <a
                        href={whatsappLink(
                          whatsappNum,
                          `Hi Menuly team, I just created ticket #${supportSuccessTicket}. Please check it.`
                        )}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle className="size-4" /> Expedite on WhatsApp
                      </a>
                    </Button>
                  </div>
                </div>
              ) : (
                /* Support Form Inputs */
                <form onSubmit={handleSubmitSupport} className="space-y-5">
                  <div className="border-b border-border/60 pb-3">
                    <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                      <LifeBuoy className="size-5 text-primary" /> Submit a Support Ticket
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Need help configuring your QR stands, reporting a bug, or having billing issues? Fill out the details below.
                    </p>
                  </div>

                  {/* Row 1: Name & Email */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="contactName" className="text-xs font-bold text-foreground">
                        Your Full Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="contactName"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={supportForm.name}
                        onChange={(e) => setSupportForm({ ...supportForm, name: e.target.value })}
                        className="h-11 rounded-xl text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="contactEmail" className="text-xs font-bold text-foreground">
                        Email Address for Reply <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        required
                        placeholder="rahul@restaurant.com"
                        value={supportForm.email}
                        onChange={(e) => setSupportForm({ ...supportForm, email: e.target.value })}
                        className="h-11 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  {/* Row 2: Phone & Restaurant Name */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="contactPhone" className="text-xs font-bold text-foreground">
                        Contact / WhatsApp Number <span className="text-[10px] text-muted-foreground font-normal">(optional)</span>
                      </Label>
                      <Input
                        id="contactPhone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={supportForm.phone}
                        onChange={(e) => setSupportForm({ ...supportForm, phone: e.target.value })}
                        className="h-11 rounded-xl text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="contactRest" className="text-xs font-bold text-foreground">
                        Restaurant / Business Name <span className="text-[10px] text-muted-foreground font-normal">(optional)</span>
                      </Label>
                      <Input
                        id="contactRest"
                        placeholder="e.g. Urban Tandoor Cafe"
                        value={supportForm.restaurant}
                        onChange={(e) => setSupportForm({ ...supportForm, restaurant: e.target.value })}
                        className="h-11 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  {/* Row 3: Category & Subject */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="contactCat" className="text-xs font-bold text-foreground">
                        Inquiry Category <span className="text-destructive">*</span>
                      </Label>
                      <select
                        id="contactCat"
                        value={supportForm.category}
                        onChange={(e) => setSupportForm({ ...supportForm, category: e.target.value })}
                        className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-xs sm:text-sm font-semibold truncate cursor-pointer"
                      >
                        {INQUIRY_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="contactSubject" className="text-xs font-bold text-foreground">
                        Brief Subject <span className="text-[10px] text-muted-foreground font-normal">(optional)</span>
                      </Label>
                      <Input
                        id="contactSubject"
                        placeholder="e.g. QR code not scanning in low light"
                        value={supportForm.subject}
                        onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                        className="h-11 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  {/* Row 4: Detailed Message */}
                  <div className="space-y-1.5">
                    <Label htmlFor="contactMsg" className="text-xs font-bold text-foreground">
                      Detailed Description of the Issue <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="contactMsg"
                      required
                      rows={4}
                      placeholder="Please explain the problem you're encountering, steps to reproduce, or the assistance you require..."
                      value={supportForm.message}
                      onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                      className="rounded-xl text-sm resize-y"
                    />
                  </div>

                  {/* Row 5: Additional Info / Context */}
                  <div className="space-y-1.5">
                    <Label htmlFor="contactExtra" className="text-xs font-bold text-foreground flex items-center justify-between">
                      <span>Additional Info & Technical Details</span>
                      <span className="text-[10px] text-muted-foreground font-normal">Optional</span>
                    </Label>
                    <Input
                      id="contactExtra"
                      placeholder="e.g. Device: Android Samsung S23, Chrome browser, Table #4 link"
                      value={supportForm.additionalInfo}
                      onChange={(e) => setSupportForm({ ...supportForm, additionalInfo: e.target.value })}
                      className="h-11 rounded-xl text-xs sm:text-sm"
                    />
                  </div>

                  {/* Actions & Submit */}
                  <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="size-4 text-primary shrink-0" />
                      <span>Data handled securely per our Privacy Policy</span>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmittingSupport}
                      className="w-full sm:w-auto h-11 px-7 rounded-xl font-bold text-xs sm:text-sm shadow-soft gap-2 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isSubmittingSupport ? (
                        <>
                          <RefreshCw className="size-4 animate-spin" /> Submitting Ticket...
                        </>
                      ) : (
                        <>
                          <Send className="size-4" /> Send Support Message
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* TAB 2: CUSTOMER FEEDBACK & RATING FORM                        */}
          {/* ============================================================= */}
          {activeTab === "feedback" && (
            <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-9 shadow-soft">
              {feedbackSuccess ? (
                /* Feedback Success State */
                <div className="py-8 text-center space-y-4 animate-in fade-in-50 zoom-in-95 duration-300">
                  <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 ring-8 ring-amber-500/5">
                    <Star className="size-9 fill-amber-400 text-amber-500" />
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <h2 className="font-display text-2xl font-bold text-foreground">
                      Thank You for Your Feedback!
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      Your thoughts directly guide our product roadmap and help us craft the smoothest digital menu platform for hospitality venues across India.
                    </p>
                  </div>

                  <div className="pt-4 flex justify-center">
                    <Button
                      onClick={() => {
                        setFeedbackSuccess(false);
                        setFeedbackForm({
                          name: "",
                          email: "",
                          restaurant: "",
                          rating: 5,
                          category: FEEDBACK_TOPICS[0],
                          message: "",
                          recommend: true,
                        });
                      }}
                      className="rounded-xl font-bold text-xs h-10 px-6 shadow-soft"
                    >
                      Share Another Review
                    </Button>
                  </div>
                </div>
              ) : (
                /* Feedback Form Inputs */
                <form onSubmit={handleSubmitFeedback} className="space-y-5">
                  <div className="border-b border-border/60 pb-3">
                    <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                      <Star className="size-5 fill-amber-400 text-amber-500" /> Share Restaurant Feedback
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tell us what you love, what needs improvement, or what features you would like to see next.
                    </p>
                  </div>

                  {/* Interactive Star Rating Picker */}
                  <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 text-center sm:text-left space-y-2">
                    <Label className="text-xs font-bold text-foreground block">
                      Overall Platform Rating <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isFilled = (hoverRating ?? feedbackForm.rating) >= star;
                        return (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                            className="p-1 rounded-lg hover:scale-110 active:scale-95 transition-all cursor-pointer focus:outline-none"
                            aria-label={`Rate ${star} stars`}
                          >
                            <Star
                              className={cn(
                                "size-7 sm:size-8 transition-colors",
                                isFilled
                                  ? "fill-amber-400 text-amber-500"
                                  : "text-muted-foreground/30 hover:text-muted-foreground/60"
                              )}
                            />
                          </button>
                        );
                      })}
                      <span className="ml-2 font-bold text-sm text-foreground">
                        {hoverRating ?? feedbackForm.rating} / 5
                      </span>
                    </div>
                    <p className="text-xs text-primary font-semibold">
                      {RATING_DESCRIPTIONS[hoverRating ?? feedbackForm.rating]}
                    </p>
                  </div>

                  {/* Row 1: Name & Email */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="fbName" className="text-xs font-bold text-foreground">
                        Your Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="fbName"
                        required
                        placeholder="e.g. Priya Patel"
                        value={feedbackForm.name}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                        className="h-11 rounded-xl text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="fbEmail" className="text-xs font-bold text-foreground">
                        Email Address <span className="text-[10px] text-muted-foreground font-normal">(optional)</span>
                      </Label>
                      <Input
                        id="fbEmail"
                        type="email"
                        placeholder="priya@cafe.com"
                        value={feedbackForm.email}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
                        className="h-11 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  {/* Row 2: Restaurant Name & Category */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="fbRest" className="text-xs font-bold text-foreground">
                        Restaurant / Cafe Name <span className="text-[10px] text-muted-foreground font-normal">(optional)</span>
                      </Label>
                      <Input
                        id="fbRest"
                        placeholder="e.g. Bombay Brew Bar"
                        value={feedbackForm.restaurant}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, restaurant: e.target.value })}
                        className="h-11 rounded-xl text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="fbCat" className="text-xs font-bold text-foreground">
                        Primary Topic <span className="text-destructive">*</span>
                      </Label>
                      <select
                        id="fbCat"
                        value={feedbackForm.category}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, category: e.target.value })}
                        className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-xs sm:text-sm font-semibold truncate cursor-pointer"
                      >
                        {FEEDBACK_TOPICS.map((topic) => (
                          <option key={topic} value={topic}>
                            {topic}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Feedback Message */}
                  <div className="space-y-1.5">
                    <Label htmlFor="fbMessage" className="text-xs font-bold text-foreground">
                      Your Comments & Review <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="fbMessage"
                      required
                      rows={4}
                      placeholder="What do you think of Menuly? How has it helped your business, or what can we improve?"
                      value={feedbackForm.message}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                      className="rounded-xl text-sm resize-y"
                    />
                  </div>

                  {/* Recommend Radio/Toggle */}
                  <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-foreground">Would you recommend Menuly to other restaurateurs?</p>
                      <p className="text-[11px] text-muted-foreground">Your recommendation rating helps fellow food business owners.</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setFeedbackForm({ ...feedbackForm, recommend: true })}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer",
                          feedbackForm.recommend
                            ? "bg-emerald-600 text-white shadow-soft"
                            : "bg-background border border-border text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <ThumbsUp className="size-3.5" /> Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeedbackForm({ ...feedbackForm, recommend: false })}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer",
                          !feedbackForm.recommend
                            ? "bg-destructive text-destructive-foreground shadow-soft"
                            : "bg-background border border-border text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <ThumbsDown className="size-3.5" /> Not yet
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3 border-t border-border/60 flex items-center justify-end">
                    <Button
                      type="submit"
                      disabled={isSubmittingFeedback || !feedbackForm.message.trim()}
                      className="w-full sm:w-auto h-11 px-8 rounded-xl font-bold text-xs sm:text-sm shadow-soft gap-2 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isSubmittingFeedback ? (
                        <>
                          <RefreshCw className="size-4 animate-spin" /> Submitting Review...
                        </>
                      ) : (
                        <>
                          <Star className="size-4 fill-amber-400 text-amber-500" /> Submit Feedback
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

        </main>
      </section>
    </SitePage>
  );
}
