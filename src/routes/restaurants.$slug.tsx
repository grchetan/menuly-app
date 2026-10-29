import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  Utensils,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Share2,
  ExternalLink,
  QrCode,
  Download,
  CheckCircle2,
  Leaf,
  Users,
  Eye,
  Store,
  ArrowLeft,
  Sparkles,
  ChevronRight,
  Maximize2,
  Info,
  Calendar,
  Layers,
  Heart,
  Navigation,
  Image as ImageIcon,
} from "lucide-react";
import { SitePage } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { APP_NAME } from "@/lib/config";

export const Route = createFileRoute("/restaurants/$slug")({
  head: () => ({
    meta: [
      { title: `Restaurant Profile & Live Menu — ${APP_NAME}` },
      {
        name: "description",
        content: `Explore live digital menus, chef specials, location, and QR ordering powered by ${APP_NAME}.`,
      },
    ],
  }),
  component: RestaurantStorefrontPage,
});

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isVeg: boolean;
  available: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
  itemCount: number;
  items: MenuItem[];
}

interface StorefrontDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string;
  hours: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  isPureVeg: boolean;
  isFeatured: boolean;
  galleryPhotos: string[];
  categoryCount: number;
  dishCount: number;
  menuViews: number;
  profileVisits: number;
  createdAt: string;
  phone: string | null;
  whatsapp: string | null;
  qrFg: string;
  qrBg: string;
  qrCorner: string;
  categories: MenuCategory[];
}

function isOpenNow(hoursString?: string | null): boolean {
  if (!hoursString) return true;
  const lower = hoursString.toLowerCase();
  if (lower.includes("24 hour") || lower.includes("24x7")) return true;
  const now = new Date();
  const currentHour = now.getHours();
  return currentHour >= 10 && currentHour < 23;
}

