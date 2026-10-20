import { UserPlus, Store, UtensilsCrossed, QrCode, Printer, RefreshCw } from "lucide-react";

export const steps = [
  { icon: UserPlus, title: "Create your account", text: "Sign up free with your email or Google. Takes 30 seconds." },
  { icon: Store, title: "Add restaurant details", text: "On the Dashboard, add your name, logo, phone, WhatsApp, address and timings." },
  { icon: UtensilsCrossed, title: "Build your menu", text: "In My Menu, add categories like Starters or Drinks, then add dishes with price, photo and description." },
  { icon: QrCode, title: "Design your QR code", text: "Open QR Code, choose colours and corner style. Your logo appears in the centre automatically." },
  { icon: Printer, title: "Download & print", text: "Download PNG/SVG or use Print to get a ready-made 'Scan to view menu' card for your tables." },
  { icon: RefreshCw, title: "Update anytime", text: "Price changed or dish sold out? Edit it in seconds — the same QR shows the new menu instantly." },
];

export function HowSteps({ limit }: { limit?: number }) {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {steps.slice(0, limit).map((s, i) => (
        <li key={s.title} className="group relative rounded-2xl border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift animate-rise"
          style={{ animationDelay: `${i * 70}ms` }}>
          <span className="absolute right-5 top-4 font-display text-4xl font-semibold text-secondary transition-colors group-hover:text-accent">{i + 1}</span>
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"><s.icon className="size-5" /></span>
          <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}
