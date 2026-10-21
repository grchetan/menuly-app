import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import {
  Wrench,
  QrCode,
  MessageCircle,
  Mail,
  RotateCw,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedQR } from "@/components/AnimatedQR";
import { APP_NAME, whatsappLink } from "@/lib/config";
import type { PlatformSettingsData } from "@/server/platform/service";

interface MaintenanceScreenProps {
  settings?: Partial<PlatformSettingsData> | null;
}

export function MaintenanceScreen({ settings }: MaintenanceScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const whatsappNumber = settings?.supportWhatsApp || "919876543210";
  const supportEmail = settings?.supportEmail || "menulyofficial@gmail.com";

  const handleRefresh = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  // Interactive Ambient Canvas Particle Animation (Matching Menuly Warm Theme)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Particle nodes
    const particleCount = Math.min(Math.floor((width * height) / 22000), 55);
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      alpha: number;
      pulseSpeed: number;
    }> = [];

    // Warm Menuly Palette: Pine Green & Amber Gold
    const colors = [
      "rgba(30, 71, 56, ", // Menuly Forest Pine Green
      "rgba(217, 119, 6, ", // Warm Amber Gold
      "rgba(245, 158, 11, ", // Warm Saffron Accent
    ];

    const defaultColor = colors[0]!;
    for (let i = 0; i < particleCount; i++) {
      const chosenColor = colors[Math.floor(Math.random() * colors.length)] ?? defaultColor;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2.5 + 1.2,
        color: chosenColor,
        alpha: Math.random() * 0.4 + 0.15,
        pulseSpeed: Math.random() * 0.02 + 0.005,
      });
    }

    // Interactive mouse tracker
    let mouse = { x: -1000, y: -1000, radius: 120 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      // Update and draw particles
      for (const p of particles) {
        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges smoothly
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Mouse gentle repulsion
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          p.x += Math.cos(angle) * force * 1.5;
          p.y += Math.sin(angle) * force * 1.5;
        }

        // Pulse alpha
        const currentAlpha = p.alpha + Math.sin(tick * p.pulseSpeed) * 0.1;

        // Draw node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.max(0.05, Math.min(currentAlpha, 0.6))})`;
        ctx.fill();
      }

      // Connect nearby nodes with delicate constellation lines
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        if (!p1) continue;
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          if (!p2) continue;
          const cdx = p1.x - p2.x;
          const cdy = p1.y - p2.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);

          if (cdist < 110) {
            const lineAlpha = (1 - cdist / 110) * 0.12;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(180, 140, 90, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-hero px-4 py-6 sm:py-8 text-foreground selection:bg-primary/20 overflow-hidden">
      {/* Interactive HTML5 Canvas Animation Layer */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-0 h-full w-full"
        style={{ opacity: 0.85 }}
      />

      {/* Decorative ambient gradients matching Menuly theme */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-10 -translate-x-1/2 size-[32rem] rounded-full bg-accent/15 blur-3xl" />
        <div className="absolute right-10 top-1/4 size-72 rounded-full bg-primary/10 blur-2xl" />
        <div className="absolute left-10 bottom-20 size-80 rounded-full bg-accent/10 blur-2xl" />
      </div>

      {/* Top Navbar Brand */}
      <header className="relative z-10 mx-auto w-full max-w-5xl flex justify-between items-center py-2">
        <Link to="/" className="group flex items-center gap-2 rounded-2xl px-2 py-1.5 transition-all">
          <span className="relative size-9 overflow-hidden rounded-xl transition-transform duration-500 group-hover:scale-110 shadow-xs">
            <AnimatedQR className="!rounded-xl !p-1 !shadow-none" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">{APP_NAME}</span>
        </Link>

        <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-card/80 px-3.5 py-1 text-xs font-bold text-accent-foreground backdrop-blur-md shadow-xs">
          <span className="size-2 rounded-full bg-primary animate-pulse" />
          Scheduled Maintenance
        </div>
      </header>

      {/* Main Center Card */}
      <main className="relative z-10 mx-auto my-auto w-full max-w-xl animate-rise py-6 sm:py-8">
        <div className="rounded-3xl border border-border/80 bg-card/95 p-6 sm:p-10 text-center shadow-lift backdrop-blur-md space-y-6">
          {/* Animated maintenance badge */}
          <div className="mx-auto flex size-18 sm:size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-soft ring-8 ring-primary/5">
            <Wrench className="size-9 sm:size-10 animate-bounce" style={{ animationDuration: "3s" }} />
          </div>

          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-0.5 text-xs font-semibold text-primary">
              <Sparkles className="size-3" /> Platform Optimization & Infrastructure Upgrades
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              We're Upgrading Menuly
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
              Our core infrastructure is undergoing scheduled performance improvements and database maintenance.
              Public pages and the management dashboard will be back online shortly.
            </p>
          </div>

          {/* CRITICAL REASSURANCE BANNER FOR DINERS & RESTAURANT QR MENUS */}
          <div className="rounded-2xl border-2 border-veg/30 bg-veg/5 p-4 sm:p-5 text-left text-foreground shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-veg/15 text-veg">
                <QrCode className="size-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-veg animate-pulse" />
                  <h3 className="text-xs sm:text-sm font-bold text-veg uppercase tracking-wider">
                    Restaurant QR Menus Are 100% Operational
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Are you seated at a cafe or restaurant?{" "}
                  <strong className="text-foreground font-semibold">
                    Diners scanning table QR codes have 24/7 uninterrupted access
                  </strong>{" "}
                  to digital menus, dishes, and prices. Our digital menu engine remains fully online.
                </p>
              </div>
            </div>
          </div>

          {/* Live System Engine Status Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-background/80 p-3.5 text-left">
              <CheckCircle2 className="size-5 text-veg shrink-0" />
              <div>
                <p className="text-xs font-bold text-foreground">Digital QR Menus</p>
                <p className="text-[11px] text-veg font-semibold">100% Operational & Live</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-background/80 p-3.5 text-left">
              <ShieldCheck className="size-5 text-accent-foreground shrink-0" />
              <div>
                <p className="text-xs font-bold text-foreground">Platform Core</p>
                <p className="text-[11px] text-accent-foreground font-semibold">Upgrades in Progress</p>
              </div>
            </div>
          </div>

          {/* Action Buttons Matching Menuly Design */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              size="lg"
              onClick={handleRefresh}
              className="w-full sm:w-auto font-bold gap-2 shadow-soft bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <RotateCw className="size-4" /> Check Again / Refresh
            </Button>

            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:w-auto font-bold gap-2 border-veg/40 text-veg hover:bg-veg/10"
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
              className="w-full sm:w-auto font-medium gap-2 text-muted-foreground hover:text-foreground"
            >
              <a href={`mailto:${supportEmail}`}>
                <Mail className="size-4" /> Email Support
              </a>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground pt-1">
            We appreciate your patience while we make Menuly even better!
          </p>
        </div>
      </main>

      {/* Footer copyright and Master Admin Gateway */}
      <footer className="relative z-10 mx-auto w-full max-w-5xl flex flex-col sm:flex-row justify-between items-center gap-2 pt-6 text-xs text-muted-foreground text-center">
        <p>&copy; {new Date().getFullYear()} {APP_NAME}. Digital QR menus for restaurants.</p>
        <div className="flex items-center gap-1.5">
          <span>Platform administrator?</span>
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