function RestaurantStorefrontPage() {
  const rawParams = Route.useParams() as { slug?: string };
  const slug = rawParams?.slug || "";
  const navigate = useNavigate();

  // Interactive QR Code styling references
  const qrBoxRef = useRef<HTMLDivElement>(null);
  const qrInstanceRef = useRef<any>(null);

  // Active Category filter
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");

  // Lightbox modal for gallery & dish photos
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

  // Fetch full restaurant storefront profile from backend
  const { data, isLoading, isError, refetch } = useQuery<{ success: boolean; restaurant: StorefrontDetail }>({
    queryKey: ["community-restaurant-detail", slug],
    queryFn: async () => {
      const res = await fetch(`/api/community/restaurant/${slug}`);
      if (!res.ok) throw new Error("Restaurant not found or inactive");
      return res.json();
    },
    staleTime: 60_000,
  });

  const restaurant = data?.restaurant;

  // Render styled QR code on client mount
  useEffect(() => {
    let alive = true;
    if (!restaurant || typeof window === "undefined") return;

    const menuUrl = `${window.location.origin}/menu/${restaurant.slug}`;

    import("qr-code-styling")
      .then(({ default: QRCodeStyling }) => {
        if (!alive || !qrBoxRef.current) return;
        qrBoxRef.current.innerHTML = "";

        const qrOptions: any = {
          width: 240,
          height: 240,
          type: "svg",
          data: menuUrl,
          margin: 6,
          qrOptions: {
            typeNumber: 0,
            mode: "Byte",
            errorCorrectionLevel: "Q",
          },
          imageOptions: {
            hideBackgroundDots: true,
            imageSize: 0.32,
            margin: 4,
            crossOrigin: "anonymous",
          },
          dotsOptions: {
            color: restaurant.qrFg || "#1a1f1c",
            type: "rounded",
          },
          backgroundOptions: {
            color: restaurant.qrBg || "#ffffff",
          },
          cornersSquareOptions: {
            color: restaurant.qrCorner || "#1a1f1c",
            type: "extra-rounded",
          },
          cornersDotOptions: {
            color: restaurant.qrCorner || "#1a1f1c",
            type: "dot",
          },
        };

        if (restaurant.logoUrl) {
          qrOptions.image = restaurant.logoUrl;
        }

        const qr = new QRCodeStyling(qrOptions);
        qrInstanceRef.current = qr;
        qr.append(qrBoxRef.current);
      })
      .catch((err) => {
        console.warn("Could not render QR canvas:", err);
      });

    return () => {
      alive = false;
    };
  }, [restaurant]);

  // Download high-resolution QR
  const handleDownloadQr = () => {
    if (!restaurant) return;
    if (qrInstanceRef.current) {
      qrInstanceRef.current.download({
        name: `${restaurant.slug}-menu-qr`,
        extension: "png",
      });
      toast.success("QR Code downloaded! You can print or place this on tables.");
    }
  };

  // Share restaurant storefront
  const handleShare = () => {
    if (!restaurant) return;
    const url = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: `${restaurant.name} — Live Digital Menu on ${APP_NAME}`,
          text: `Check out ${restaurant.name}'s menu, specials, and QR ordering on Menuly!`,
          url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Restaurant storefront link copied to clipboard!");
    }
  };

  // Google Maps Directions link
  const directionsUrl = useMemo(() => {
    if (!restaurant) return "#";
    const q = encodeURIComponent(`${restaurant.name}, ${restaurant.address || restaurant.city || "India"}`);
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }, [restaurant]);

  // WhatsApp Order / Inquiry link
  const whatsappUrl = useMemo(() => {
    if (!restaurant) return null;
    const raw = (restaurant.whatsapp || restaurant.phone || "").replace(/\D/g, "");
    if (!raw) return null;
    const normalized = raw.length === 10 ? `91${raw}` : raw;
    const text = encodeURIComponent(
      `Hello ${restaurant.name}! I am browsing your digital menu on Menuly and would like to ask a question / place an order.`
    );
    return `https://wa.me/${normalized}?text=${text}`;
  }, [restaurant]);

  // Phone call link
  const phoneCallUrl = useMemo(() => {
    if (!restaurant) return null;
    const raw = (restaurant.phone || restaurant.whatsapp || "").replace(/\s/g, "");
    return raw ? `tel:${raw}` : null;
  }, [restaurant]);

  // Filtered categories and dishes
  const displayedCategories = useMemo(() => {
    if (!restaurant?.categories) return [];
    if (activeCategoryId === "all") return restaurant.categories;
    return restaurant.categories.filter((cat) => cat.id === activeCategoryId);
  }, [restaurant, activeCategoryId]);

  // Total visible dishes count
  const allDishes = useMemo(() => {
    if (!restaurant?.categories) return [];
    return restaurant.categories.flatMap((cat) => cat.items);
  }, [restaurant]);

  // Dynamic Open / Closed
  const openStatus = isOpenNow(restaurant?.hours);

  // -----------------------------------------------------------------
  // 1. LOADING SKELETON
  // -----------------------------------------------------------------
  if (isLoading) {
    return (
      <SitePage>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-pulse space-y-8">
          <div className="h-64 sm:h-80 rounded-3xl bg-muted/60" />
          <div className="flex gap-4 items-center">
            <div className="size-20 rounded-2xl bg-muted/60" />
            <div className="space-y-2 flex-1">
              <div className="h-6 w-1/3 rounded bg-muted/60" />
              <div className="h-4 w-1/4 rounded bg-muted/60" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-muted/60" />
            ))}
          </div>
        </div>
      </SitePage>
    );
  }

  // -----------------------------------------------------------------
  // 2. ERROR OR NOT FOUND STATE
  // -----------------------------------------------------------------
  if (isError || !restaurant) {
    return (
      <SitePage>
        <div className="max-w-md mx-auto px-4 py-24 text-center space-y-5">
          <div className="size-16 mx-auto rounded-3xl bg-destructive/10 text-destructive flex items-center justify-center">
            <Store className="size-8" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Restaurant Profile Not Found</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This restaurant is either unpublished, temporarily offline, or the link may be outdated.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild variant="outline" className="rounded-xl font-bold">
              <Link to="/restaurants">
                <ArrowLeft className="size-4 mr-1.5" /> Back to Community
              </Link>
            </Button>
            <Button onClick={() => refetch()} className="rounded-xl font-bold">
              Try Again
            </Button>
          </div>
        </div>
      </SitePage>
    );
  }

  // -----------------------------------------------------------------
  // 3. MAIN STOREFRONT PROFILE RENDER
  // -----------------------------------------------------------------
  return (
    <SitePage>
      <div className="relative pb-24">
        {/* Ambient Top Glow */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-primary/15 via-emerald-500/5 to-transparent blur-3xl opacity-75 -z-10" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pb-4">
            <Link to="/restaurants" className="hover:text-foreground inline-flex items-center gap-1 font-semibold transition-colors">
              <ArrowLeft className="size-3.5" />
              <span>Community Directory</span>
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate max-w-xs">{restaurant.name}</span>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* LUXURY BANNER & BRAND HEADER                                  */}
          {/* ------------------------------------------------------------- */}
          <div className="relative rounded-3xl overflow-hidden border border-border/80 bg-card shadow-soft">
            {/* Cover Banner */}
            <div className="relative h-56 sm:h-80 md:h-96 w-full bg-muted overflow-hidden select-none">
              {restaurant.coverUrl ? (
                <img
                  src={restaurant.coverUrl}
                  alt={`${restaurant.name} banner`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-950 via-primary/30 to-background flex items-center justify-center">
                  <div className="text-center p-6 space-y-2">
                    <Utensils className="size-12 mx-auto text-primary/40 animate-pulse" />
                    <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                      Official Menuly Digital Storefront
                    </p>
                  </div>
                </div>
              )}

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

              {/* Top Bar Floating Badges */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-10">
                {/* Real-time Open/Closed Status */}
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md shadow-md ${
                    openStatus ? "bg-emerald-500/90 text-white" : "bg-black/70 text-white/90"
                  }`}
                >
                  <span className={`size-2 rounded-full ${openStatus ? "bg-white animate-ping" : "bg-neutral-400"}`} />
                  {openStatus ? "Open Now" : "Currently Closed"}
                </span>

                {/* Dietary badge & Share */}
                <div className="flex items-center gap-2">
                  {restaurant.isPureVeg ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-600/95 text-white backdrop-blur-md shadow-md">
                      <Leaf className="size-3.5 text-white" /> Pure Veg
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-600/95 text-white backdrop-blur-md shadow-md">
                      🍗 Multi-Cuisine
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex size-9 items-center justify-center rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md transition-all shadow-md cursor-pointer"
                    title="Share Storefront Profile"
                  >
                    <Share2 className="size-4" />
                  </button>
                </div>
              </div>

              {/* Bottom Floating Info Over Banner */}
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 z-10">
                <div className="flex items-end gap-3.5 sm:gap-4">
                  {/* Floating Logo */}
                  <div className="relative size-20 sm:size-24 rounded-2xl sm:rounded-3xl border-3 border-background bg-card overflow-hidden shadow-2xl flex items-center justify-center shrink-0">
                    {restaurant.logoUrl ? (
                      <img
                        src={restaurant.logoUrl}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center font-display font-black text-2xl sm:text-3xl text-primary">
                        {restaurant.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Title & Location */}
                  <div className="min-w-0 pb-1 text-white">
                    <h1 className="font-display text-xl sm:text-3xl md:text-4xl font-black drop-shadow-md flex items-center gap-2 truncate">
                      {restaurant.name}
                      <span title="Menuly Verified Partner">
                        <CheckCircle2 className="size-5 sm:size-6 text-emerald-400 shrink-0 inline" />
                      </span>
                    </h1>
                    <p className="text-xs sm:text-sm text-white/90 drop-shadow-xs flex items-center gap-1.5 mt-1">
                      <MapPin className="size-3.5 sm:size-4 text-amber-400 shrink-0" />
                      <span className="truncate">{restaurant.address || restaurant.city || "India"}</span>
                    </p>
                  </div>
                </div>

                {/* Direct CTA on Banner */}
                <a
                  href={`/menu/${restaurant.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-6 rounded-2xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground text-sm shadow-soft transition-all duration-200 cursor-pointer shrink-0"
                >
                  <QrCode className="size-4" />
                  <span>Open Live Menu</span>
                  <ExternalLink className="size-3.5 opacity-80" />
                </a>
              </div>
            </div>

            {/* Sub-Header Details & Description Bar */}
            <div className="p-4 sm:p-6 bg-card space-y-4">
              {restaurant.description && (
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {restaurant.description}
                </p>
              )}

              {/* Quick Contact & Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
                {/* Google Maps Directions */}
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-border/80 bg-background hover:bg-muted text-xs font-bold transition-colors cursor-pointer"
                >
                  <Navigation className="size-3.5 text-primary" />
                  <span>Get Directions</span>
                </a>

                {/* WhatsApp Chat / Order */}
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <MessageCircle className="size-3.5" />
                    <span>Order on WhatsApp</span>
                  </a>
                )}

                {/* Call Button */}
                {phoneCallUrl && (
                  <a
                    href={phoneCallUrl}
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-border/80 bg-background hover:bg-muted text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Phone className="size-3.5 text-primary" />
                    <span>Call Restaurant</span>
                  </a>
                )}

                {/* Operating Hours */}
                <div className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-muted/50 border border-border/60 text-xs text-muted-foreground">
                  <Clock className="size-3.5 text-primary shrink-0" />
                  <span>{restaurant.hours || "Mon–Sun, 10:00 AM – 11:00 PM"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* STATS METRIC ROW (Profile Visits, Menu Views, Dishes, Cats)  */}
          {/* ------------------------------------------------------------- */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
            <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <Users className="size-3.5 text-emerald-500" />
                <span>Profile Visits</span>
              </div>
              <p className="mt-1 font-display text-2xl font-black text-foreground">
                {restaurant.profileVisits.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <Eye className="size-3.5 text-primary" />
                <span>Menu Views</span>
              </div>
              <p className="mt-1 font-display text-2xl font-black text-foreground">
                {restaurant.menuViews.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <Utensils className="size-3.5 text-amber-500" />
                <span>Dishes</span>
              </div>
              <p className="mt-1 font-display text-2xl font-black text-foreground">{restaurant.dishCount}</p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <Layers className="size-3.5 text-blue-500" />
                <span>Categories</span>
              </div>
              <p className="mt-1 font-display text-2xl font-black text-foreground">{restaurant.categoryCount}</p>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* TWO COLUMN GRID: MENU SHOWCASE (Left) & LIVE QR STAND (Right)  */}
          {/* ------------------------------------------------------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10">
            {/* Left 8 Columns: Menu Categories & Dishes Showcase */}
            <div className="lg:col-span-8 space-y-6">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/70">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
                    <Utensils className="size-5 text-primary" />
                    <span>Menu Highlights</span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Browse featured dishes and full categorized digital menu offerings
                  </p>
                </div>

                <a
                  href={`/menu/${restaurant.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  <span>Open Full Interactive Menu ({restaurant.dishCount} items)</span>
                  <ExternalLink className="size-3.5" />
                </a>
              </div>

              {/* Category Filter Chips */}
              {restaurant.categories.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setActiveCategoryId("all")}
                    className={`h-9 px-4 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      activeCategoryId === "all"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-card border border-border/80 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All Categories ({restaurant.dishCount})
                  </button>

                  {restaurant.categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategoryId(cat.id)}
                      className={`h-9 px-4 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        activeCategoryId === cat.id
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-card border border-border/80 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {cat.name} ({cat.items.length})
                    </button>
                  ))}
                </div>
              )}

              {/* Categories & Dishes List */}
              {displayedCategories.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center space-y-2">
                  <Utensils className="size-8 mx-auto text-muted-foreground/60" />
                  <p className="text-sm font-semibold text-muted-foreground">No dishes listed in this category.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {displayedCategories.map((category) => (
                    <div key={category.id} className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                          <span className="size-2 rounded-full bg-primary" />
                          <span>{category.name}</span>
                          <span className="text-xs font-normal text-muted-foreground">({category.items.length})</span>
                        </h3>
                      </div>

                      {/* Dish Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {category.items.map((dish) => (
                          <div
                            key={dish.id}
                            className={`group relative flex rounded-2xl border border-border/70 bg-card p-3.5 gap-3 transition-all hover:border-primary/40 hover:shadow-xs ${
                              !dish.available ? "opacity-60" : ""
                            }`}
                          >
                            {/* Dish Image */}
                            <div
                              onClick={() => {
                                if (dish.imageUrl) {
                                  setLightboxImage({ url: dish.imageUrl, title: dish.name });
                                }
                              }}
                              className={`relative size-20 sm:size-22 rounded-xl bg-muted overflow-hidden shrink-0 select-none ${
                                dish.imageUrl ? "cursor-zoom-in" : ""
                              }`}
                            >
                              {dish.imageUrl ? (
                                <img
                                  src={dish.imageUrl}
                                  alt={dish.name}
                                  loading="lazy"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary/40">
                                  <Utensils className="size-6" />
                                </div>
                              )}

                              {!dish.available && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-1">
                                  <span className="text-[10px] font-bold text-white text-center leading-tight">
                                    Sold Out
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Dish Details */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <div className="flex items-start justify-between gap-1.5">
                                  <h4 className="font-display text-sm font-bold text-foreground leading-snug truncate">
                                    {dish.name}
                                  </h4>

                                  {/* Veg / Non-Veg Indicator */}
                                  <span
                                    className={`size-3.5 rounded-xs border-2 shrink-0 flex items-center justify-center p-0.5 mt-0.5 ${
                                      dish.isVeg ? "border-emerald-600" : "border-red-600"
                                    }`}
                                    title={dish.isVeg ? "Pure Vegetarian" : "Non-Vegetarian"}
                                  >
                                    <span
                                      className={`size-1.5 rounded-full ${
                                        dish.isVeg ? "bg-emerald-600" : "bg-red-600"
                                      }`}
                                    />
                                  </span>
                                </div>

                                {dish.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                                    {dish.description}
                                  </p>
                                )}
                              </div>

                              <div className="pt-2 flex items-center justify-between">
                                <span className="font-display text-sm font-black text-foreground">
                                  ₹{dish.price.toFixed(0)}
                                </span>

                                {!dish.available && (
                                  <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">
                                    Sold Out
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom Menu Banner CTA */}
              <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card to-card p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-display text-base font-bold text-foreground">
                    Hungry? Browse the complete interactive menu
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    View high-resolution food images, customize orders, and explore full chef specials.
                  </p>
                </div>

                <a
                  href={`/menu/${restaurant.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground text-xs shadow-soft transition-all shrink-0 cursor-pointer"
                >
                  <QrCode className="size-4" />
                  <span>View Full Menu</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>

            {/* Right 4 Columns: Interactive Live QR Stand Card & Ambience Photo Gallery */}
            <div className="lg:col-span-4 space-y-6">
              {/* 1. Live Interactive QR Stand */}
              <div className="sticky top-24 rounded-3xl border border-border/80 bg-card p-6 shadow-soft space-y-5">
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                    <Sparkles className="size-3" />
                    <span>Live Table QR</span>
                  </div>
                  <h3 className="font-display text-lg font-black text-foreground pt-1">
                    Scan to Open on Mobile
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Point your camera to browse live prices & contactless food ordering
                  </p>
                </div>

                {/* QR Canvas Container with custom restaurant styling */}
                <div className="mx-auto flex size-60 items-center justify-center rounded-2xl border-2 border-border/80 bg-white p-3 shadow-inner">
                  <div ref={qrBoxRef} className="size-full flex items-center justify-center select-none" />
                </div>

                {/* QR Action Buttons */}
                <div className="space-y-2 pt-1">
                  <Button
                    onClick={handleDownloadQr}
                    className="w-full h-11 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-soft cursor-pointer"
                  >
                    <Download className="size-4" />
                    <span>Download QR Code (PNG)</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="w-full h-10 rounded-xl font-semibold gap-2 border-border/80 cursor-pointer"
                  >
                    <Share2 className="size-4 text-muted-foreground" />
                    <span>Share Restaurant Link</span>
                  </Button>
                </div>

                {/* Verified guarantee info pill */}
                <div className="rounded-xl bg-muted/50 p-3 text-center border border-border/60">
                  <p className="text-[11px] text-muted-foreground leading-relaxed flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    <span>Dynamic Menuly QR — Always updated in real-time</span>
                  </p>
                </div>
              </div>

              {/* 2. Restaurant Ambience & Gallery Section */}
              <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-soft space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                    <ImageIcon className="size-4 text-primary" />
                    <span>Ambience & Gallery</span>
                  </h3>
                  {restaurant.galleryPhotos.length > 0 && (
                    <span className="text-xs font-semibold text-muted-foreground">
                      {restaurant.galleryPhotos.length} photos
                    </span>
                  )}
                </div>

                {restaurant.galleryPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    {restaurant.galleryPhotos.map((photoUrl, index) => (
                      <div
                        key={index}
                        onClick={() =>
                          setLightboxImage({
                            url: photoUrl,
                            title: `${restaurant.name} photo ${index + 1}`,
                          })
                        }
                        className="group relative h-28 rounded-xl overflow-hidden bg-muted cursor-zoom-in border border-border/60 shadow-xs"
                      >
                        <img
                          src={photoUrl}
                          alt={`${restaurant.name} gallery ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Maximize2 className="size-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 p-6 text-center space-y-2">
                    <ImageIcon className="size-8 mx-auto text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Ambience and restaurant photos are being curated for this storefront. Check back soon!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* BOTTOM PROMOTIONAL CTA FOR RESTAURANT OWNERS                  */}
          {/* ------------------------------------------------------------- */}
          <section className="mt-20 rounded-3xl border border-primary/25 bg-gradient-to-b from-primary/10 via-card to-card p-8 sm:p-12 text-center shadow-soft">
            <div className="size-14 mx-auto rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md mb-4">
              <Sparkles className="size-7" />
            </div>

            <h3 className="font-display text-2xl sm:text-3xl font-black text-foreground">
              Want a digital menu for your food business?
            </h3>

            <p className="mt-2 max-w-lg mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Join hundreds of restaurants on Menuly. Create your high-speed contactless QR menu, table stands, and storefront in 60 seconds.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => navigate({ to: "/auth", search: { mode: "signup" } })}
                className="w-full sm:w-auto h-12 px-8 rounded-2xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft cursor-pointer"
              >
                Create Free Digital Menu <ChevronRight className="size-4 ml-1" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate({ to: "/restaurants" })}
                className="w-full sm:w-auto h-12 px-6 rounded-2xl font-semibold cursor-pointer"
              >
                Browse All Restaurants
              </Button>
            </div>
          </section>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* LIGHTBOX MODAL FOR ZOOMING IMAGES                             */}
        {/* ------------------------------------------------------------- */}
        {lightboxImage && (
          <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
            <DialogContent className="max-w-3xl p-2 bg-card/95 border-border backdrop-blur-xl overflow-hidden rounded-3xl">
              <div className="relative w-full max-h-[80vh] flex items-center justify-center bg-black/90 rounded-2xl overflow-hidden">
                <img
                  src={lightboxImage.url}
                  alt={lightboxImage.title}
                  className="max-h-[80vh] w-auto max-w-full object-contain"
                />
              </div>
              <p className="text-center text-xs font-semibold text-muted-foreground py-2 truncate">
                {lightboxImage.title}
              </p>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </SitePage>
  );
}
