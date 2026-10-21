import { Link } from "@tanstack/react-router";
import { Wrench, QrCode, MessageCircle, Mail, RotateCw, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { whatsappLink } from "@/lib/config";
import type { PlatformSettingsData } from "@/server/platform/service";

interface MaintenanceScreenProps {
  settings?: Partial<PlatformSettingsData> | null;
}

export function MaintenanceScreen({ settings }: MaintenanceScreenProps) {
  const whatsappNumber = settings?.supportWhatsApp || "919876543210";
  const supportEmail = settings?.supportEmail || "menulyofficial@gmail.com";

  const handleRefresh = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-hero px-4 py-8 text-foreground selection:bg-primary/20">
      {/* Decorative ambient glowing backdrops */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 size-[32rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-10 top-1/3 size-72 rounded-full bg-accent/15 blur-2xl" />
        <div className="absolute left-10 bottom-20 size-72 rounded-full bg-primary/5 blur-2xl" />
      </div>

      {/* Top Navbar Brand */}
      <header className="relative z-10 mx-auto w-full max-w-5xl flex justify-between items-center py-2">
        <Link to="/" className="transition-opacity hover:opacity-85">
          <Logo />
        </Link>

        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
          <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
          Scheduled Platform Maintenance
        </div>
      </header>

      {/* Main Content Center Card */}
      <main className="relative z-10 mx-auto my-auto w-full max-w-2xl animate-rise py-8">
        <div className="rounded-3xl border border-border/80 bg-card/95 p-6 sm:p-10 text-center shadow-lift backdrop-blur-md space-y-6">
          {/* Animated maintenance icon */}
          <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-sm ring-8 ring-amber-500/5">
            <Wrench className="size-10 animate-bounce" style={{ animationDuration: "3s" }} />
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              We're Upgrading Menuly
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Hamare servers par platform upgrades aur optimization ka kaam chal raha hai.
              Public website aur dashboard temporary pause hain taaki hum aapke liye naye features laa sakein.
            </p>
          </div>

          {/* CRITICAL REASSURANCE BANNER FOR DINERS & RESTAURANT QR MENUS */}
          <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/10 p-5 text-left text-foreground shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <QrCode className="size-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                    Restaurant QR Digital Menus Are 100% Live
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Agar aap kisi restaurant mein table par QR scan kar rahe hain, toh chinta na karein!
                  <strong className="text-foreground font-semibold"> Sabhi restaurant digital menus 24x7 bina kisi rukawat ke open honge</strong> aur customers regular order dekh sakte hain.
                </p>
              </div>
            </div>
          </div>

          {/* Live Platform Engine Status Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/60 p-3 text-left">
              <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-foreground">Digital QR Engine</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Operational (100% Live)</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/60 p-3 text-left">
              <ShieldCheck className="size-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-foreground">Platform Core & Admin</p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">Scheduled Upgrades</p>
              </div>
            </div>
          </div>

          {/* Action and Support buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              size="lg"
              onClick={handleRefresh}
              className="w-full sm:w-auto font-bold gap-2 shadow-soft"
            >
              <RotateCw className="size-4" /> Check Again / Refresh
            </Button>

            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:w-auto font-bold gap-2 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
            >
              <a
                href={whatsappLink(whatsappNumber, "Hello Menuly Support, I have a query during platform maintenance.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-4" /> WhatsApp Helpline
              </a>
            </Button>

            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:w-auto font-medium gap-2"
            >
              <a href={`mailto:${supportEmail}`}>
                <Mail className="size-4" /> Email Us
              </a>
            </Button>
          </div>

          {/* Help note */}
          <p className="text-xs text-muted-foreground pt-1">
            We apologize for the short disruption and appreciate your patience as we make Menuly even better!
          </p>
        </div>
      </main>

      {/* Footer copyright and Master Admin Gateway */}
      <footer className="relative z-10 mx-auto w-full max-w-5xl flex flex-col sm:flex-row justify-between items-center gap-2 pt-6 text-xs text-muted-foreground text-center">
        <p>&copy; {new Date().getFullYear()} Menuly. Digital QR menus for restaurants.</p>
        <div className="flex items-center gap-1.5">
          <span>Are you a platform admin?</span>
          <Link
            to="/admin"
            className="font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
          >
            Open Admin Console <ArrowRight className="size-3" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
