import { useEffect, useRef, useState, useMemo } from "react";
import {
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  UtensilsCrossed,
  Search,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { FullMenu, Category, MenuItem } from "@/lib/restaurant";
import { formatPrice, whatsappLink, APP_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";

export function VegMark({ veg, className }: { veg: boolean; className?: string }) {
  return (
    <span
      aria-label={veg ? "Vegetarian" : "Non-vegetarian"}
      title={veg ? "Pure Vegetarian" : "Non-Vegetarian"}
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border-[1.5px]",
        veg ? "border-veg bg-veg/5" : "border-nonveg bg-nonveg/5",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", veg ? "bg-veg" : "bg-nonveg")} />
    </span>
  );
}

/** Customer-facing menu. `compact` is used inside the dashboard live smartphone preview. */
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

  const [searchQuery, setSearchQuery] = useState("");
  const [dietFilter, setDietFilter] = useState<"all" | "veg" | "nonveg">("all");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Robust category normalization & deduplication
  const { normalizedCategories, categoryItemsMap } = useMemo(() => {
    const nameMap = new Map<string, Category>();
    const catIdToCanonicalId = new Map<string, string>();

    // Deduplicate categories by normalized (lowercase, trimmed) name
    for (const c of categories) {
      const norm = c.name.trim().toLowerCase();
      if (!nameMap.has(norm)) {
        nameMap.set(norm, c);
        catIdToCanonicalId.set(c.id, c.id);
      } else {
        const canonical = nameMap.get(norm)!;
        catIdToCanonicalId.set(c.id, canonical.id);
      }
    }

    // Map and deduplicate dishes within each canonical category
    const itemsMap = new Map<string, MenuItem[]>();
    for (const item of items) {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = (item.description || "").toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) continue;
      }

      // Diet filter
      if (dietFilter === "veg" && !item.is_veg) continue;
      if (dietFilter === "nonveg" && item.is_veg) continue;

      const canonicalId = catIdToCanonicalId.get(item.category_id) || item.category_id;
      const list = itemsMap.get(canonicalId) || [];

      // Avoid rendering identical dishes duplicated under the same category
      if (!list.some((existing) => existing.name.trim().toLowerCase() === item.name.trim().toLowerCase())) {
        list.push(item);
      }
      itemsMap.set(canonicalId, list);
    }

    // Keep only categories that have at least 1 matching item
    const validCats = Array.from(nameMap.values()).filter(
      (c) => (itemsMap.get(c.id)?.length || 0) > 0
    );

    return {
      normalizedCategories: validCats,
      categoryItemsMap: itemsMap,
    };
  }, [categories, items, searchQuery, dietFilter]);

  const [active, setActive] = useState<string>(normalizedCategories[0]?.id || "");
  const scroller = useRef<HTMLDivElement>(null);

  // Sync active category if category list changes
  useEffect(() => {
    if (!normalizedCategories.some((c) => c.id === active)) {
      setActive(normalizedCategories[0]?.id || "");
    }
  }, [normalizedCategories, active]);

  // Check scroll overflows for indicator fades
  const checkScroll = () => {
    const el = scroller.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  };

  useEffect(() => {
    checkScroll();
    const el = scroller.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [normalizedCategories]);

  // Scroll active tab into view horizontally
  useEffect(() => {
    if (!active || !scroller.current) return;
    const activeBtn = scroller.current.querySelector<HTMLElement>(`[data-cat-id="${active}"]`);
    if (activeBtn) {
      activeBtn.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [active]);

  // Intersection observer to track active category when user scrolls the page
  useEffect(() => {
    if (compact) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting);
        if (vis[0]) {
          const id = vis[0].target.id.replace("cat-", "");
          setActive(id);
        }
      },
      { rootMargin: "-100px 0px -60% 0px" },
    );
    normalizedCategories.forEach((c) => {
      const el = document.getElementById(`cat-${c.id}`);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [compact, normalizedCategories]);

  const scrollToCat = (catId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActive(catId);
    const el = document.getElementById(`cat-${catId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollNav = (direction: "left" | "right") => {
    if (!scroller.current) return;
    const offset = direction === "left" ? -150 : 150;
    scroller.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  const contact = r.whatsapp || r.phone;

  return (
    <div className={cn("bg-background text-foreground", !compact ? "min-h-screen pb-28" : "min-h-full pb-16")}>
      {/* Restaurant Header */}
      <header className={cn("bg-hero text-center transition-all border-b border-border/50", compact ? "px-3 pb-3 pt-3" : "px-4 pb-6 pt-7")}>
        <div className="mx-auto max-w-2xl animate-rise">
          {table && (
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary shadow-xs">
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

          <h1 className={cn("font-display font-bold tracking-tight text-foreground", compact ? "mt-2 text-base leading-snug" : "mt-3 text-2xl sm:text-3xl")}>
            {r.name}
          </h1>

          <div
            className={cn(
              "flex flex-wrap items-center justify-center text-muted-foreground",
              compact ? "gap-x-2 gap-y-0.5 text-[11px] mt-1" : "gap-x-4 gap-y-1 text-xs sm:text-sm mt-2"
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

          {/* Interactive Search & Diet Filter */}
          {!compact && (
            <div className="mt-4 space-y-2.5 max-w-lg mx-auto">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dishes in menu..."
                  className="w-full rounded-full border border-border/80 bg-card/90 py-2 pl-9 pr-8 text-xs sm:text-sm text-foreground shadow-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Diet Pills */}
              <div className="flex items-center justify-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setDietFilter("all")}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer",
                    dietFilter === "all"
                      ? "bg-foreground text-background shadow-xs"
                      : "bg-secondary/70 text-muted-foreground hover:text-foreground"
                  )}
                >
                  All Items
                </button>
                <button
                  type="button"
                  onClick={() => setDietFilter(dietFilter === "veg" ? "all" : "veg")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer",
                    dietFilter === "veg"
                      ? "bg-veg text-white shadow-xs"
                      : "bg-secondary/70 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="size-2 rounded-full bg-veg" />
                  Veg Only
                </button>
                <button
                  type="button"
                  onClick={() => setDietFilter(dietFilter === "nonveg" ? "all" : "nonveg")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer",
                    dietFilter === "nonveg"
                      ? "bg-nonveg text-white shadow-xs"
                      : "bg-secondary/70 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="size-2 rounded-full bg-nonveg" />
                  Non-Veg
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Horizontal Sticky Category Navigation Bar (Smooth Scroll, Never Truncated) */}
      {normalizedCategories.length > 0 && (
        <nav
          className={cn(
            "sticky top-0 z-20 border-b border-border/80 bg-background/95 backdrop-blur-md transition-all shadow-xs",
            compact ? "py-1.5" : "py-2"
          )}
        >
          <div className="relative mx-auto max-w-2xl px-2 sm:px-4">
            {/* Desktop Left Scroll Arrow */}
            {canScrollLeft && !compact && (
              <button
                type="button"
                onClick={() => scrollNav("left")}
                aria-label="Scroll categories left"
                className="absolute left-1 top-1/2 -translate-y-1/2 z-30 hidden sm:flex size-7 items-center justify-center rounded-full bg-background/90 border border-border shadow-soft text-foreground hover:bg-secondary cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>
            )}

            {/* Left fade indicator */}
            {canScrollLeft && (
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-20" />
            )}

            {/* Horizontal Pill Scroller */}
            <div
              ref={scroller}
              className={cn(
                "no-scrollbar flex items-center gap-2 overflow-x-auto scroll-smooth py-0.5",
                compact ? "gap-1.5 px-1" : "gap-2 px-1"
              )}
            >
              {normalizedCategories.map((c) => {
                const count = categoryItemsMap.get(c.id)?.length || 0;
                const isActive = active === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    data-cat-id={c.id}
                    onClick={(e) => scrollToCat(c.id, e)}
                    className={cn(
                      "shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-full font-bold transition-all duration-200 select-none cursor-pointer",
                      compact
                        ? "px-3 py-1.5 text-xs"
                        : "px-4 py-2 text-xs sm:text-sm",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/40"
                        : "bg-secondary/90 text-foreground/80 hover:bg-secondary hover:text-foreground border border-border/50"
                    )}
                  >
                    <span>{c.name}</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.2 text-[10px] font-semibold transition-colors",
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-background/80 text-muted-foreground"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right fade indicator */}
            {canScrollRight && (
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-20" />
            )}

            {/* Desktop Right Scroll Arrow */}
            {canScrollRight && !compact && (
              <button
                type="button"
                onClick={() => scrollNav("right")}
                aria-label="Scroll categories right"
                className="absolute right-1 top-1/2 -translate-y-1/2 z-30 hidden sm:flex size-7 items-center justify-center rounded-full bg-background/90 border border-border shadow-soft text-foreground hover:bg-secondary cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            )}
          </div>
        </nav>
      )}

      {/* Main Menu Dish List */}
      <main className={cn("mx-auto max-w-2xl", compact ? "px-2.5" : "px-4")}>
        {normalizedCategories.length === 0 && (
          <div className="py-16 text-center text-muted-foreground space-y-2">
            <UtensilsCrossed className="size-8 mx-auto opacity-40" />
            <p className="text-sm font-semibold">No dishes found</p>
            <p className="text-xs">Try clearing your search query or filters.</p>
          </div>
        )}

        {normalizedCategories.map((c) => {
          const catItems = categoryItemsMap.get(c.id) || [];
          return (
            <section key={c.id} id={`cat-${c.id}`} className={cn("scroll-mt-14", compact ? "pt-4" : "pt-7")}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={cn("font-display font-bold tracking-tight text-foreground", compact ? "text-sm" : "text-lg sm:text-xl")}>
                  {c.name}
                </h2>
                <span className="text-[11px] font-bold text-muted-foreground">
                  {catItems.length} {catItems.length === 1 ? "dish" : "dishes"}
                </span>
              </div>

              <ul className={cn("space-y-3", compact ? "space-y-2.5" : "space-y-3.5")}>
                {catItems.map((i) => (
                  <li
                    key={i.id}
                    className={cn(
                      "group flex items-start justify-between rounded-2xl border border-border/70 bg-card p-3 sm:p-4 shadow-soft hover:shadow-md transition-all duration-200",
                      compact ? "p-2.5 gap-2.5 rounded-xl" : "gap-4",
                      !i.available && "opacity-60 bg-muted/20"
                    )}
                  >
                    {/* Left: Dish Info */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <VegMark veg={i.is_veg ?? true} className={compact ? "size-3.5" : "size-4"} />
                        {!i.available && (
                          <span className="rounded-full bg-destructive/10 px-2 py-0.2 text-[9px] font-bold uppercase tracking-wider text-destructive">
                            Sold Out
                          </span>
                        )}
                      </div>

                      <h3 className={cn("font-bold text-foreground leading-snug group-hover:text-primary transition-colors", compact ? "text-xs font-sans" : "text-sm sm:text-base font-sans")}>
                        {i.name}
                      </h3>

                      <div className="flex items-center gap-2 pt-0.5">
                        <span className={cn("font-extrabold text-primary", compact ? "text-xs" : "text-sm sm:text-base")}>
                          {formatPrice(i.price)}
                        </span>
                      </div>

                      {i.description && (
                        <p className={cn("text-muted-foreground leading-relaxed", compact ? "text-[11px] line-clamp-2" : "text-xs sm:text-sm line-clamp-2 sm:line-clamp-3")}>
                          {i.description}
                        </p>
                      )}
                    </div>

                    {/* Right: Dish Photo */}
                    {i.image_url && (
                      <div className={cn("shrink-0 overflow-hidden rounded-xl sm:rounded-2xl border border-border/50 bg-muted shadow-xs", compact ? "size-16" : "size-20 sm:size-24")}>
                        <img
                          src={i.image_url}
                          alt={i.name}
                          loading="lazy"
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {/* Branded Footer Badge ("Powered by Menuly — Smart Digital QR Menus") */}
        <footer className={cn("text-center flex flex-col items-center justify-center gap-2", compact ? "py-6 text-[10px]" : "py-12 text-xs")}>
          <a
            href="https://menuly-app-blush.vercel.app"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/90 backdrop-blur px-3.5 py-1.5 shadow-xs hover:border-primary/50 hover:bg-card transition-all group"
          >
            <span className="flex size-4 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="size-2.5" />
            </span>
            <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
              Powered by <span className="font-bold text-primary">{APP_NAME}</span>
            </span>
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-medium">Digital QR</span>
          </a>
          <p className="text-muted-foreground/75 font-medium">
            Smart Digital QR Menus for Restaurants & Cafes
          </p>
        </footer>
      </main>

      {/* Floating Sticky Bottom Bar for Ordering/Calling */}
      {!compact && contact && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-background/95 p-3 backdrop-blur-md shadow-lift">
          <div className="mx-auto flex max-w-2xl gap-2.5">
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
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-whatsapp font-bold text-whatsapp-foreground shadow-soft hover:brightness-105 active:scale-[0.99] transition-all text-xs sm:text-sm"
              >
                <MessageCircle className="size-4 sm:size-5 shrink-0" />
                <span>WhatsApp {table ? `(Table #${table})` : "Order"}</span>
              </a>
            )}
            {r.phone && (
              <a
                href={`tel:${r.phone}`}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground shadow-soft hover:brightness-105 active:scale-[0.99] transition-all text-xs sm:text-sm"
              >
                <Phone className="size-4 sm:size-5 shrink-0" />
                <span>Call Restaurant</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
