import { useEffect, useRef, useState } from "react";
import { MapPin, Clock, Phone, MessageCircle, UtensilsCrossed } from "lucide-react";
import type { FullMenu } from "@/lib/restaurant";
import { formatPrice, whatsappLink, APP_NAME, SUPPORT_WHATSAPP } from "@/lib/config";
import { cn } from "@/lib/utils";

export function VegMark({ veg, className }: { veg: boolean; className?: string }) {
  return (
    <span
      aria-label={veg ? "Vegetarian" : "Non-vegetarian"}
      title={veg ? "Veg" : "Non-veg"}
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center rounded-[3px] border-2",
        veg ? "border-veg" : "border-nonveg",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", veg ? "bg-veg" : "bg-nonveg")} />
    </span>
  );
}

/** Customer-facing menu. `compact` is used inside the dashboard live preview. */
export function MenuView({
  menu,
  compact = false,
  table,
}: {
  menu: FullMenu;
  compact?: boolean;
  table?: string | undefined;
}) {
  const { restaurant: r, categories, items } = menu;
  const visibleCats = categories.filter((c) => items.some((i) => i.category_id === c.id));
  const [active, setActive] = useState(visibleCats[0]?.id);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (compact) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting);
        if (vis[0]) setActive(vis[0].target.id.replace("cat-", ""));
      },
      { rootMargin: "-120px 0px -60% 0px" },
    );
    visibleCats.forEach((c) => {
      const el = document.getElementById(`cat-${c.id}`);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [compact, visibleCats.map((c) => c.id).join()]);

  const contact = r.whatsapp || r.phone;

  const scrollToCat = (catId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActive(catId);
    const el = document.getElementById(`cat-${catId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className={cn("bg-background text-foreground", !compact ? "min-h-screen pb-28" : "min-h-full pb-16")}>
      <header className={cn("bg-hero text-center transition-all", compact ? "px-3 pb-3 pt-4" : "px-5 pb-6 pt-8")}>
        <div className="mx-auto max-w-2xl animate-rise">
          {table && (
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-xs font-bold text-primary shadow-xs">
              <span className="size-2 rounded-full bg-veg animate-pulse" />
              <span>Dining at Table #{table}</span>
            </div>
          )}
          {r.logo_url ? (
            <img
              src={r.logo_url}
              alt={`${r.name} logo`}
              className={cn(
                "mx-auto rounded-2xl border-2 border-card object-cover shadow-soft",
                compact ? "size-14" : "size-20 border-4"
              )}
            />
          ) : (
            <div
              className={cn(
                "mx-auto flex items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft",
                compact ? "size-14" : "size-20"
              )}
            >
              <UtensilsCrossed className={compact ? "size-6" : "size-8"} />
            </div>
          )}
          <h1 className={cn("font-semibold truncate", compact ? "mt-2 text-lg" : "mt-4 text-3xl sm:text-4xl")}>
            {r.name}
          </h1>
          <div
            className={cn(
              "flex flex-wrap items-center justify-center text-muted-foreground",
              compact ? "gap-x-2 gap-y-0.5 text-[11px] mt-1" : "gap-x-4 gap-y-1 text-sm mt-3"
            )}
          >
            {r.address && (
              <span className="inline-flex items-center gap-1">
                <MapPin className={compact ? "size-3" : "size-3.5"} />
                {r.address}
              </span>
            )}
            {r.hours && (
              <span className="inline-flex items-center gap-1">
                <Clock className={compact ? "size-3" : "size-3.5"} />
                {r.hours}
              </span>
            )}
          </div>
        </div>
      </header>

      {visibleCats.length > 0 && (
        <nav
          className={cn(
            "z-20 border-b bg-background/95 backdrop-blur sticky top-0",
            compact ? "shadow-xs" : ""
          )}
        >
          <div
            ref={scroller}
            className={cn(
              "no-scrollbar mx-auto flex max-w-2xl gap-1.5 overflow-x-auto",
              compact ? "px-2.5 py-2" : "px-4 py-3 gap-2"
            )}
          >
            {visibleCats.map((c) => (
              <a
                key={c.id}
                href={`#cat-${c.id}`}
                onClick={(e) => scrollToCat(c.id, e)}
                className={cn(
                  "shrink-0 rounded-full font-bold transition-colors whitespace-nowrap",
                  compact ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm",
                  active === c.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-secondary text-secondary-foreground hover:bg-muted"
                )}
              >
                {c.name}
              </a>
            ))}
          </div>
        </nav>
      )}

      <main className={cn("mx-auto max-w-2xl", compact ? "px-2.5" : "px-4")}>
        {visibleCats.length === 0 && (
          <p className="py-12 text-center text-xs text-muted-foreground">The menu is being prepared. Check back soon!</p>
        )}
        {visibleCats.map((c) => (
          <section key={c.id} id={`cat-${c.id}`} className={cn("scroll-mt-14", compact ? "pt-4" : "pt-7")}>
            <h2 className={cn("font-bold tracking-tight", compact ? "mb-2 text-sm text-foreground/80" : "mb-3 text-xl font-semibold")}>
              {c.name}
            </h2>
            <ul className={cn("space-y-2.5", compact ? "space-y-2" : "space-y-3")}>
              {items
                .filter((i) => i.category_id === c.id)
                .map((i) => (
                  <li
                    key={i.id}
                    className={cn(
                      "flex rounded-xl border bg-card shadow-soft transition-transform",
                      compact ? "p-2.5 gap-2.5" : "p-3 gap-4 rounded-2xl",
                      !i.available && "opacity-60 bg-muted/20"
                    )}
                  >
                    <div className="min-w-0 flex-1 py-0.5">
                      {!i.available && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-destructive">
                            Sold out
                          </span>
                        </div>
                      )}
                      <h3 className={cn("font-bold leading-snug text-foreground", compact ? "text-xs font-sans" : "text-base font-sans")}>
                        {i.name}
                      </h3>
                      <p className={cn("font-extrabold text-primary", compact ? "mt-0.5 text-xs" : "mt-1 text-sm font-semibold")}>
                        {formatPrice(i.price)}
                      </p>
                      {i.description && (
                        <p className={cn("text-muted-foreground mt-0.5", compact ? "text-[11px] line-clamp-2" : "text-sm line-clamp-3")}>
                          {i.description}
                        </p>
                      )}
                    </div>
                    {i.image_url && (
                      <img
                        src={i.image_url}
                        alt={i.name}
                        loading="lazy"
                        className={cn(
                          "shrink-0 rounded-lg object-cover border border-border/40",
                          compact ? "size-16" : "size-24 rounded-xl sm:size-28"
                        )}
                      />
                    )}
                  </li>
                ))}
            </ul>
          </section>
        ))}
        {!compact && (
          <footer className="py-10 text-center text-xs text-muted-foreground">
            Menu by {APP_NAME} ·{" "}
            <a className="underline" href={whatsappLink(SUPPORT_WHATSAPP, "Hi, I need help with a menu")} target="_blank" rel="noreferrer">
              Support
            </a>
          </footer>
        )}
      </main>

      {!compact && contact && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 backdrop-blur">
          <div className="mx-auto flex max-w-2xl gap-2">
            {r.whatsapp && (
              <a
                href={whatsappLink(
                  r.whatsapp,
                  table
                    ? `Hi ${r.name}! I am at Table ${table} and viewing your digital menu.`
                    : `Hi ${r.name}! I am viewing your digital menu.`
                )}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-whatsapp font-semibold text-whatsapp-foreground shadow-soft"
              >
                <MessageCircle className="size-5" /> WhatsApp {table ? `(Table #${table})` : "Order"}
              </a>
            )}
            {r.phone && (
              <a
                href={`tel:${r.phone}`}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground shadow-soft"
              >
                <Phone className="size-5" /> Call us
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
