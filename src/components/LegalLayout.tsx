import { ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Shield,
  Scale,
  RefreshCw,
  Truck,
  Cookie,
  Printer,
  Mail,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  FileCheck,
} from "lucide-react";
import { SitePage } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { APP_NAME, SUPPORT_EMAIL, SUPPORT_WHATSAPP, whatsappLink } from "@/lib/config";
import { cn } from "@/lib/utils";

export interface LegalTocItem {
  id: string;
  title: string;
}

interface LegalLayoutProps {
  title: string;
  description: string;
  lastUpdated: string;
  readingTime?: string;
  toc?: LegalTocItem[];
  children: ReactNode;
}

const LEGAL_TABS = [
  { to: "/privacy", label: "Privacy Policy", icon: Shield },
  { to: "/terms", label: "Terms of Service", icon: Scale },
  { to: "/refund", label: "Refund & Cancellation", icon: RefreshCw },
  { to: "/shipping", label: "Shipping & Delivery", icon: Truck },
  { to: "/cookies", label: "Cookie Policy", icon: Cookie },
];

export function LegalLayout({
  title,
  description,
  lastUpdated,
  readingTime = "7 min read",
  toc = [],
  children,
}: LegalLayoutProps) {
  const location = useLocation();
  const pathname = location.pathname;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <SitePage>
      {/* ================================================================= */}
      {/* LEGAL HERO BANNER                                                 */}
      {/* ================================================================= */}
      <section className="relative overflow-hidden border-b border-border/70 bg-gradient-to-b from-card via-background to-background pt-10 pb-8 sm:pt-14 sm:pb-12">
        {/* Subtle decorative background glows */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 size-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-10 size-72 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          {/* Breadcrumb & Compliance Badge */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground mb-4">
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground">Legal & Compliance</span>
            <span>/</span>
            <span className="text-primary font-bold">{title}</span>

            <span className="ml-auto hidden sm:inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[11px] font-bold text-primary">
              <FileCheck className="size-3" /> DPDP & IT Act Compliant
            </span>
          </div>

          {/* Title & Subtitle */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-muted-foreground">
                <Building2 className="size-3.5 text-primary" /> {APP_NAME} Legal Documentation
              </div>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
                {title}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>

            {/* Print & Metadata Block */}
            <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-2 md:pt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="rounded-xl gap-2 font-bold shadow-xs bg-card hover:bg-secondary cursor-pointer"
              >
                <Printer className="size-3.5 text-primary" /> Print Document
              </Button>
              <div className="text-right text-[11px] text-muted-foreground space-y-0.5">
                <p className="flex items-center md:justify-end gap-1">
                  <Clock className="size-3 text-primary" /> Last Updated:{" "}
                  <span className="font-bold text-foreground">{lastUpdated}</span>
                </p>
                <p className="hidden sm:block">Estimated reading time: {readingTime}</p>
              </div>
            </div>
          </div>

          {/* Policy Navigation Tabs (Quick Switcher) */}
          <div className="mt-8 pt-4 border-t border-border/60">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
              Legal Policies & Statements
            </p>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {LEGAL_TABS.map((tab) => {
                const isActive = pathname === tab.to || pathname.startsWith(`${tab.to}/`);
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.to}
                    to={tab.to}
                    className={cn(
                      "inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all shrink-0",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "bg-card border border-border/70 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className="size-3.5" />
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 2-COLUMN MAIN CONTENT                                             */}
      {/* ================================================================= */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] items-start">
          
          {/* LEFT: Sticky Table of Contents & Compliance Box */}
          <aside className="hidden lg:block sticky top-24 space-y-6">
            {/* Table of Contents Box */}
            {toc.length > 0 && (
              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-primary" /> Table of Contents
                </h3>
                <nav className="space-y-1">
                  {toc.map((item, idx) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="block text-xs font-medium text-muted-foreground hover:text-primary hover:translate-x-1 transition-all py-1.5 px-2 rounded-lg hover:bg-secondary/60 leading-snug"
                    >
                      <span className="font-bold text-foreground/70 mr-1.5">{idx + 1}.</span>
                      {item.title}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* Official Entity & Grievance Card */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
                  <Shield className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Official Legal Entity</p>
                  <p className="text-[11px] text-muted-foreground">Menuly Digital Technologies</p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Operating in compliance with the Information Technology Act, 2000, and the Digital Personal Data Protection Act, 2023.
              </p>
              <div className="pt-2 border-t border-primary/10 text-[11px] space-y-1">
                <p className="font-bold text-foreground">Compliance / Grievance Officer:</p>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-primary hover:underline block font-semibold truncate"
                >
                  {SUPPORT_EMAIL}
                </a>
              </div>
            </div>

            {/* Quick Contact Box */}
            <div className="rounded-2xl border border-border/80 bg-card p-4 text-center shadow-xs space-y-2">
              <p className="text-xs font-bold text-foreground">Have Legal Queries?</p>
              <p className="text-[11px] text-muted-foreground">
                Our legal and customer support team responds within 24–48 hours.
              </p>
              <div className="pt-1 flex flex-col gap-2">
                <Button asChild size="sm" variant="outline" className="w-full text-xs font-bold gap-1.5">
                  <a href={`mailto:${SUPPORT_EMAIL}`}>
                    <Mail className="size-3.5 text-primary" /> Email Support
                  </a>
                </Button>
                <Button asChild size="sm" variant="whatsapp" className="w-full text-xs font-bold gap-1.5">
                  <a href={whatsappLink(SUPPORT_WHATSAPP, "Hi Menuly team, I have a legal/policy question.")} target="_blank" rel="noreferrer">
                    <MessageCircle className="size-3.5" /> WhatsApp Support
                  </a>
                </Button>
              </div>
            </div>
          </aside>

          {/* RIGHT: Document Article Body */}
          <main className="min-w-0">
            <article className="rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-soft">
              {children}
            </article>

            {/* Bottom Support Callout */}
            <div className="mt-8 rounded-2xl border border-border/80 bg-gradient-to-r from-secondary/40 via-card to-secondary/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="font-display text-base font-bold text-foreground flex items-center justify-center sm:justify-start gap-2">
                  <AlertCircle className="size-4 text-accent" /> Questions About Our Policies?
                </h3>
                <p className="text-xs text-muted-foreground max-w-xl">
                  If you require a custom enterprise SLA, restaurant data processing agreement (DPA), or specific compliance documentation for food aggregators, our legal team is ready to assist.
                </p>
              </div>
              <Button asChild className="shrink-0 font-bold text-xs shadow-soft rounded-xl h-10 px-4">
                <Link to="/contact">
                  Contact Legal Desk →
                </Link>
              </Button>
            </div>
          </main>
        </div>
      </section>
    </SitePage>
  );
}

// Reusable Section Helpers for clean formatting across policy pages
export function LegalSection({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number?: string | number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 py-6 border-b border-border/60 last:border-b-0 space-y-4">
      <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
        {number && (
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-extrabold shrink-0">
            {number}
          </span>
        )}
        <span>{title}</span>
      </h2>
      <div className="text-sm leading-relaxed text-muted-foreground space-y-3.5">
        {children}
      </div>
    </section>
  );
}

export function LegalCallout({
  title,
  children,
  variant = "info",
}: {
  title?: string;
  children: ReactNode;
  variant?: "info" | "warning" | "success";
}) {
  const styles = {
    info: "border-primary/25 bg-primary/5 text-foreground",
    warning: "border-accent/30 bg-accent/5 text-foreground",
    success: "border-veg/25 bg-veg/5 text-foreground",
  };

  return (
    <div className={cn("rounded-2xl border p-4 sm:p-5 my-4 space-y-1.5 shadow-xs", styles[variant])}>
      {title && (
        <p className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5 text-primary" /> {title}
        </p>
      )}
      <div className="text-xs leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}
