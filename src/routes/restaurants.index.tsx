import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Utensils,
  Search,
  MapPin,
  Clock,
  Eye,
  Users,
  QrCode,
  ArrowRight,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Store,
  Compass,
  SlidersHorizontal,
  Flame,
  Calendar,
  Share2,
} from "lucide-react";
import { SitePage } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { APP_NAME } from "@/lib/config";

export const Route = createFileRoute("/restaurants/")({
  head: () => ({
    meta: [
      { title: `Restaurant Community & Live Digital Menus — ${APP_NAME}` },
      {
        name: "description",
        content: `Discover verified restaurants, cafes, and bakeries powered by ${APP_NAME} digital QR menus. Browse live menus, dish counts, locations, and real-time food reviews.`,
      },
      { property: "og:title", content: `Restaurant Community & Live Digital Menus — ${APP_NAME}` },
      { property: "og:description", content: "Explore live digital menus from restaurants across India." },
    ],
  }),
  component: RestaurantCommunityPage,
});

interface CommunityRestaurant {
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
}

interface CommunityResponse {
  success: boolean;
  restaurants: CommunityRestaurant[];
  totalCount: number;
  featuredCount: number;
  totalDishesAcrossPlatform: number;
}

function isOpenNow(hoursString?: string | null): boolean {
  if (!hoursString) return true;
  // Standard fallback heuristic
  const lower = hoursString.toLowerCase();
  if (lower.includes("24 hour") || lower.includes("24x7")) return true;
  const now = new Date();
  const currentHour = now.getHours();
  // Most Indian restaurants operate 10:00 AM to 11:30 PM
  return currentHour >= 10 && currentHour < 23;
}

function RestaurantCommunityPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"popular" | "views" | "visits" | "newest" | "name">("popular");

  // Fetch community restaurants from backend
  const { data, isLoading, isError, refetch } = useQuery<CommunityResponse>({
    queryKey: ["community-restaurants", sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (sortBy) params.set("sort", sortBy);
      const res = await fetch(`/api/community/restaurants?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load community restaurants");
      return res.json();
    },
    staleTime: 30_000,
  });

  const restaurants = data?.restaurants || [];

  // Extract unique cities
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    restaurants.forEach((r) => {
      if (r.city && r.city.trim() && r.city.toLowerCase() !== "india") {
        set.add(r.city.trim());
      }
    });
    return Array.from(set).sort();
  }, [restaurants]);

  // Client-side filtering by search term & city
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      // City filter
      if (selectedCity !== "all") {
        if (r.city.toLowerCase() !== selectedCity.toLowerCase()) {
          return false;
        }
      }

      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchName = r.name.toLowerCase().includes(query);
        const matchCity = r.city.toLowerCase().includes(query);
        const matchAddress = r.address ? r.address.toLowerCase().includes(query) : false;
        const matchDesc = r.description ? r.description.toLowerCase().includes(query) : false;
        const matchSlug = r.slug.toLowerCase().includes(query);
        if (!matchName && !matchCity && !matchAddress && !matchDesc && !matchSlug) {
          return false;
        }
      }

      return true;
    });
  }, [restaurants, selectedCity, searchTerm]);

  const handleShareRestaurant = (r: CommunityRestaurant, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const profileUrl = `${window.location.origin}/restaurants/${r.slug}`;
    if (navigator.share) {
      navigator.share({
        title: `${r.name} on ${APP_NAME}`,
        text: `Check out ${r.name}'s live digital menu on Menuly!`,
        url: profileUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(profileUrl);
      toast.success("Restaurant link copied to clipboard!");
    }
  };

  return (
    <SitePage>
      <div className="relative pb-24">
        {/* Glow ambient background effects */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-primary/10 via-emerald-500/5 to-transparent blur-3xl opacity-70 -z-10" />

        {/* ------------------------------------------------------------- */}
        {/* HERO HEADER SECTION                                           */}
        {/* ------------------------------------------------------------- */}
        <section className="relative px-4 sm:px-6 pt-10 sm:pt-16 pb-10 text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary shadow-xs">
            <Compass className="size-3.5 animate-spin-slow" />
            <span>Menuly Verified Restaurant Showcase</span>
          </div>

          <h1 className="mt-4 font-display text-3xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.15]">
            Explore Restaurants with{" "}
            <span className="text-primary bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
              Live Digital Menus
            </span>
          </h1>

          <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed">
            Discover food spots, rooftop cafes, fine dining, and pure veg eateries powered by Menuly. Browse live contactless menus, dish counts, locations, and visit storefronts in 1-click.
          </p>

          {/* Quick Platform Stats Pill Bar */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-semibold">
            <div className="flex items-center gap-2 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md px-4 py-2.5 shadow-xs">
              <Store className="size-4 text-primary" />
              <span>
                <strong className="text-foreground">{data?.totalCount ?? "..."}</strong> Verified Restaurants
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md px-4 py-2.5 shadow-xs">
              <Utensils className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                <strong className="text-foreground">{data?.totalDishesAcrossPlatform ?? "..."}</strong> Live Dishes
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md px-4 py-2.5 shadow-xs">
              <QrCode className="size-4 text-amber-500" />
              <span>100% Contactless QR Ready</span>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* SEARCH, CITY FILTERS & CONTROLS BAR (RESPONSIVE NO-EMOJI)    */}
        {/* ------------------------------------------------------------- */}
        <section className="sticky top-16 sm:top-[70px] z-20 px-4 sm:px-6 py-3 bg-background/85 backdrop-blur-xl border-y border-border/60 transition-all shadow-xs">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
            {/* Search Input (Full width on mobile, max-w-md on desktop) */}
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3.5 top-3.5 size-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search restaurant, city, or dish..."
                className="pl-10 pr-16 h-11 rounded-xl bg-card border-border/80 focus:border-primary text-sm shadow-xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-3 text-xs text-muted-foreground hover:text-foreground font-semibold px-2 py-0.5 rounded bg-muted cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Selects Row (Side-by-side 50%/50% on mobile for ultra clean alignment) */}
            <div className="flex items-center gap-2 sm:gap-2.5 text-xs w-full sm:w-auto">
              {/* Sort Selector with Vector SVG Icon */}
              <div className="relative flex-1 sm:w-48 flex items-center">
                <SlidersHorizontal className="absolute left-3 size-3.5 text-primary pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  aria-label="Sort restaurants by"
                  className="w-full h-11 pl-8 pr-7 rounded-xl font-semibold bg-card border border-border/80 text-foreground text-xs focus:ring-1 focus:ring-primary cursor-pointer truncate shadow-xs"
                >
                  <option value="popular">Most Popular</option>
                  <option value="views">Most Scanned</option>
                  <option value="visits">Most Visited</option>
                  <option value="newest">Newest First</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>

              {/* City Filter with Vector SVG Icon */}
              {availableCities.length > 0 && (
                <div className="relative flex-1 sm:w-44 flex items-center">
                  <MapPin className="absolute left-3 size-3.5 text-primary pointer-events-none" />
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    aria-label="Filter restaurants by city"
                    className="w-full h-11 pl-8 pr-7 rounded-xl font-semibold bg-card border border-border/80 text-foreground text-xs focus:ring-1 focus:ring-primary cursor-pointer truncate shadow-xs"
                  >
                    <option value="all">All Locations</option>
                    {availableCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* RESTAURANTS DIRECTORY GRID                                    */}
        {/* ------------------------------------------------------------- */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
          {/* Results Summary */}
          <div className="flex items-center justify-between pb-4 border-b border-border/60 text-xs text-muted-foreground">
            <span>
              Showing <strong className="text-foreground">{filteredRestaurants.length}</strong> of {restaurants.length} active digital restaurants
            </span>
            {(searchTerm || selectedCity !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCity("all");
                }}
                className="text-primary hover:underline font-semibold cursor-pointer"
              >
                Reset all filters
              </button>
            )}
          </div>

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 rounded-2xl bg-card border border-border/60 animate-pulse p-4 space-y-4">
                  <div className="h-36 rounded-xl bg-muted/60" />
                  <div className="h-5 w-3/4 rounded bg-muted/60" />
                  <div className="h-4 w-1/2 rounded bg-muted/60" />
                  <div className="h-10 rounded-xl bg-muted/60 mt-auto" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="text-center py-16 space-y-4">
              <p className="text-sm text-destructive font-semibold">Failed to load restaurant community directory.</p>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          )}

          {/* Empty Search Result */}
          {!isLoading && filteredRestaurants.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border/80 bg-card/40 p-12 text-center my-8 max-w-lg mx-auto space-y-4">
              <div className="flex size-14 mx-auto items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Store className="size-7" />
              </div>
              <h2 className="font-display text-xl font-bold text-foreground">No restaurants found</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We couldn't find any restaurants matching your current search or filter combination.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCity("all");
                }}
                className="rounded-xl font-bold"
              >
                Clear all filters
              </Button>
            </div>
          )}

          {/* Restaurant Card Grid */}
          {!isLoading && filteredRestaurants.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
              {filteredRestaurants.map((restaurant) => {
                const openStatus = isOpenNow(restaurant.hours);

                return (
                  <article
                    key={restaurant.id}
                    onClick={() => navigate({ to: `/restaurants/${restaurant.slug}` as any })}
                    className="group relative flex flex-col justify-between rounded-3xl border border-border/70 bg-card overflow-hidden shadow-xs hover:shadow-soft hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  >
                    {/* Top Media Banner */}
                    <div className="relative h-44 w-full bg-muted overflow-hidden select-none">
                      {restaurant.coverUrl ? (
                        <img
                          src={restaurant.coverUrl}
                          alt={restaurant.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-emerald-900/40 via-primary/30 to-background flex items-center justify-center">
                          <Utensils className="size-10 text-primary/40 animate-pulse" />
                        </div>
                      )}

                      {/* Smooth Dark Vignette for Badges */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                      {/* Floating Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                        {/* Open / Live Status (Creative Solar Amber Pulse Beacon) */}
                        {openStatus ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-black/75 backdrop-blur-xl border border-amber-400/40 shadow-[0_0_14px_rgba(245,158,11,0.35)] text-white select-none">
                            <span className="relative flex size-2 items-center justify-center">
                              <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75 duration-1000" />
                              <span className="relative inline-flex size-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">
                              Live
                            </span>
                            <span className="text-white/30 text-xs">·</span>
                            <span className="font-semibold text-white/95">Open Now</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-medium bg-black/60 backdrop-blur-md border border-white/10 text-white/70 select-none">
                            <Clock className="size-3 text-white/50" />
                            <span>Closed</span>
                          </div>
                        )}

                        {/* Quick Share Button */}
                        <button
                          type="button"
                          onClick={(e) => handleShareRestaurant(restaurant, e)}
                          className="flex size-7 items-center justify-center rounded-full bg-black/50 text-white/90 hover:bg-black/80 hover:text-white transition-colors cursor-pointer backdrop-blur-md"
                          title="Share Restaurant"
                        >
                          <Share2 className="size-3.5" />
                        </button>
                      </div>

                      {/* Floating Branded Logo & Header Name */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-end gap-3">
                        <div className="relative size-14 shrink-0 rounded-2xl border-2 border-background/90 bg-card overflow-hidden shadow-md flex items-center justify-center">
                          {restaurant.logoUrl ? (
                            <img
                              src={restaurant.logoUrl}
                              alt={restaurant.name}
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="size-full bg-primary/10 flex items-center justify-center font-display font-black text-xl text-primary">
                              {restaurant.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 pb-0.5">
                          <h2 className="font-display text-base sm:text-lg font-black text-white truncate drop-shadow-md flex items-center gap-1.5">
                            {restaurant.name}
                            <span title="Verified Digital Menu">
                              <CheckCircle2 className="size-4 text-emerald-400 shrink-0 inline" />
                            </span>
                          </h2>
                          <p className="text-[11px] text-white/80 flex items-center gap-1 truncate drop-shadow-xs">
                            <MapPin className="size-3 text-amber-400 shrink-0" />
                            <span>{restaurant.address || restaurant.city || "India"}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Card Content & Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                      {/* Description / Ambience */}
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {restaurant.description ||
                          `Explore delicious dishes, handcrafted beverages and chef specials at ${restaurant.name}. View digital contactless menu on Menuly.`}
                      </p>

                      {/* Operating Hours */}
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Clock className="size-3.5 text-primary shrink-0" />
                        <span className="truncate">{restaurant.hours || "Mon–Sun, 10:00 AM – 11:00 PM"}</span>
                      </div>

                      {/* Live Metrics Row (Menu Views, Visits, Dishes) */}
                      <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-2xl bg-muted/40 border border-border/60 text-center select-none">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1">
                            <Eye className="size-3 text-primary" /> Views
                          </p>
                          <p className="text-sm font-black text-foreground mt-0.5">
                            {restaurant.menuViews.toLocaleString()}
                          </p>
                        </div>

                        <div className="border-x border-border/60">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1">
                            <Users className="size-3 text-emerald-600 dark:text-emerald-400" /> Visits
                          </p>
                          <p className="text-sm font-black text-foreground mt-0.5">
                            {restaurant.profileVisits.toLocaleString()}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1">
                            <Utensils className="size-3 text-amber-500" /> Dishes
                          </p>
                          <p className="text-sm font-black text-foreground mt-0.5">
                            {restaurant.dishCount}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 flex items-center gap-2">
                        {/* Live Digital Menu Link (Creative Vibrant Flame Glow) */}
                        <a
                          href={`/menu/${restaurant.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-600 hover:via-orange-600 hover:to-rose-700 text-white text-xs font-bold shadow-[0_4px_16px_rgba(245,158,11,0.3)] hover:shadow-[0_6px_22px_rgba(245,158,11,0.45)] border border-amber-300/30 transition-all duration-200 cursor-pointer"
                        >
                          <span className="relative flex size-1.5 items-center justify-center">
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-80" />
                            <span className="relative inline-flex size-1.5 rounded-full bg-white" />
                          </span>
                          <QrCode className="size-3.5" />
                          <span>Live Menu</span>
                          <ExternalLink className="size-3 opacity-80" />
                        </a>

                        {/* View Storefront Profile */}
                        <Link
                          to={`/restaurants/${restaurant.slug}` as any}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-xl bg-card hover:bg-muted text-foreground border border-border/80 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <span>Storefront</span>
                          <ArrowRight className="size-3 text-muted-foreground" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>

        {/* ------------------------------------------------------------- */}
        {/* BOTTOM CALL TO ACTION: ADD YOUR RESTAURANT TO DIRECTORY       */}
        {/* ------------------------------------------------------------- */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 text-center">
          <div className="relative rounded-3xl border border-primary/25 bg-gradient-to-b from-primary/10 via-card to-card p-8 sm:p-12 overflow-hidden shadow-soft">
            <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md mb-4">
              <Sparkles className="size-7" />
            </div>

            <h2 className="font-display text-2xl sm:text-4xl font-black text-foreground tracking-tight">
              Own a restaurant or food business?
            </h2>

            <p className="mt-2.5 max-w-xl mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Join the Menuly Community. Get your instant luxury contactless QR digital menu, table-ordering stands, and a dedicated public storefront in less than 60 seconds.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => navigate({ to: "/auth", search: { mode: "signup" } })}
                className="w-full sm:w-auto h-12 px-8 rounded-2xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft cursor-pointer"
              >
                Create Your Digital Menu Free <ArrowRight className="size-4 ml-1.5" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate({ to: "/how-to-use" })}
                className="w-full sm:w-auto h-12 px-6 rounded-2xl font-semibold cursor-pointer"
              >
                See How It Works
              </Button>
            </div>
          </div>
        </section>
      </div>
    </SitePage>
  );
}
