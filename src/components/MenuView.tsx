import { useEffect, useRef, useState, useMemo, useCallback } from "react";
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
  Printer,
  FileText,
  CookingPot,
  Edit2,
  RefreshCw,
  User,
  Bell,
  BellRing,
  UserCheck,
  Droplets,
  ReceiptText,
  History,
  MessageSquareQuote,
} from "lucide-react";
import type { FullMenu, Category, MenuItem } from "@/lib/restaurant";
import { formatPrice, whatsappLink, APP_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getSmartDishImageUrl } from "@/lib/dish-images";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getOptimizedBannerUrl } from "@/lib/banner-presets";
import { printReceipt } from "@/lib/receipt-printer";

export function VegMark({ veg = true, className }: { veg?: boolean; className?: string }) {
  const isVeg = veg !== false;
  return (
    <span
      className={cn(
        "size-3.5 rounded-xs border-2 shrink-0 inline-flex items-center justify-center p-0.5",
        isVeg
          ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30"
          : "border-rose-600 bg-rose-50/50 dark:bg-rose-950/30",
        className
      )}
      title={isVeg ? "Pure Vegetarian" : "Non-Vegetarian"}
    >
      <span
        className={cn(
          "size-1.5 rounded-full shrink-0",
          isVeg ? "bg-emerald-600" : "bg-rose-600"
        )}
      />
    </span>
  );
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
  onThemeChange,
}: {
  menu: FullMenu;
  compact?: boolean;
  table?: string | undefined;
  isOfflineCache?: boolean;
  cachedDate?: string | null;
  onThemeChange?: (isDark: boolean) => void;
}) {
  const { restaurant: r, categories, items } = menu;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Scoped Dark Mode for Customer Menu ONLY (Never affects main website/dashboard)
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("menuly_menu_theme") === "dark";
      } catch {
        return false;
      }
    }
    return false;
  });

  const toggleDark = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("menuly_menu_theme", next ? "dark" : "light");
        } catch {}
      }
      onThemeChange?.(next);
      return next;
    });
  };

  // Live Order Cart State ("View order" feature) — Cached in localStorage for zero loss on refresh
  const [cart, setCart] = useState<Record<string, OrderItem>>(() => {
    if (typeof window !== "undefined" && r?.slug) {
      try {
        const stored = localStorage.getItem(`menuly_cart_${r.slug}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === "object") return parsed;
        }
      } catch {}
    }
    return {};
  });

  useEffect(() => {
    if (typeof window !== "undefined" && r?.slug) {
      try {
        if (Object.keys(cart).length > 0) {
          localStorage.setItem(`menuly_cart_${r.slug}`, JSON.stringify(cart));
        } else {
          localStorage.removeItem(`menuly_cart_${r.slug}`);
        }
      } catch {}
    }
  }, [cart, r?.slug]);

  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false);
  const [isShowSlipModalOpen, setIsShowSlipModalOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Table & Dine-in Details
  const getInitialTable = (): string => {
    if (table && String(table).trim()) return String(table).trim();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlTable = params.get("table") || params.get("t") || params.get("tableNumber") || params.get("table_number");
      if (urlTable && urlTable.trim()) return urlTable.trim();
      const lastTable = localStorage.getItem(`menuly_last_table_${r.slug}`);
      if (lastTable && lastTable.trim()) return lastTable.trim();
    }
    return "1";
  };

  const [activeTableNumber, setActiveTableNumber] = useState<string>(getInitialTable);

  // Synchronize immediately whenever table prop or URL query parameter changes
  useEffect(() => {
    let currentTable = table ? String(table).trim() : null;
    if (!currentTable && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlTable = params.get("table") || params.get("t") || params.get("tableNumber") || params.get("table_number");
      if (urlTable && urlTable.trim()) currentTable = urlTable.trim();
    }
    if (currentTable) {
      setActiveTableNumber(currentTable);
      if (typeof window !== "undefined") {
        localStorage.setItem(`menuly_last_table_${r.slug}`, currentTable);
      }
    }
  }, [table, r.slug]);

  const [isEditingTable, setIsEditingTable] = useState(false);
  const [dinerName, setDinerName] = useState(() => {
    return typeof window !== "undefined" ? localStorage.getItem("menuly_diner_name") || "" : "";
  });
  const [dinerPhone, setDinerPhone] = useState(() => {
    return typeof window !== "undefined" ? localStorage.getItem("menuly_diner_phone") || "" : "";
  });
  const [cookingNotes, setCookingNotes] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Placed Order tracking & Table History (Retains all rounds placed by diner during this session)
  const [orderHistory, setOrderHistory] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(`menuly_order_history_${r.slug}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (o) => Date.now() - new Date(o.createdAt).getTime() < 12 * 60 * 60 * 1000
          );
        }
      }
    } catch {}
    return [];
  });

  const [activeOrder, setActiveOrder] = useState<any>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(`menuly_active_order_${r.slug}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - new Date(parsed.createdAt).getTime() < 8 * 60 * 60 * 1000) {
          return parsed;
        }
      }
    } catch {}
    return null;
  });

  const [isFloatingDismissed, setIsFloatingDismissed] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [viewingReceiptOrder, setViewingReceiptOrder] = useState<any | null>(null);

  const syncOrderWithHistory = useCallback((updatedOrder: any) => {
    if (!updatedOrder?.id) return;
    setOrderHistory((prev) => {
      const exists = prev.some((o) => o.id === updatedOrder.id);
      const next = exists
        ? prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
        : [updatedOrder, ...prev];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`menuly_order_history_${r.slug}`, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  }, [r.slug]);

  const handleDismissFloatingBar = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsFloatingDismissed(true);
  };

  // Real-time Order Tracking Polling (syncs live kitchen status e.g. PREPARING -> SERVED -> COMPLETED)
  useEffect(() => {
    if (!activeOrder?.id) return;
    if (activeOrder.status === "COMPLETED" || activeOrder.status === "CANCELLED") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/track?orderId=${encodeURIComponent(activeOrder.id)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.order) {
            setActiveOrder(data.order);
            syncOrderWithHistory(data.order);
            if (typeof window !== "undefined") {
              localStorage.setItem(`menuly_active_order_${r.slug}`, JSON.stringify(data.order));
            }
          }
        }
      } catch {
        // Silently ignore polling hiccups
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [activeOrder?.id, activeOrder?.status, r.slug, syncOrderWithHistory]);

  // Auto-dismiss floating banner 12s after completion/cancellation so it doesn't disturb menu browsing
  useEffect(() => {
    if (!activeOrder) return undefined;
    if (activeOrder.status === "COMPLETED" || activeOrder.status === "CANCELLED") {
      const timer = setTimeout(() => {
        setIsFloatingDismissed(true);
      }, 12000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [activeOrder?.status]);

  // Service & Waiter Call States
  const [isCallWaiterOpen, setIsCallWaiterOpen] = useState(false);
  const [callReason, setCallReason] = useState<"waiter" | "water" | "bill" | "cutlery">("waiter");
  const [callNotes, setCallNotes] = useState("");
  const [isCallingWaiter, setIsCallingWaiter] = useState(false);
  const [waiterCallSuccess, setWaiterCallSuccess] = useState<string | null>(null);

  const handleCallWaiter = async () => {
    setIsCallingWaiter(true);
    try {
      const targetTable = (activeTableNumber || table || "1").trim();
      const res = await fetch("/api/public/service-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: r.id,
          slug: r.slug,
          tableNumber: targetTable,
          reason: callReason,
          customNotes: callNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to notify staff");
      }
      const label =
        callReason === "water"
          ? "Drinking Water"
          : callReason === "bill"
          ? "Bill & Payment"
          : callReason === "cutlery"
          ? "Cutlery & Tissues"
          : "Staff / Waiter";
      setWaiterCallSuccess(`${label} requested for Table #${targetTable}! Staff notified.`);
      toast.success(`Waiter alerted for Table #${targetTable}!`);
      setTimeout(() => {
        setIsCallWaiterOpen(false);
        setWaiterCallSuccess(null);
        setCallNotes("");
      }, 2400);
    } catch (err: any) {
      toast.error(err.message || "Failed to call waiter. Please try again.");
    } finally {
      setIsCallingWaiter(false);
    }
  };

  const handlePlaceDineInOrder = async () => {
    if (cartItems.length === 0) return;
    const finalTable = (activeTableNumber || table || "1").trim();
    if (!finalTable) {
      toast.error("Please specify your Table Number");
      return;
    }

    const cleanName = dinerName.trim();
    if (!cleanName) {
      toast.error("Please enter your name so the kitchen knows who ordered.");
      return;
    }

    const cleanDigits = dinerPhone.replace(/\D/g, "");
    if (cleanDigits.length < 10) {
      toast.error("Please enter a valid 10-digit contact mobile number.");
      return;
    }

    setIsPlacingOrder(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("menuly_diner_name", cleanName);
        localStorage.setItem("menuly_diner_phone", dinerPhone.trim());
        localStorage.setItem(`menuly_last_table_${r.slug}`, finalTable);
      }

      const res = await fetch("/api/orders/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: r.id,
          slug: r.slug,
          tableNumber: finalTable,
          customerName: cleanName,
          customerPhone: dinerPhone.trim(),
          notes: cookingNotes.trim() || undefined,
          items: cartItems.map((c) => ({
            id: c.id,
            name: c.name,
            price: c.price,
            quantity: c.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit order to kitchen");
      }

      const order = data.order;
      setActiveOrder(order);
      setIsFloatingDismissed(false);
      syncOrderWithHistory(order);
      if (typeof window !== "undefined") {
        localStorage.setItem(`menuly_active_order_${r.slug}`, JSON.stringify(order));
      }
      setCart({});
      setIsOrderDrawerOpen(false);
      setViewingReceiptOrder(order);
      setIsReceiptOpen(true);
      toast.success(`Order ${order.orderNumber} sent to kitchen for Table #${finalTable}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to place order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

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

  // Cover image for the hero card (priority: restaurant custom cover_url -> ambient dining banner, NEVER the logo)
  const heroCoverPhoto = getOptimizedBannerUrl(
    (r as any).cover_url,
    r.slug || r.name,
    1200
  );

  const contact = r.whatsapp || r.phone;

  // Filtered categories to display based on selected pill
  const categoriesToRender = useMemo(() => {
    if (selectedCategory === "all") return normalizedCategories;
    return normalizedCategories.filter((c) => c.id === selectedCategory);
  }, [selectedCategory, normalizedCategories]);

  return (
    <div
      className={cn(
        "menuly-menu-scope transition-colors duration-200 font-sans",
        isDark ? "dark menuly-menu-dark bg-[#0d0f12] text-[#f3f4f6]" : "bg-background text-foreground",
        !compact ? "min-h-screen pb-32" : "min-h-full pb-20"
      )}
    >
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

      {/* TOP HEADER: Restaurant Identity & Customer Actions */}
      <header
        className={cn(
          "sticky top-0 z-30 backdrop-blur-md border-b transition-colors",
          isDark ? "bg-[#0d0f12]/95 border-[#232834]" : "bg-background/95 border-border/40",
          compact ? "py-2 px-3" : "py-2 px-3 sm:py-2.5 sm:px-4"
        )}
      >
        <div className="mx-auto max-w-2xl flex items-center justify-between gap-2 sm:gap-3">
          {/* Left: Brand Identity & Table Info (No blinking live circles) */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {r.logo_url ? (
              <img
                src={r.logo_url}
                alt={r.name}
                className={cn(
                  "rounded-2xl object-cover border border-border/70 shadow-xs shrink-0",
                  compact ? "size-8.5" : "size-9 sm:size-11"
                )}
              />
            ) : (
              <div
                className={cn(
                  "rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0",
                  compact ? "size-8.5 text-xs" : "size-9 sm:size-11 text-xs sm:text-base"
                )}
              >
                {r.name.slice(0, 1)}
              </div>
            )}
            <div className="min-w-0 flex-1 overflow-hidden">
              <h1
                className={cn(
                  "font-serif font-black text-foreground tracking-tight truncate leading-tight",
                  compact ? "text-xs sm:text-sm" : "text-sm sm:text-base md:text-lg"
                )}
                title={r.name}
              >
                {r.name}
              </h1>
              
              {/* Clean Subtitle: Table # & Dining Mode */}
              {(table || activeTableNumber) ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingTable(true);
                    setIsOrderDrawerOpen(true);
                  }}
                  className="flex items-center gap-1 text-[10.5px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer truncate mt-0.5"
                  title="Tap to change table"
                >
                  <span className="font-bold text-orange-600 dark:text-orange-400">
                    Table #{activeTableNumber || table}
                  </span>
                  <span className="text-muted-foreground/60">•</span>
                  <span className="truncate">Dine-in</span>
                </button>
              ) : (
                <p className="text-[10.5px] text-muted-foreground truncate mt-0.5">
                  {r.address || "Dine-in & Table Service"}
                </p>
              )}
            </div>
          </div>

          {/* Right: Minimalist Luxury Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Orders & History Drawer Button */}
            {orderHistory.length > 0 && (
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(true)}
                className={cn(
                  "relative items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 active:scale-95 transition-all shadow-2xs cursor-pointer",
                  compact ? "flex size-8 justify-center shrink-0" : "flex size-8.5 sm:size-auto sm:px-3 sm:py-1.5 justify-center shrink-0 text-xs font-bold"
                )}
                title="View active and previous orders placed at this table"
              >
                <ReceiptText className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                {!compact && <span className="hidden sm:inline">Orders</span>}
                <span className={cn(
                  "flex items-center justify-center rounded-full bg-emerald-600 text-white font-black",
                  compact
                    ? "absolute -top-1 -right-1 size-4 text-[9px] ring-2 ring-background"
                    : "size-4 sm:size-auto sm:px-1.5 text-[9px] sm:text-[10px]"
                )}>
                  {orderHistory.length}
                </span>
              </button>
            )}

            {/* Call Waiter / Service Bell Button */}
            <button
              type="button"
              onClick={() => setIsCallWaiterOpen(true)}
              className={cn(
                "items-center gap-1.5 rounded-full border border-border/70 bg-secondary/80 hover:bg-secondary text-foreground active:scale-95 transition-all shadow-2xs cursor-pointer",
                compact ? "flex size-8 justify-center shrink-0" : "flex size-8.5 sm:size-auto sm:px-3 sm:py-1.5 justify-center shrink-0 text-xs font-bold"
              )}
              title="Call waiter or request water / bill"
            >
              <BellRing className="size-3.5 text-amber-500 hover:text-amber-600 transition-colors shrink-0" />
              {!compact && <span className="hidden sm:inline">Call Waiter</span>}
            </button>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleDark}
              aria-label="Toggle dark theme"
              className={cn(
                "flex items-center justify-center rounded-full border border-border/70 bg-secondary/80 hover:bg-secondary text-foreground active:scale-95 transition-all shadow-2xs cursor-pointer shrink-0",
                compact ? "size-8" : "size-8.5 sm:size-9"
              )}
            >
              {isDark ? (
                <Sun className={compact ? "size-3.5 text-amber-400" : "size-4 text-amber-400"} />
              ) : (
                <Moon className={compact ? "size-3.5 text-foreground/80" : "size-4 text-foreground/80"} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* HERO COVER BANNER CARD */}
      <div className={cn("mx-auto max-w-2xl", compact ? "px-2.5 mt-2.5" : "px-4 mt-3")}>
        <div
          className={cn(
            "relative w-full overflow-hidden shadow-soft border border-border/60 group",
            compact ? "h-36 rounded-2xl" : "h-48 sm:h-60 rounded-3xl"
          )}
        >
          <img
            src={heroCoverPhoto}
            alt={r.name}
            className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Subtle bottom-to-top luxury vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

          {table && (
            <div
              className={cn(
                "absolute bg-black/60 backdrop-blur-md border border-white/20 text-white font-bold rounded-full shadow-xs flex items-center gap-1",
                compact ? "top-2.5 right-2.5 text-[10px] px-2.5 py-0.5" : "top-3.5 right-3.5 text-xs px-3.5 py-1"
              )}
            >
              <UtensilsCrossed className="size-3 text-orange-400" /> Table #{table}
            </div>
          )}

          <div
            className={cn(
              "absolute text-white",
              compact ? "bottom-2.5 left-2.5 right-2.5 space-y-0.5" : "bottom-4 left-4 right-4 space-y-1"
            )}
          >
            {r.hours && (
              <p className={cn("font-semibold text-white/95 drop-shadow-sm line-clamp-1", compact ? "text-xs" : "text-xs sm:text-sm")}>
                {r.hours}
              </p>
            )}
            <div className={cn("flex items-center gap-1.5 text-white/85 font-medium drop-shadow-sm", compact ? "text-[10px]" : "text-[11px] sm:text-xs")}>
              <MapPin className={cn("text-orange-400 shrink-0", compact ? "size-3" : "size-3.5")} />
              <span className="truncate">{r.address || "Dine-in, Takeaway & Table Service"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BEST SELLERS SECTION (Today & Month's Best Seller Cards) */}
      {!searchQuery && availableItems.length > 0 && (
        <section className={cn("mx-auto max-w-2xl", compact ? "px-2.5 mt-3 space-y-2.5" : "px-4 mt-4 space-y-3")}>
          {todayBestSeller && (
            <div
              onClick={() => setSelectedDish(todayBestSeller)}
              className={cn(
                "group flex items-center border border-orange-500/35 bg-card/95 shadow-xs hover:border-orange-500/60 hover:shadow-soft transition-all duration-200 cursor-pointer",
                compact ? "p-2.5 gap-2.5 rounded-xl" : "p-3.5 gap-3.5 rounded-2xl"
              )}
            >
              {(() => {
                const img = todayBestSeller.image_url || getSmartDishImageUrl(todayBestSeller.name, null, todayBestSeller.is_veg);
                return (
                  <img
                    src={img}
                    alt={todayBestSeller.name}
                    className={cn(
                      "object-cover shrink-0 border border-border/70 group-hover:scale-105 transition-transform",
                      compact ? "size-12 rounded-lg" : "size-16 sm:size-20 rounded-xl"
                    )}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = getSmartDishImageUrl(todayBestSeller.name, null, todayBestSeller.is_veg);
                    }}
                  />
                );
              })()}
              <div className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 mb-0.5">
                  <Flame className={cn("fill-orange-500 text-orange-500 shrink-0", compact ? "size-3" : "size-3.5")} />
                  <span
                    className={cn(
                      "font-black uppercase tracking-wider whitespace-nowrap truncate",
                      compact ? "text-[10px]" : "text-[11px]"
                    )}
                  >
                    {compact ? "Best Seller" : "Today's Best Seller"}
                  </span>
                </span>
                <h3
                  className={cn(
                    "font-bold text-foreground truncate group-hover:text-orange-600 transition-colors",
                    compact ? "text-xs sm:text-sm" : "text-sm sm:text-base"
                  )}
                >
                  {todayBestSeller.name}
                </h3>
                <p
                  className={cn(
                    "font-extrabold text-orange-600 dark:text-orange-400 mt-0.5",
                    compact ? "text-xs" : "text-sm sm:text-base"
                  )}
                >
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
                className={cn(
                  "shrink-0 border-orange-500/40 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 font-bold gap-1",
                  compact ? "h-7 px-2.5 text-[11px] rounded-lg" : "h-9 px-3 text-xs rounded-xl"
                )}
              >
                <Plus className="size-3" /> Add
              </Button>
            </div>
          )}

          {monthBestSeller && monthBestSeller.id !== todayBestSeller?.id && (
            <div
              onClick={() => setSelectedDish(monthBestSeller)}
              className={cn(
                "group flex items-center border border-orange-500/35 bg-card/95 shadow-xs hover:border-orange-500/60 hover:shadow-soft transition-all duration-200 cursor-pointer",
                compact ? "p-2.5 gap-2.5 rounded-xl" : "p-3.5 gap-3.5 rounded-2xl"
              )}
            >
              {(() => {
                const img = monthBestSeller.image_url || getSmartDishImageUrl(monthBestSeller.name, null, monthBestSeller.is_veg);
                return (
                  <img
                    src={img}
                    alt={monthBestSeller.name}
                    className={cn(
                      "object-cover shrink-0 border border-border/70 group-hover:scale-105 transition-transform",
                      compact ? "size-12 rounded-lg" : "size-16 sm:size-20 rounded-xl"
                    )}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = getSmartDishImageUrl(monthBestSeller.name, null, monthBestSeller.is_veg);
                    }}
                  />
                );
              })()}
              <div className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 mb-0.5">
                  <TrendingUp className={cn("text-orange-500 shrink-0", compact ? "size-3" : "size-3.5")} />
                  <span
                    className={cn(
                      "font-black uppercase tracking-wider whitespace-nowrap truncate",
                      compact ? "text-[10px]" : "text-[11px]"
                    )}
                  >
                    {compact ? "Monthly Top" : "This Month's Best Seller"}
                  </span>
                </span>
                <h3
                  className={cn(
                    "font-bold text-foreground truncate group-hover:text-orange-600 transition-colors",
                    compact ? "text-xs sm:text-sm" : "text-sm sm:text-base"
                  )}
                >
                  {monthBestSeller.name}
                </h3>
                <p
                  className={cn(
                    "font-extrabold text-orange-600 dark:text-orange-400 mt-0.5",
                    compact ? "text-xs" : "text-sm sm:text-base"
                  )}
                >
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
                className={cn(
                  "shrink-0 border-orange-500/40 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 font-bold gap-1",
                  compact ? "h-7 px-2.5 text-[11px] rounded-lg" : "h-9 px-3 text-xs rounded-xl"
                )}
              >
                <Plus className="size-3" /> Add
              </Button>
            </div>
          )}
        </section>
      )}

      {/* SEARCH BAR & CATEGORY PILLS (STICKY SUB-HEADER) */}
      <div
        className={cn(
          "sticky z-20 backdrop-blur-md pt-2 pb-2 border-b transition-colors mt-3",
          compact ? "top-[44px]" : "top-[48px] sm:top-[58px]",
          isDark ? "bg-[#0d0f12]/98 border-[#232834]" : "bg-background/98 border-border/60"
        )}
      >
        {/* Search Bar Input */}
        <div className={cn("mx-auto max-w-2xl", compact ? "px-2.5" : "px-4")}>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes..."
              className={cn(
                "w-full rounded-full border py-2 pl-10 pr-9 text-xs sm:text-sm shadow-xs placeholder:text-muted-foreground focus:outline-none transition-all",
                isDark
                  ? "border-[#232834] bg-[#1a1e26] text-[#f3f4f6] focus:bg-[#15181e] focus:border-orange-500"
                  : "border-border/80 bg-secondary/50 text-foreground focus:bg-card focus:border-orange-500"
              )}
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
          <div className={cn("relative mx-auto max-w-2xl mt-2.5", compact ? "px-1.5" : "px-2 sm:px-4")}>
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
              className="no-scrollbar flex items-center gap-1.5 sm:gap-2 overflow-x-auto scroll-smooth py-1 px-1.5 sm:px-2"
            >
              {/* "All" Category Pill */}
              <button
                type="button"
                onClick={(e) => scrollToCat("all", e)}
                className={cn(
                  "shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-full font-bold transition-all duration-200 select-none cursor-pointer",
                  compact ? "px-2.5 py-0.5 text-xs" : "px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm",
                  selectedCategory === "all"
                    ? "bg-orange-500 text-white shadow-xs ring-1 ring-orange-500/40"
                    : isDark
                      ? "bg-[#1a1e26] text-[#e5e7eb] hover:bg-[#202530] border border-[#232834]"
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
                      "shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-full font-bold transition-all duration-200 select-none cursor-pointer",
                      compact ? "px-2.5 py-0.5 text-xs" : "px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm",
                      isCatActive
                        ? "bg-orange-500 text-white shadow-xs ring-1 ring-orange-500/40"
                        : isDark
                          ? "bg-[#1a1e26] text-[#e5e7eb] hover:bg-[#202530] border border-[#232834]"
                          : "bg-secondary text-foreground/80 hover:bg-secondary/80 border border-border/50"
                    )}
                  >
                    <span>{c.name}</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.2 text-[10px] font-semibold transition-colors",
                        isCatActive
                          ? "bg-white/20 text-white"
                          : isDark
                            ? "bg-[#232834] text-[#9ca3af]"
                            : "bg-background/80 text-muted-foreground"
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
                        "group flex items-start justify-between rounded-2xl border border-border/70 bg-card shadow-xs hover:shadow-soft hover:border-orange-500/40 transition-all duration-200 cursor-pointer",
                        compact ? "p-2.5 rounded-xl gap-2.5" : "p-3.5 sm:p-4 gap-3",
                        !i.available && "opacity-60 bg-muted/20"
                      )}
                    >
                      {/* Left: Dish Details */}
                      <div className="min-w-0 flex-1 space-y-1 pr-2 sm:pr-3">
                        {!i.available && (
                          <span className="inline-block rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider mb-0.5">
                            Out of stock
                          </span>
                        )}

                        <div className="flex items-center gap-1.5">
                          <VegMark veg={i.is_veg} />
                          <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug group-hover:text-orange-600 transition-colors truncate">
                            {i.name}
                          </h3>
                        </div>

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
                        {(() => {
                          const dishImg = i.image_url || getSmartDishImageUrl(i.name, c.name, i.is_veg);
                          return (
                            <div
                              className={cn(
                                "rounded-2xl overflow-hidden border border-border/60 bg-muted shadow-xs",
                                compact ? "size-16 rounded-xl" : "size-20 sm:size-24"
                              )}
                            >
                              <img
                                src={dishImg}
                                alt={i.name}
                                loading="lazy"
                                className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = getSmartDishImageUrl(i.name, c.name, i.is_veg);
                                }}
                              />
                            </div>
                          );
                        })()}

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
                                className={cn(
                                  "font-bold rounded-xl border-orange-500/40 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 gap-1",
                                  compact ? "h-6 px-2.5 text-[11px] rounded-lg" : "h-7 px-3 text-xs"
                                )}
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

        {/* RECOMMENDED FOR YOU (Curated Carousel at Bottom of Menu) */}
        {!searchQuery && recommendedDishes.length > 0 && (
          <section className="pt-10 pb-4 border-t border-border/60 mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400">
                  <Sparkles className="size-4" />
                </span>
                <div>
                  <h3 className="font-serif font-bold text-lg sm:text-xl text-foreground tracking-tight">
                    Recommended For You
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Chef's handpicked signature culinary pairings</p>
                </div>
              </div>
            </div>

            <div className={cn("flex overflow-x-auto no-scrollbar scroll-smooth", compact ? "gap-2.5 py-1.5 -mx-2.5 px-2.5" : "gap-3.5 py-2 -mx-4 px-4 sm:mx-0 sm:px-0")}>
              {recommendedDishes.map((dish) => (
                <div
                  key={dish.id}
                  onClick={() => setSelectedDish(dish)}
                  className={cn(
                    "group shrink-0 rounded-2xl border border-border/70 bg-card shadow-xs hover:shadow-soft hover:border-orange-500/50 transition-all duration-200 cursor-pointer flex flex-col justify-between",
                    compact ? "w-36 p-2.5 rounded-xl" : "w-44 sm:w-48 p-3"
                  )}
                >
                  <div>
                    <div
                      className={cn(
                        "w-full rounded-xl overflow-hidden bg-muted border border-border/50 relative",
                        compact ? "h-24 rounded-lg" : "h-28"
                      )}
                    >
                      {(() => {
                        const dishImg = dish.image_url || getSmartDishImageUrl(dish.name, null, dish.is_veg);
                        return (
                          <img
                            src={dishImg}
                            alt={dish.name}
                            className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = getSmartDishImageUrl(dish.name, null, dish.is_veg);
                            }}
                          />
                        );
                      })()}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <VegMark veg={dish.is_veg} className="size-3" />
                      <h4 className="font-bold text-xs sm:text-sm text-foreground truncate group-hover:text-orange-600 transition-colors">
                        {dish.name}
                      </h4>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border/40">
                    <span className="font-extrabold text-xs sm:text-sm text-orange-600 dark:text-orange-400">
                      {formatPrice(dish.price)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(dish);
                      }}
                      className={cn(
                        "rounded-xl bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors shadow-xs active:scale-95",
                        compact ? "size-6 rounded-lg" : "size-7"
                      )}
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

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
        <DialogContent
          className={cn(
            "sm:max-w-md p-0 overflow-hidden rounded-t-3xl sm:rounded-3xl border-border/80 bg-card max-h-[92vh] flex flex-col",
            isDark && "dark menuly-menu-dark bg-[#15181e] text-[#f3f4f6]"
          )}
        >
          {selectedDish && (
            <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
              {/* Dish Photo Header with Top-Right Close Button */}
              <div className="relative h-60 sm:h-64 w-full bg-muted shrink-0">
                {(() => {
                  const dishImg = selectedDish.image_url || getSmartDishImageUrl(selectedDish.name, null, selectedDish.is_veg);
                  return (
                    <img
                      src={dishImg}
                      alt={selectedDish.name}
                      className="size-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = getSmartDishImageUrl(selectedDish.name, null, selectedDish.is_veg);
                      }}
                    />
                  );
                })()}
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
                  <div className="flex items-center gap-2">
                    <VegMark veg={selectedDish.is_veg} className="size-4" />
                    <h3 className="font-serif font-bold text-2xl text-foreground tracking-tight leading-snug">
                      {selectedDish.name}
                    </h3>
                  </div>
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

      {/* FLOATING ACTIVE ORDER REAL-TIME STATUS PILL */}
      {!compact && totalItemsCount === 0 && activeOrder && !isFloatingDismissed && (
        <aside className="fixed inset-x-0 bottom-4 z-40 px-4 animate-in slide-in-from-bottom duration-300 pointer-events-none">
          <div
            onClick={() => {
              setViewingReceiptOrder(activeOrder);
              setIsReceiptOpen(true);
            }}
            className={cn(
              "mx-auto max-w-lg rounded-2xl shadow-xl flex items-center justify-between p-3 sm:p-3.5 transition-all duration-200 cursor-pointer pointer-events-auto border backdrop-blur-md",
              activeOrder.status === "PENDING" && "bg-card/95 border-amber-500/40 text-foreground shadow-amber-500/10",
              activeOrder.status === "PREPARING" && "bg-card/95 border-blue-500/40 text-foreground shadow-blue-500/10",
              activeOrder.status === "SERVED" && "bg-card/95 border-emerald-500/40 text-foreground shadow-emerald-500/10",
              activeOrder.status === "COMPLETED" && "bg-card/95 border-stone-500/40 text-foreground shadow-stone-500/10",
              activeOrder.status === "CANCELLED" && "bg-card/95 border-rose-500/40 text-foreground shadow-rose-500/10"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-xl shrink-0 font-bold",
                  activeOrder.status === "PENDING" && "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                  activeOrder.status === "PREPARING" && "bg-blue-500/15 text-blue-600 dark:text-blue-400",
                  activeOrder.status === "SERVED" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                  activeOrder.status === "COMPLETED" && "bg-stone-500/15 text-stone-600 dark:text-stone-400",
                  activeOrder.status === "CANCELLED" && "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                )}
              >
                {activeOrder.status === "PENDING" && <Clock className="size-4 animate-pulse" />}
                {activeOrder.status === "PREPARING" && <CookingPot className="size-4 animate-pulse" />}
                {activeOrder.status === "SERVED" && <CheckCircle2 className="size-4" />}
                {activeOrder.status === "COMPLETED" && <Check className="size-4" />}
                {activeOrder.status === "CANCELLED" && <X className="size-4" />}
              </span>
              <div className="text-left leading-tight min-w-0 flex-1">
                <span className="text-xs font-black block truncate text-foreground">
                  Table #{activeOrder.tableNumber} • {activeOrder.orderNumber}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium block truncate">
                  {activeOrder.status === "PENDING" && "Order Placed • Sent to Kitchen"}
                  {activeOrder.status === "PREPARING" && "Cooking in Kitchen • Chef is preparing food"}
                  {activeOrder.status === "SERVED" && "Served at Table • Enjoy your meal"}
                  {activeOrder.status === "COMPLETED" && "Order Completed • Thank you"}
                  {activeOrder.status === "CANCELLED" && "Order Cancelled"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-mono font-bold bg-secondary px-2.5 py-1 rounded-xl text-foreground">
                {formatPrice(activeOrder.grandTotal)}
              </span>
              {/* Dismiss Button - Hides floating pill so it doesn't disturb browsing, order stays safely in Orders button */}
              <button
                type="button"
                onClick={handleDismissFloatingBar}
                className="size-7 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                title="Dismiss status pill (You can re-open from top Orders button)"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ORDER SUMMARY DRAWER MODAL */}
      <Dialog open={isOrderDrawerOpen} onOpenChange={setIsOrderDrawerOpen}>
        <DialogContent
          className={cn(
            "sm:max-w-md p-0 overflow-hidden rounded-t-3xl sm:rounded-3xl border-border/80 bg-card max-h-[88vh] flex flex-col",
            isDark && "dark menuly-menu-dark bg-[#15181e] text-[#f3f4f6]"
          )}
        >
          <DialogHeader className="p-4 sm:p-5 border-b border-border/60 pb-3 pr-14">
            <DialogTitle className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <ShoppingBag className="size-5 text-orange-500 shrink-0" />
                <span className="font-serif font-bold text-base sm:text-lg text-foreground truncate">Your Order Summary</span>
              </div>
              {table && (
                <span className="shrink-0 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 px-2.5 py-0.5 text-xs font-bold">
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

            {/* Table & Dine-In Details */}
            <div className="p-3 rounded-2xl bg-secondary/50 border border-border/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-foreground">Dine-In Table:</span>
                  <span className="rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 font-black px-2 py-0.5">
                    Table #{activeTableNumber || "1"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingTable(!isEditingTable)}
                  className="text-[11px] text-primary hover:underline font-bold"
                >
                  {isEditingTable ? "Done" : "Change Table"}
                </button>
              </div>

              {isEditingTable && (
                <div className="pt-1">
                  <Input
                    type="text"
                    value={activeTableNumber}
                    onChange={(e) => {
                      const val = e.target.value;
                      setActiveTableNumber(val);
                      if (typeof window !== "undefined") {
                        localStorage.setItem(`menuly_last_table_${r.slug}`, val);
                      }
                    }}
                    placeholder="Enter Table # (e.g. 1, 2, Outdoor-A)"
                    className="h-8 text-xs rounded-xl bg-card border-border"
                  />
                </div>
              )}

              {/* Diner Name & Mobile Number (Required for kitchen notification) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border/50">
                <div>
                  <label className="text-[10px] font-bold text-foreground flex items-center gap-1 mb-1">
                    <User className="size-3 text-orange-500" /> Your Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="text"
                    value={dinerName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDinerName(val);
                      if (typeof window !== "undefined") localStorage.setItem("menuly_diner_name", val);
                    }}
                    placeholder="e.g. Rahul Sharma"
                    className="h-8 text-xs rounded-xl bg-card border-border placeholder:text-muted-foreground/60"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-foreground flex items-center gap-1 mb-1">
                    <Phone className="size-3 text-emerald-500" /> Contact Number <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                      +91
                    </span>
                    <Input
                      type="tel"
                      maxLength={14}
                      value={dinerPhone}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDinerPhone(val);
                        if (typeof window !== "undefined") localStorage.setItem("menuly_diner_phone", val);
                      }}
                      placeholder="98765 43210"
                      className="h-8 pl-8 text-xs rounded-xl bg-card border-border font-mono placeholder:text-muted-foreground/60"
                    />
                  </div>
                </div>
              </div>

              {/* Cooking Instructions / Notes */}
              <div className="pt-1">
                <Input
                  type="text"
                  value={cookingNotes}
                  onChange={(e) => setCookingNotes(e.target.value)}
                  placeholder="Cooking note (e.g. less spicy, no onion garlic)..."
                  className="h-8 text-xs rounded-xl bg-card border-border placeholder:text-muted-foreground/70"
                />
              </div>
            </div>

            {/* Ordering Options */}
            <div className="pt-1 space-y-2">
              {/* PRIMARY ACTION: Place Dine-In Order directly to Kitchen POS */}
              <Button
                type="button"
                disabled={isPlacingOrder || totalItemsCount === 0}
                onClick={handlePlaceDineInOrder}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-sm shadow-soft gap-2"
              >
                {isPlacingOrder ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" /> Sending to Kitchen...
                  </>
                ) : (
                  <>
                    <CookingPot className="size-4" /> Place Dine-In Order (Table #{activeTableNumber || "1"})
                  </>
                )}
              </Button>

              {r.whatsapp && (
                <Button
                  asChild
                  variant="outline"
                  className="w-full h-10 rounded-xl border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-bold text-xs gap-2"
                >
                  <a
                    href={whatsappLink(
                      r.whatsapp,
                      `Hi *${r.name}*!\nI would like to order from Table #${activeTableNumber || table || "Dine-In"}:\n\n${cartItems
                        .map((it) => `• ${it.quantity}x ${it.name} - ${formatPrice(it.price * it.quantity)}`)
                        .join("\n")}\n\n*Total Bill: ${formatPrice(totalBill)}*`
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="size-3.5" /> Order via WhatsApp Backup
                  </a>
                </Button>
              )}

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsShowSlipModalOpen(true)}
                  className="flex-1 h-9 rounded-xl text-xs font-bold border-border"
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
                  className="h-9 text-xs text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-3.5" /> Clear
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIGITAL ORDER RECEIPT & LIVE TRACKING MODAL */}
      <Dialog
        open={isReceiptOpen}
        onOpenChange={(open) => {
          setIsReceiptOpen(open);
          if (!open) setViewingReceiptOrder(null);
        }}
      >
        <DialogContent
          className={cn(
            "sm:max-w-md p-0 overflow-hidden rounded-3xl border-border bg-card",
            isDark && "dark menuly-menu-dark bg-[#15181e] text-[#f3f4f6]"
          )}
        >
          {(() => {
            const receiptOrder = viewingReceiptOrder || activeOrder;
            if (!receiptOrder) return null;
            return (
              <div className="p-5 sm:p-6 space-y-4 print:p-0">
                {/* Receipt Header with animated badge */}
                <div className="text-center space-y-1 border-b border-dashed border-border/80 pb-4">
                  <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center font-bold mb-2">
                    <CheckCircle2 className="size-6" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Order Placed Successfully
                  </span>
                  <h3 className="font-serif font-black text-xl text-foreground">
                    {r.name}
                  </h3>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 px-3 py-0.5 text-xs font-bold mt-1">
                    Table #{receiptOrder.tableNumber} • Dine-In
                  </div>
                  {receiptOrder.customerName && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Guest: <span className="font-bold text-foreground">{receiptOrder.customerName}</span>
                      {receiptOrder.customerPhone ? <span className="ml-1 text-[11px]">({receiptOrder.customerPhone})</span> : null}
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground font-mono mt-1">
                    <span>{receiptOrder.orderNumber}</span>
                    <span>•</span>
                    <span>{new Date(receiptOrder.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>

                {/* Dynamic 4-Step Visual Order Progress Tracker */}
                <div className="rounded-2xl border border-border/80 bg-secondary/30 p-3.5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground uppercase text-[10px] tracking-wider">Kitchen Order Tracker</span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider border",
                        receiptOrder.status === "PENDING" && "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
                        receiptOrder.status === "PREPARING" && "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 animate-pulse",
                        receiptOrder.status === "SERVED" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
                        receiptOrder.status === "COMPLETED" && "bg-stone-500/15 text-stone-700 dark:text-stone-300 border-stone-500/30",
                        receiptOrder.status === "CANCELLED" && "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                      )}
                    >
                      {receiptOrder.status === "PENDING" && <Clock className="size-3 animate-spin duration-3000" />}
                      {receiptOrder.status === "PREPARING" && <CookingPot className="size-3 animate-bounce" />}
                      {receiptOrder.status === "SERVED" && <CheckCircle2 className="size-3" />}
                      {receiptOrder.status === "COMPLETED" && <Check className="size-3" />}
                      {receiptOrder.status === "CANCELLED" && <X className="size-3" />}

                      {receiptOrder.status === "PENDING" && "Order Placed"}
                      {receiptOrder.status === "PREPARING" && "Cooking in Kitchen"}
                      {receiptOrder.status === "SERVED" && "Served at Table"}
                      {receiptOrder.status === "COMPLETED" && "Order Completed"}
                      {receiptOrder.status === "CANCELLED" && "Order Cancelled"}
                    </span>
                  </div>

                  {/* Step Progress Line */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {/* Step 1: Placed */}
                    <div className="text-center space-y-1">
                      <div className="h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[9px] font-bold block text-foreground">Placed</span>
                    </div>
                    {/* Step 2: Preparing */}
                    <div className="text-center space-y-1">
                      <div
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          receiptOrder.status === "PENDING" ? "bg-muted" : "bg-blue-500 animate-pulse"
                        )}
                      />
                      <span
                        className={cn(
                          "text-[9px] font-bold block",
                          receiptOrder.status === "PREPARING" ? "text-blue-600 dark:text-blue-400 font-black" : "text-muted-foreground"
                        )}
                      >
                        Cooking
                      </span>
                    </div>
                    {/* Step 3: Served */}
                    <div className="text-center space-y-1">
                      <div
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          receiptOrder.status === "SERVED" || receiptOrder.status === "COMPLETED" ? "bg-emerald-500" : "bg-muted"
                        )}
                      />
                      <span
                        className={cn(
                          "text-[9px] font-bold block",
                          receiptOrder.status === "SERVED" ? "text-emerald-600 dark:text-emerald-400 font-black" : "text-muted-foreground"
                        )}
                      >
                        Served
                      </span>
                    </div>
                    {/* Step 4: Done */}
                    <div className="text-center space-y-1">
                      <div
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          receiptOrder.status === "COMPLETED" ? "bg-stone-800 dark:bg-stone-200" : "bg-muted"
                        )}
                      />
                      <span
                        className={cn(
                          "text-[9px] font-bold block",
                          receiptOrder.status === "COMPLETED" ? "text-foreground font-black" : "text-muted-foreground"
                        )}
                      >
                        Done
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-center text-muted-foreground pt-0.5">
                    {receiptOrder.status === "PENDING" && "Your order is with the kitchen. Preparation will begin shortly."}
                    {receiptOrder.status === "PREPARING" && "The chef is actively preparing your dishes. Sit tight!"}
                    {receiptOrder.status === "SERVED" && "Dishes have been served at your table! Enjoy your meal."}
                    {receiptOrder.status === "COMPLETED" && "This order has been completed and settled. Thank you for dining with us!"}
                    {receiptOrder.status === "CANCELLED" && `This order was cancelled${receiptOrder.cancelReason ? `: ${receiptOrder.cancelReason}` : ""}.`}
                  </p>
                </div>

                {/* Items List */}
                <div className="space-y-2 py-1 text-xs max-h-48 overflow-y-auto no-scrollbar">
                  <div className="flex justify-between text-muted-foreground font-semibold border-b border-border/50 pb-1">
                    <span>Ordered Dishes</span>
                    <span>Total</span>
                  </div>
                  {receiptOrder.items?.map((it: any, idx: number) => (
                    <div key={it.id + idx} className="flex justify-between items-center text-foreground">
                      <span>
                        <strong className="font-bold mr-1">{it.quantity}x</strong> {it.name}
                      </span>
                      <span className="font-mono font-semibold">{formatPrice(it.total || it.price * it.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Total & Payment mode */}
                <div className="border-t border-dashed border-border/80 pt-3 space-y-1 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal ({receiptOrder.totalItems || receiptOrder.items?.length} items)</span>
                    <span>{formatPrice(receiptOrder.subtotal || receiptOrder.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxes &amp; Service</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Included</span>
                  </div>
                  <div className="flex justify-between items-center text-base font-black text-foreground pt-2 border-t border-border/50">
                    <span>Grand Total</span>
                    <span className="text-orange-600 dark:text-orange-400 font-mono">{formatPrice(receiptOrder.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                    <span>Payment</span>
                    <span className="font-bold">Pay at Counter / Server</span>
                  </div>
                </div>

                {/* Receipt Action Buttons */}
                <div className="pt-2 flex flex-col gap-2 print:hidden">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => {
                        printReceipt(receiptOrder, {
                          name: r.name,
                          address: r.address,
                          phone: r.phone,
                          whatsapp: r.whatsapp,
                          slug: r.slug,
                        });
                      }}
                      className="flex-1 rounded-xl h-10 font-bold text-xs gap-1.5 bg-primary text-primary-foreground hover:brightness-105"
                    >
                      <Printer className="size-3.5" /> Save / Print Receipt (PDF)
                    </Button>
                    {r.whatsapp && (
                      <Button
                        asChild
                        variant="outline"
                        className="rounded-xl h-10 font-bold text-xs gap-1.5 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                      >
                        <a
                          href={whatsappLink(
                            r.whatsapp,
                            `Hi ${r.name}! Here is my Order ${receiptOrder.orderNumber} for Table #${receiptOrder.tableNumber}:\n\n${receiptOrder.items
                              ?.map((it: any) => `• ${it.quantity}x ${it.name}`)
                              .join("\n")}\n\nTotal: ${formatPrice(receiptOrder.grandTotal)}`
                          )}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircle className="size-3.5" /> WhatsApp
                        </a>
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setIsFloatingDismissed(true);
                        setIsReceiptOpen(false);
                        setViewingReceiptOrder(null);
                        toast.info("Status pill dismissed. Open anytime from top Orders button.");
                      }}
                      className="rounded-xl h-8 text-[11px] text-muted-foreground hover:text-foreground gap-1 px-2"
                    >
                      <X className="size-3" /> Dismiss Floating Pill
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setIsReceiptOpen(false);
                        setViewingReceiptOrder(null);
                      }}
                      className="rounded-xl h-8 text-xs text-foreground font-bold hover:bg-secondary px-3"
                    >
                      Order More / Close
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* MY TABLE ORDERS & SESSION HISTORY MODAL */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent
          className={cn(
            "sm:max-w-md max-h-[88vh] overflow-y-auto rounded-3xl border-border bg-card p-5 sm:p-6 space-y-4",
            isDark && "dark menuly-menu-dark bg-[#15181e] text-[#f3f4f6]"
          )}
        >
          <DialogHeader className="space-y-1.5 pb-2 border-b border-border/60 pr-14">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <ReceiptText className="size-4" />
                </span>
                <DialogTitle className="font-serif font-black text-base sm:text-lg text-foreground truncate">
                  My Table Orders
                </DialogTitle>
              </div>
              <span className="shrink-0 rounded-full bg-orange-500/10 border border-orange-500/30 font-black text-orange-600 dark:text-orange-400 px-2.5 py-0.5 text-xs">
                Table #{activeTableNumber || table || "1"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Review live progress and previous rounds placed at your table.
            </p>
          </DialogHeader>

          {orderHistory.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <div className="size-12 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
                <ReceiptText className="size-6 opacity-60" />
              </div>
              <p className="text-sm font-bold text-foreground">No orders placed yet</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Add dishes to your cart and place your table order.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Grand Session Total */}
              <div className="rounded-2xl bg-secondary/50 border border-border/70 p-3.5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-muted-foreground font-medium block">Dining Session Total</span>
                  <span className="text-[11px] text-muted-foreground">
                    {orderHistory.length} round{orderHistory.length > 1 ? "s" : ""} placed
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-black font-mono text-primary">
                    {formatPrice(
                      orderHistory
                        .filter((o) => o.status !== "CANCELLED")
                        .reduce((sum, o) => sum + (o.grandTotal || 0), 0)
                    )}
                  </span>
                </div>
              </div>

              {/* Order Cards List */}
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto no-scrollbar pr-0.5">
                {orderHistory.map((order, idx) => (
                  <div
                    key={order.id || idx}
                    onClick={() => {
                      setViewingReceiptOrder(order);
                      setIsReceiptOpen(true);
                      setIsHistoryModalOpen(false);
                    }}
                    className="p-3.5 rounded-2xl border border-border/80 bg-card hover:bg-secondary/40 transition-all cursor-pointer space-y-2.5 shadow-2xs hover:shadow-xs group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground">
                          {order.orderNumber}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Clean Lucide Status Badge */}
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                          order.status === "PENDING" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
                          order.status === "PREPARING" && "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 animate-pulse",
                          order.status === "SERVED" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
                          order.status === "COMPLETED" && "bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/30",
                          order.status === "CANCELLED" && "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                        )}
                      >
                        {order.status === "PENDING" && <Clock className="size-2.5" />}
                        {order.status === "PREPARING" && <CookingPot className="size-2.5" />}
                        {order.status === "SERVED" && <CheckCircle2 className="size-2.5" />}
                        {order.status === "COMPLETED" && <Check className="size-2.5" />}
                        {order.status === "CANCELLED" && <X className="size-2.5" />}

                        {order.status === "PENDING" && "In Kitchen"}
                        {order.status === "PREPARING" && "Cooking"}
                        {order.status === "SERVED" && "Served"}
                        {order.status === "COMPLETED" && "Completed"}
                        {order.status === "CANCELLED" && "Cancelled"}
                      </span>
                    </div>

                    {/* Ordered items preview */}
                    <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {order.items?.map((it: any) => `${it.quantity}x ${it.name}`).join(", ")}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                      <span className="text-[11px] text-muted-foreground">
                        {order.totalItems || order.items?.length || 1} item
                        {(order.totalItems || order.items?.length || 1) > 1 ? "s" : ""}
                      </span>
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="font-mono text-foreground font-black">
                          {formatPrice(order.grandTotal)}
                        </span>
                        <ChevronRight className="size-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CALL WAITER & TABLE SERVICE DIALOG */}
      <Dialog open={isCallWaiterOpen} onOpenChange={setIsCallWaiterOpen}>
        <DialogContent
          className={cn(
            "sm:max-w-md rounded-3xl border-border bg-card p-5 sm:p-6 space-y-4",
            isDark && "dark menuly-menu-dark bg-[#15181e] text-[#f3f4f6]"
          )}
        >
          <DialogHeader className="text-left space-y-1 pr-14">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex size-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 items-center justify-center font-bold shrink-0">
                  <BellRing className="size-4 animate-bounce" />
                </span>
                <DialogTitle className="font-serif font-black text-base sm:text-lg text-foreground truncate">
                  Call Waiter & Service Bell
                </DialogTitle>
              </div>
              <span className="shrink-0 rounded-full bg-orange-500/10 border border-orange-500/30 font-black text-orange-600 dark:text-orange-400 px-2.5 py-0.5 text-xs">
                Table #{activeTableNumber || "1"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Select what you need at your table and the restaurant kitchen staff will be alerted immediately.
            </p>
          </DialogHeader>

          {waiterCallSuccess ? (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-center space-y-3 animate-rise">
              <div className="size-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-6 animate-pulse" />
              </div>
              <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                Staff Notified!
              </p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                {waiterCallSuccess}
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {/* Quick Service Category Tiles with Modern Vector Icons */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  {
                    id: "waiter",
                    label: "Call Waiter",
                    icon: UserCheck,
                    color: "text-amber-600 dark:text-amber-400 bg-amber-500/15 border-amber-500/30",
                    activeBg: "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/25",
                    desc: "Staff to table",
                  },
                  {
                    id: "water",
                    label: "Drinking Water",
                    icon: Droplets,
                    color: "text-sky-600 dark:text-sky-400 bg-sky-500/15 border-sky-500/30",
                    activeBg: "border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/25",
                    desc: "Water bottle / refill",
                  },
                  {
                    id: "bill",
                    label: "Get Bill",
                    icon: ReceiptText,
                    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
                    activeBg: "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/25",
                    desc: "Final check & pay",
                  },
                  {
                    id: "cutlery",
                    label: "Cutlery & Tissues",
                    icon: UtensilsCrossed,
                    color: "text-purple-600 dark:text-purple-400 bg-purple-500/15 border-purple-500/30",
                    activeBg: "border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/25",
                    desc: "Spoons, plates, napkins",
                  },
                ].map((item) => {
                  const isSelected = callReason === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCallReason(item.id as any)}
                      className={cn(
                        "relative flex flex-col items-start p-3 sm:p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer shadow-2xs group",
                        isSelected
                          ? item.activeBg
                          : "border-border/80 bg-card hover:bg-secondary/40 hover:border-border"
                      )}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <span className={cn("size-8 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105", item.color)}>
                          <Icon className="size-4" />
                        </span>
                        {isSelected && (
                          <span className="size-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] shadow-xs">
                            <Check className="size-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-xs sm:text-sm text-foreground">{item.label}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{item.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* Optional Custom Note Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquareQuote className="size-3 text-amber-500" />
                  Specific Request (Optional)
                </label>
                <Input
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="e.g. 2 extra glasses, warm water, extra plates..."
                  className="h-10 text-xs rounded-xl bg-background border-border"
                  maxLength={120}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCallWaiterOpen(false)}
                  className="flex-1 rounded-xl h-11 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={isCallingWaiter}
                  onClick={handleCallWaiter}
                  className="flex-1 rounded-xl h-11 font-bold text-xs gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-soft cursor-pointer"
                >
                  {isCallingWaiter ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin" /> Calling...
                    </>
                  ) : (
                    <>
                      <BellRing className="size-3.5 animate-pulse" /> Ring Staff Bell
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* SHOW SLIP TO SERVER MODAL (Dine-in Waiter Order Card) */}
      <Dialog open={isShowSlipModalOpen} onOpenChange={setIsShowSlipModalOpen}>
        <DialogContent
          className={cn(
            "sm:max-w-sm rounded-3xl border-border bg-card p-6 text-center space-y-4",
            isDark && "dark menuly-menu-dark bg-[#15181e] text-[#f3f4f6]"
          )}
        >
          <div className="size-12 rounded-full bg-orange-500/10 text-orange-600 mx-auto flex items-center justify-center font-bold">
            <UtensilsCrossed className="size-6 text-orange-600" />
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
