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
  WifiOff,
  Flame,
  TrendingUp,
  Moon,
  Sun,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Check,
  CheckCircle2,
  Share2,
} from "lucide-react";
import type { FullMenu, Category, MenuItem } from "@/lib/restaurant";
import { formatPrice, whatsappLink, APP_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function VegMark({ veg: _veg, className: _className }: { veg?: boolean; className?: string }) {
  return null;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
}

/** Customer-facing digital menu with Luxury Culinary UI, Best Sellers, Recommended Carousel & Live Order Drawer. */
export function MenuView({
  menu,
  compact = false,
  table,
  isOfflineCache = false,
  cachedDate,
}: {
  menu: FullMenu;
  compact?: boolean;
  table?: string | undefined;
  isOfflineCache?: boolean;
  cachedDate?: string | null;
}) {
  const { restaurant: r, categories, items } = menu;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Dark Mode Theme Toggle
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDark(document.documentElement.classList.contains("dark"));
    }
  }, []);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    if (typeof window !== "undefined") {
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  // Live Order Cart State ("View order" feature)
  const [cart, setCart] = useState<Record<string, OrderItem>>({});
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false);
  const [isShowSlipModalOpen, setIsShowSlipModalOpen] = useState(false);

  // Dish Detail Bottom Sheet State
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const [dishDetailQty, setDishDetailQty] = useState(1);

  useEffect(() => {
    if (selectedDish) {
      setDishDetailQty(cart[selectedDish.id]?.quantity || 1);
    }
  }, [selectedDish, cart]);

  const addToCart = (dish: MenuItem, quantity = 1) => {
    if (!dish.available) return;
    setCart((prev) => {
      const existing = prev[dish.id];
      const newQty = (existing?.quantity || 0) + quantity;
      return {
        ...prev,
        [dish.id]: {
          id: dish.id,
          name: dish.name,
          price: dish.price,
          quantity: newQty,
          imageUrl: dish.image_url,
        },
      };
    });
    toast.success(`Added ${quantity}x ${dish.name} to order!`);
  };

  const updateCartQty = (dishId: string, delta: number) => {
    setCart((prev) => {
      const existing = prev[dishId];
      if (!existing) return prev;
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[dishId];
        return copy;
      }
      return {
        ...prev,
        [dishId]: { ...existing, quantity: newQty },
      };
    });
  };

  const cartItems = useMemo(() => Object.values(cart).filter((it) => it.quantity > 0), [cart]);
  const totalItemsCount = useMemo(() => cartItems.reduce((acc, it) => acc + it.quantity, 0), [cartItems]);
  const totalBill = useMemo(() => cartItems.reduce((acc, it) => acc + it.price * it.quantity, 0), [cartItems]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateOnline = () => setIsOffline(!navigator.onLine);
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  // Robust category normalization & deduplication
  const { normalizedCategories, categoryItemsMap } = useMemo(() => {
    const nameMap = new Map<string, Category>();
    const catIdToCanonicalId = new Map<string, string>();

    // Deduplicate categories by normalized name
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

    // Map dishes
    const itemsMap = new Map<string, MenuItem[]>();
    for (const item of items) {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = (item.description || "").toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) continue;
      }

      const canonicalId = catIdToCanonicalId.get(item.category_id) || item.category_id;
      const list = itemsMap.get(canonicalId) || [];

      if (!list.some((existing) => existing.name.trim().toLowerCase() === item.name.trim().toLowerCase())) {
        list.push(item);
      }
      itemsMap.set(canonicalId, list);
    }

    // Keep only categories with at least 1 matching item
    const validCats = Array.from(nameMap.values()).filter(
      (c) => (itemsMap.get(c.id)?.length || 0) > 0
    );

    return {
      normalizedCategories: validCats,
      categoryItemsMap: itemsMap,
    };
  }, [categories, items, searchQuery]);

  const scroller = useRef<HTMLDivElement>(null);

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

  const scrollToCat = (catId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedCategory(catId);
    if (catId === "all") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
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

  // Best Sellers (Highlighting 2 popular dishes)
  const availableItems = useMemo(() => items.filter((it) => it.available), [items]);
  const todayBestSeller = useMemo(() => availableItems[0] || null, [availableItems]);
  const monthBestSeller = useMemo(() => availableItems[1] || availableItems[0] || null, [availableItems]);

  // Recommended carousel items (prefer items with high-res photos)
  const recommendedDishes = useMemo(() => {
    const withPhotos = availableItems.filter((it) => Boolean(it.image_url));
    if (withPhotos.length >= 3) return withPhotos.slice(0, 8);
    return availableItems.slice(0, 8);
  }, [availableItems]);

  // Cover image for the hero card
  const heroCoverPhoto =
    r.logo_url ||
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80";

  const contact = r.whatsapp || r.phone;

  // Filtered categories to display based on selected pill
  const categoriesToRender = useMemo(() => {
    if (selectedCategory === "all") return normalizedCategories;
    return normalizedCategories.filter((c) => c.id === selectedCategory);
  }, [selectedCategory, normalizedCategories]);

  return (
    <div className={cn("bg-background text-foreground transition-colors duration-200", !compact ? "min-h-screen pb-32" : "min-h-full pb-20")}>
      {/* Offline Alert Banner */}
      {(isOfflineCache || isOffline) && !compact && (
        <div className="bg-amber-500/10 border-b border-amber-500/25 px-4 py-2.5 text-center">
          <div className="mx-auto max-w-2xl flex items-center justify-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <WifiOff className="size-4 shrink-0 text-amber-600 dark:text-amber-400 animate-pulse" />
            <span>
              {isOfflineCache
                ? `Offline Mode Active • Loaded from device memory${cachedDate ? ` (saved ${cachedDate})` : ""}. Fully functional without internet.`
                : "Offline Mode • Internet disconnected. Browsing continues smoothly from device cache."}
            </span>
          </div>
        </div>
      )}

      {/* TOP HEADER: Restaurant Logo, Name, Hours & Theme Toggle Button */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/40 py-2.5 px-4">
        <div className="mx-auto max-w-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {r.logo_url ? (
              <img
                src={r.logo_url}
                alt={r.name}
                className="size-10 sm:size-11 rounded-full object-cover border-2 border-orange-500/30 shadow-xs shrink-0"
              />
            ) : (
              <div className="size-10 sm:size-11 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                {r.name.slice(0, 1)}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-serif font-bold text-base sm:text-lg text-foreground tracking-tight truncate leading-tight">
                {r.name}
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Open now</span>
                <span className="text-muted-foreground/60">•</span>
                <span className="truncate">{r.hours ? r.hours.replace(/Mon–Sun,\s*/i, "") : "11:00–23:00"}</span>
              </div>
            </div>
          </div>

          {/* Right Action: Dark Mode Theme Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {table && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 border border-orange-500/30 px-2.5 py-0.5 text-[11px] font-bold text-orange-600 dark:text-orange-400">
                Table #{table}
              </span>
            )}
            <button
              type="button"
              onClick={toggleDark}
              aria-label="Toggle dark theme"
              className="size-9 rounded-full border border-border/80 bg-card flex items-center justify-center text-foreground hover:bg-secondary transition-colors shadow-xs cursor-pointer"
            >
              {isDark ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-foreground/80" />}
            </button>
          </div>
        </div>
      </header>

      {/* HERO COVER BANNER CARD */}
      <div className="mx-auto max-w-2xl px-4 mt-3">
        <div className="relative h-48 sm:h-60 w-full rounded-3xl overflow-hidden shadow-soft border border-border/60 group">
          <img
            src={heroCoverPhoto}
            alt={r.name}
            className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Subtle bottom-to-top luxury vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/5" />

          {table && (
            <div className="absolute top-3.5 right-3.5 bg-black/60 backdrop-blur-md border border-white/20 text-white font-bold text-xs px-3.5 py-1 rounded-full shadow-xs">
              🍽️ Table #{table}
            </div>
          )}

          <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
            <p className="font-medium text-xs sm:text-sm text-white/95 drop-shadow-sm line-clamp-1">
              Pure Indian vegetarian kitchen &amp; dine-in
            </p>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-white/80 font-medium drop-shadow-sm">
              <MapPin className="size-3.5 text-orange-400 shrink-0" />
              <span className="truncate">{r.address || "Dine-in, Takeaway & Table Service"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BEST SELLERS SECTION (Today & Month's Best Seller Cards) */}
      {!searchQuery && availableItems.length > 0 && (
        <section className="mx-auto max-w-2xl px-4 mt-4 space-y-3">
          {todayBestSeller && (
            <div
              onClick={() => setSelectedDish(todayBestSeller)}
              className="group flex items-center gap-3.5 rounded-2xl border border-orange-500/35 bg-card/95 p-3.5 shadow-xs hover:border-orange-500/60 hover:shadow-soft transition-all duration-200 cursor-pointer"
            >
              {todayBestSeller.image_url ? (
                <img
                  src={todayBestSeller.image_url}
                  alt={todayBestSeller.name}
                  className="size-16 sm:size-20 rounded-xl object-cover shrink-0 border border-border/70 group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="size-16 sm:size-20 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center text-2xl shrink-0">
                  🍲
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-0.5">
                  <Flame className="size-3.5 fill-orange-500 text-orange-500" /> TODAY'S BEST SELLER
                </span>
                <h3 className="font-bold text-sm sm:text-base text-foreground truncate group-hover:text-orange-600 transition-colors">
                  {todayBestSeller.name}
                </h3>
                <p className="font-extrabold text-sm sm:text-base text-orange-600 dark:text-orange-400 mt-0.5">
                  {formatPrice(todayBestSeller.price)}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(todayBestSeller);
                }}
                className="shrink-0 rounded-xl border-orange-500/40 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 font-bold text-xs h-9 px-3 gap-1"
              >
                <Plus className="size-3.5" /> Add
              </Button>
            </div>
          )}

          {monthBestSeller && monthBestSeller.id !== todayBestSeller?.id && (
            <div
              onClick={() => setSelectedDish(monthBestSeller)}
              className="group flex items-center gap-3.5 rounded-2xl border border-orange-500/35 bg-card/95 p-3.5 shadow-xs hover:border-orange-500/60 hover:shadow-soft transition-all duration-200 cursor-pointer"
            >
              {monthBestSeller.image_url ? (
                <img
                  src={monthBestSeller.image_url}
                  alt={monthBestSeller.name}
                  className="size-16 sm:size-20 rounded-xl object-cover shrink-0 border border-border/70 group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="size-16 sm:size-20 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center text-2xl shrink-0">
                  🍲
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-0.5">
                  <TrendingUp className="size-3.5 text-orange-500" /> THIS MONTH'S BEST SELLER
                </span>
                <h3 className="font-bold text-sm sm:text-base text-foreground truncate group-hover:text-orange-600 transition-colors">
                  {monthBestSeller.name}
                </h3>
                <p className="font-extrabold text-sm sm:text-base text-orange-600 dark:text-orange-400 mt-0.5">
                  {formatPrice(monthBestSeller.price)}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(monthBestSeller);
                }}
                className="shrink-0 rounded-xl border-orange-500/40 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 font-bold text-xs h-9 px-3 gap-1"
              >
                <Plus className="size-3.5" /> Add
              </Button>
            </div>
          )}
        </section>
      )}

      {/* RECOMMENDED FOR YOU HORIZONTAL CAROUSEL */}
      {!searchQuery && recommendedDishes.length > 0 && (
        <section className="mx-auto max-w-2xl px-4 mt-6">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-3">
            <Sparkles className="size-3.5 text-orange-500" /> RECOMMENDED FOR YOU
          </div>

          <div className="flex gap-3.5 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
            {recommendedDishes.map((dish) => (
              <div
                key={dish.id}
                onClick={() => setSelectedDish(dish)}
                className="group w-44 sm:w-48 shrink-0 rounded-2xl border border-border/70 bg-card p-2.5 shadow-xs hover:shadow-soft hover:border-orange-500/40 transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="h-28 w-full rounded-xl overflow-hidden bg-muted border border-border/50 relative">
                    {dish.image_url ? (
                      <img
                        src={dish.image_url}
                        alt={dish.name}
                        className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center text-3xl">🍲</div>
                    )}
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-foreground mt-2 truncate group-hover:text-orange-600 transition-colors">
                    {dish.name}
                  </h4>
                </div>
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/40">
                  <span className="font-extrabold text-xs sm:text-sm text-foreground/90">
                    {formatPrice(dish.price)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(dish);
                    }}
                    className="size-7 rounded-lg bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors shadow-xs"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SEARCH BAR & CATEGORY PILLS (STICKY SUB-HEADER) */}
      <div className="sticky top-[58px] z-20 bg-background/95 backdrop-blur-md pt-3 pb-2 border-b border-border/60 transition-all mt-4">
        {/* Search Bar Input */}
        <div className="mx-auto max-w-2xl px-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes..."
              className="w-full rounded-full border border-border/80 bg-secondary/50 py-2.5 pl-10 pr-9 text-xs sm:text-sm text-foreground shadow-xs placeholder:text-muted-foreground focus:bg-card focus:border-orange-500 focus:outline-none transition-all"
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
        </div>

        {/* Horizontal Category Filter Pills */}
        {normalizedCategories.length > 0 && (
          <div className="relative mx-auto max-w-2xl px-2 sm:px-4 mt-2.5">
            {canScrollLeft && !compact && (
              <button
                type="button"
                onClick={() => scrollNav("left")}
                aria-label="Scroll left"
                className="absolute left-1 top-1/2 -translate-y-1/2 z-30 hidden sm:flex size-7 items-center justify-center rounded-full bg-background border border-border shadow-soft text-foreground hover:bg-secondary cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>
            )}

            <div
              ref={scroller}
              className="no-scrollbar flex items-center gap-2 overflow-x-auto scroll-smooth py-1 px-2"
            >
              {/* "All" Category Pill */}
              <button
                type="button"
                onClick={(e) => scrollToCat("all", e)}
                className={cn(
                  "shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-full font-bold transition-all duration-200 select-none cursor-pointer px-4 py-1.5 text-xs sm:text-sm",
                  selectedCategory === "all"
                    ? "bg-orange-500 text-white shadow-xs ring-1 ring-orange-500/40"
                    : "bg-secondary text-foreground/80 hover:bg-secondary/80 border border-border/50"
                )}
              >
                All
              </button>

              {normalizedCategories.map((c) => {
                const count = categoryItemsMap.get(c.id)?.length || 0;
                const isCatActive = selectedCategory === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    data-cat-id={c.id}
                    onClick={(e) => scrollToCat(c.id, e)}
                    className={cn(
                      "shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-full font-bold transition-all duration-200 select-none cursor-pointer px-4 py-1.5 text-xs sm:text-sm",
                      isCatActive
                        ? "bg-orange-500 text-white shadow-xs ring-1 ring-orange-500/40"
                        : "bg-secondary text-foreground/80 hover:bg-secondary/80 border border-border/50"
                    )}
                  >
                    <span>{c.name}</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.2 text-[10px] font-semibold transition-colors",
                        isCatActive ? "bg-white/20 text-white" : "bg-background/80 text-muted-foreground"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {canScrollRight && !compact && (
              <button
                type="button"
                onClick={() => scrollNav("right")}
                aria-label="Scroll right"
                className="absolute right-1 top-1/2 -translate-y-1/2 z-30 hidden sm:flex size-7 items-center justify-center rounded-full bg-background border border-border shadow-soft text-foreground hover:bg-secondary cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* DISH ITEMS LIST (Grouped by Category) */}
      <main className={cn("mx-auto max-w-2xl", compact ? "px-2.5" : "px-4")}>
        {categoriesToRender.length === 0 && (
          <div className="py-16 text-center text-muted-foreground space-y-2">
            <UtensilsCrossed className="size-8 mx-auto opacity-40 text-orange-500" />
            <p className="text-sm font-semibold">No dishes found</p>
            <p className="text-xs">Try clearing your search query or filters.</p>
          </div>
        )}

        {categoriesToRender.map((c) => {
          const catItems = categoryItemsMap.get(c.id) || [];
          return (
            <section key={c.id} id={`cat-${c.id}`} className="pt-6 scroll-mt-36">
              <div className="flex items-baseline justify-between mb-3 border-b border-border/40 pb-2">
                <h2 className="font-serif font-bold text-xl sm:text-2xl text-foreground tracking-tight">
                  {c.name}
                </h2>
                <span className="text-xs font-bold text-muted-foreground">
                  {catItems.length} {catItems.length === 1 ? "dish" : "dishes"}
                </span>
              </div>

              <div className="space-y-3.5">
                {catItems.map((i) => {
                  const inCartQty = cart[i.id]?.quantity || 0;
                  return (
                    <div
                      key={i.id}
                      onClick={() => setSelectedDish(i)}
                      className={cn(
                        "group flex items-start justify-between rounded-2xl border border-border/70 bg-card p-3.5 sm:p-4 shadow-xs hover:shadow-soft hover:border-orange-500/40 transition-all duration-200 cursor-pointer",
                        !i.available && "opacity-60 bg-muted/20"
                      )}
                    >
                      {/* Left: Dish Details */}
                      <div className="min-w-0 flex-1 space-y-1 pr-3">
                        {!i.available && (
                          <span className="inline-block rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider mb-0.5">
                            Out of stock
                          </span>
                        )}

                        <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug group-hover:text-orange-600 transition-colors">
                          {i.name}
                        </h3>

                        <p className="font-extrabold text-sm sm:text-base text-orange-600 dark:text-orange-400">
                          {formatPrice(i.price)}
                        </p>

                        {i.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            {i.description}
                          </p>
                        )}
                      </div>

                      {/* Right: Dish Photo & Add Button */}
                      <div className="flex flex-col items-center gap-2 shrink-0">
                        {i.image_url ? (
                          <div className="size-20 sm:size-24 rounded-2xl overflow-hidden border border-border/60 bg-muted shadow-xs">
                            <img
                              src={i.image_url}
                              alt={i.name}
                              loading="lazy"
                              className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="size-20 sm:size-24 rounded-2xl bg-secondary border border-border/60 flex items-center justify-center text-3xl">
                            🍲
                          </div>
                        )}

                        {/* Quantity in Cart or Add Button */}
                        {i.available && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1"
                          >
                            {inCartQty > 0 ? (
                              <div className="flex items-center gap-1.5 rounded-full bg-orange-500/10 border border-orange-500/40 px-2 py-0.5 shadow-xs">
                                <button
                                  type="button"
                                  onClick={() => updateCartQty(i.id, -1)}
                                  className="size-5 rounded-full bg-card text-orange-600 flex items-center justify-center font-bold hover:bg-orange-500 hover:text-white transition-colors"
                                >
                                  <Minus className="size-3" />
                                </button>
                                <span className="font-black text-xs text-orange-600 dark:text-orange-400 w-4 text-center">
                                  {inCartQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateCartQty(i.id, 1)}
                                  className="size-5 rounded-full bg-card text-orange-600 flex items-center justify-center font-bold hover:bg-orange-500 hover:text-white transition-colors"
                                >
                                  <Plus className="size-3" />
                                </button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addToCart(i)}
                                className="h-7 px-3 text-xs font-bold rounded-xl border-orange-500/40 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 gap-1"
                              >
                                <Plus className="size-3" /> Add
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Footer Branding Badge */}
        <footer className={cn("text-center flex flex-col items-center justify-center gap-2", compact ? "py-6 text-[10px]" : "py-12 text-xs")}>
          <a
            href="https://menuly-app-blush.vercel.app"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/90 backdrop-blur px-3.5 py-1.5 shadow-xs hover:border-orange-500/50 hover:bg-card transition-all group"
          >
            <span className="flex size-4 items-center justify-center rounded-full bg-orange-500/15 text-orange-600">
              <Sparkles className="size-2.5" />
            </span>
            <span className="font-semibold text-foreground group-hover:text-orange-600 transition-colors">
              Powered by <span className="font-bold text-orange-600">{APP_NAME}</span>
            </span>
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-medium">Digital QR</span>
          </a>
          <p className="text-muted-foreground/75 font-medium">
            Smart Digital QR Menus for Restaurants &amp; Cafes
          </p>
        </footer>
      </main>

      {/* DISH DETAIL BOTTOM SHEET MODAL (AS IN USER SCREENSHOT 2) */}
      <Dialog open={Boolean(selectedDish)} onOpenChange={(open) => !open && setSelectedDish(null)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-t-3xl sm:rounded-3xl border-border/80 bg-card max-h-[92vh] flex flex-col">
          {selectedDish && (
            <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
              {/* Dish Photo Header with Top-Right Close Button */}
              <div className="relative h-60 sm:h-64 w-full bg-muted shrink-0">
                {selectedDish.image_url ? (
                  <img
                    src={selectedDish.image_url}
                    alt={selectedDish.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="size-full flex items-center justify-center text-6xl bg-secondary">
                    🍲
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedDish(null)}
                  className="absolute top-3.5 right-3.5 size-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition-colors shadow-soft cursor-pointer z-10"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Content Body */}
              <div className="p-5 sm:p-6 space-y-3.5 flex-1">
                <div>
                  <h3 className="font-serif font-bold text-2xl text-foreground tracking-tight leading-snug">
                    {selectedDish.name}
                  </h3>
                  <p className="font-extrabold text-xl text-orange-600 dark:text-orange-400 mt-1">
                    {formatPrice(selectedDish.price)}
                  </p>
                </div>

                {selectedDish.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedDish.description}
                  </p>
                )}

                {/* Badges Row: Availability & Prep Time */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      selectedDish.available
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {selectedDish.available ? "In stock" : "Out of stock"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                    <Clock className="size-3.5 text-orange-500" /> 5–10 min
                  </span>
                </div>

                {/* Bottom Action Section: Quantity Counter & Add to Order */}
                {selectedDish.available && (
                  <div className="pt-4 border-t border-border/60 flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-xl bg-secondary p-1 border border-border/60">
                      <button
                        type="button"
                        onClick={() => setDishDetailQty((q) => Math.max(1, q - 1))}
                        className="size-8 rounded-lg bg-card text-foreground flex items-center justify-center font-bold hover:bg-secondary transition-colors"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-6 text-center font-bold text-sm text-foreground">
                        {dishDetailQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDishDetailQty((q) => q + 1)}
                        className="size-8 rounded-lg bg-card text-foreground flex items-center justify-center font-bold hover:bg-secondary transition-colors"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>

                    <Button
                      onClick={() => {
                        addToCart(selectedDish, dishDetailQty);
                        setSelectedDish(null);
                      }}
                      className="flex-1 h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-soft gap-2"
                    >
                      <ShoppingBag className="size-4" />
                      Add to Order • {formatPrice(selectedDish.price * dishDetailQty)}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* FLOATING SOLID ORANGE "VIEW ORDER" BAR (AS IN USER SCREENSHOT 1) */}
      {!compact && totalItemsCount > 0 && (
        <aside className="fixed inset-x-0 bottom-4 z-40 px-4 animate-in slide-in-from-bottom duration-300 pointer-events-none">
          <div
            onClick={() => setIsOrderDrawerOpen(true)}
            className="mx-auto max-w-lg bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-bold rounded-2xl shadow-xl flex items-center justify-between p-3.5 sm:p-4 transition-all duration-200 cursor-pointer pointer-events-auto"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-xl bg-white/20 text-white font-black text-xs">
                {totalItemsCount}
              </span>
              <span className="text-sm font-bold tracking-wide">View order</span>
            </div>
            <span className="text-base sm:text-lg font-black tracking-tight">
              {formatPrice(totalBill)}
            </span>
          </div>
        </aside>
      )}

      {/* ORDER SUMMARY DRAWER MODAL */}
      <Dialog open={isOrderDrawerOpen} onOpenChange={setIsOrderDrawerOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-t-3xl sm:rounded-3xl border-border/80 bg-card max-h-[88vh] flex flex-col">
          <DialogHeader className="p-4 sm:p-5 border-b border-border/60 pb-3">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="size-5 text-orange-500" />
                <span className="font-serif font-bold text-lg text-foreground">Your Order Summary</span>
              </div>
              {table && (
                <span className="rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 px-2.5 py-0.5 text-xs font-bold">
                  Table #{table}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Cart Items List */}
          <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 no-scrollbar divide-y divide-border/50">
            {cartItems.map((it) => (
              <div key={it.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-foreground truncate">{it.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatPrice(it.price)} each • <span className="font-bold text-foreground">{formatPrice(it.price * it.quantity)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-1.5 rounded-full bg-secondary p-1 border border-border/60 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateCartQty(it.id, -1)}
                    className="size-6 rounded-full bg-card text-foreground flex items-center justify-center font-bold hover:bg-orange-500 hover:text-white transition-colors"
                  >
                    <Minus className="size-3" />
                  </button>
                  <span className="w-5 text-center font-bold text-xs text-foreground">
                    {it.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCartQty(it.id, 1)}
                    className="size-6 rounded-full bg-card text-foreground flex items-center justify-center font-bold hover:bg-orange-500 hover:text-white transition-colors"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bill Summary & Actions */}
          <div className="p-4 sm:p-5 border-t border-border/60 bg-secondary/30 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Subtotal ({totalItemsCount} items)</span>
              <span className="font-extrabold text-foreground">{formatPrice(totalBill)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Taxes &amp; Service</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Included</span>
            </div>
            <div className="flex items-center justify-between text-base font-extrabold border-t border-border/50 pt-2 text-foreground">
              <span>Grand Total</span>
              <span className="text-lg text-orange-600 dark:text-orange-400">{formatPrice(totalBill)}</span>
            </div>

            {/* Ordering Options */}
            <div className="pt-2 space-y-2">
              {r.whatsapp && (
                <Button
                  asChild
                  className="w-full h-11 rounded-xl bg-whatsapp hover:bg-whatsapp/90 text-whatsapp-foreground font-bold text-sm shadow-soft gap-2"
                >
                  <a
                    href={whatsappLink(
                      r.whatsapp,
                      `Hi *${r.name}*!\nI would like to order from Table #${table || "Dine-In"}:\n\n${cartItems
                        .map((it) => `• ${it.quantity}x ${it.name} - ${formatPrice(it.price * it.quantity)}`)
                        .join("\n")}\n\n*Total Bill: ${formatPrice(totalBill)}*`
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="size-4" /> Send Order on WhatsApp
                  </a>
                </Button>
              )}

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsShowSlipModalOpen(true)}
                  className="flex-1 h-10 rounded-xl text-xs font-bold border-border"
                >
                  Show Slip to Server
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setCart({});
                    setIsOrderDrawerOpen(false);
                    toast.info("Order cleared");
                  }}
                  className="h-10 text-xs text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* SHOW SLIP TO SERVER MODAL (Dine-in Waiter Order Card) */}
      <Dialog open={isShowSlipModalOpen} onOpenChange={setIsShowSlipModalOpen}>
        <DialogContent className="sm:max-w-sm rounded-3xl border-border bg-card p-6 text-center space-y-4">
          <div className="size-12 rounded-full bg-orange-500/10 text-orange-600 mx-auto flex items-center justify-center font-bold">
            🍽️
          </div>
          <div>
            <h3 className="font-serif font-bold text-xl text-foreground">Table Order Slip</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Show this to your server or at the billing counter</p>
          </div>

          <div className="rounded-2xl border border-dashed border-border p-4 bg-secondary/30 text-left space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-border/50 text-xs font-bold">
              <span>{r.name}</span>
              <span className="text-orange-600">Table #{table || "Dine-In"}</span>
            </div>
            {cartItems.map((it) => (
              <div key={it.id} className="flex justify-between text-xs">
                <span>
                  <strong>{it.quantity}x</strong> {it.name}
                </span>
                <span className="font-semibold">{formatPrice(it.price * it.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 border-t border-border/50 text-sm font-extrabold text-foreground">
              <span>Total Bill</span>
              <span className="text-orange-600">{formatPrice(totalBill)}</span>
            </div>
          </div>

          <Button
            onClick={() => setIsShowSlipModalOpen(false)}
            className="w-full rounded-xl bg-primary text-primary-foreground font-bold text-xs h-10"
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>

      {/* Contact Bar when Cart is Empty */}
      {!compact && contact && totalItemsCount === 0 && (
        <aside className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-background/95 p-3 backdrop-blur-md shadow-lift">
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
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-whatsapp font-bold text-whatsapp-foreground shadow-soft hover:brightness-105 active:scale-[0.99] transition-all text-xs sm:text-sm"
              >
                <MessageCircle className="size-4 shrink-0" />
                <span>WhatsApp {table ? `(Table #${table})` : "Order"}</span>
              </a>
            )}
            {r.phone && (
              <a
                href={`tel:${r.phone}`}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground shadow-soft hover:brightness-105 active:scale-[0.99] transition-all text-xs sm:text-sm"
              >
                <Phone className="size-4 shrink-0" />
                <span>Call Restaurant</span>
              </a>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
