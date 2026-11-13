import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { UtensilsCrossed, ArrowRight, Home, QrCode } from "lucide-react";
import { getPublicMenu } from "@/lib/menu.functions";
import { MenuView } from "@/components/MenuView";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { recordQRScan } from "@/lib/api";
import type { FullMenu } from "@/lib/restaurant";

type MenuSearch = {
  table?: string | undefined;
};

const CACHE_PREFIX = "menuly_cached_menu_";
const CACHE_TIME_PREFIX = "menuly_cached_menu_time_";

function MenuComponent() {
  const menu = Route.useLoaderData();
  const search = Route.useSearch();
  const table = search.table;

  useEffect(() => {
    if (menu?.restaurant?.slug) {
      try {
        localStorage.setItem(`${CACHE_PREFIX}${menu.restaurant.slug}`, JSON.stringify(menu));
        localStorage.setItem(`${CACHE_TIME_PREFIX}${menu.restaurant.slug}`, Date.now().toString());
      } catch (err) {
        console.warn("Could not cache menu to localStorage:", err);
      }
    }
  }, [menu]);

  useEffect(() => {
    if (menu?.restaurant?.id) {
      recordQRScan({
        restaurantId: menu.restaurant.id,
        slug: menu.restaurant.slug,
        tableNumber: table,
      });
    }
  }, [menu?.restaurant?.id, menu?.restaurant?.slug, table]);

  // Schema.org Restaurant + Menu Structured Data for Google Local Search
  const restaurantSchema = useMemo(() => {
    if (!menu?.restaurant) return null;
    const r = menu.restaurant;
    return {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "name": r.name,
      "url": `https://www.menulyindia.online/menu/${r.slug}`,
      "telephone": r.phone || undefined,
      "servesCuisine": r.isPureVeg ? "Pure Vegetarian" : "Multi-Cuisine",
      "image": r.cover_url || r.logo_url || undefined,
      "address": r.address
        ? {
            "@type": "PostalAddress",
            "streetAddress": r.address,
            "addressCountry": "IN",
          }
        : undefined,
      "hasMenu": {
        "@type": "Menu",
        "name": `${r.name} Food Menu`,
        "hasMenuSection": (menu.categories || []).map((cat) => ({
          "@type": "MenuSection",
          "name": cat.name,
          "hasMenuItem": (menu.items || [])
            .filter((item) => item.category_id === cat.id)
            .map((item) => ({
              "@type": "MenuItem",
              "name": item.name,
              "description": item.description || undefined,
              "offers": {
                "@type": "Offer",
                "price": item.price,
                "priceCurrency": "INR",
              },
            })),
        })),
      },
    };
  }, [menu]);

  return (
    <>
      {restaurantSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }}
        />
      )}
      <MenuView menu={menu} table={table} />
    </>
  );
}

function OfflineOrNotFound() {
  const params = Route.useParams();
  const search = Route.useSearch();
  const slug = params?.slug;

  const [cachedMenu, setCachedMenu] = useState<FullMenu | null>(null);
  const [cachedDate, setCachedDate] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && slug) {
      try {
        const raw = localStorage.getItem(`${CACHE_PREFIX}${slug}`);
        const time = localStorage.getItem(`${CACHE_TIME_PREFIX}${slug}`);
        if (raw) {
          const parsed = JSON.parse(raw) as FullMenu;
          if (parsed?.restaurant?.name) {
            setCachedMenu(parsed);
            if (time) {
              setCachedDate(
                new Date(Number(time)).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              );
            }
          }
        }
      } catch (e) {
        console.warn("Failed reading cached menu", e);
      } finally {
        setChecked(true);
      }
    } else {
      setChecked(true);
    }
  }, [slug]);

  if (!checked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (cachedMenu) {
    return (
      <MenuView
        menu={cachedMenu}
        table={search?.table}
        isOfflineCache={true}
        cachedDate={cachedDate}
      />
    );
  }

  return <MenuNotFound />;
}

export const Route = createFileRoute("/menu/$slug")({
  validateSearch: (search: Record<string, unknown>): MenuSearch => {
    const raw = search["table"] ?? search["t"] ?? search["tableNumber"] ?? search["table_number"];
    const tableStr = raw !== undefined && raw !== null ? String(raw).trim() : undefined;
    return {
      table: tableStr || undefined,
    };
  },
  loader: async ({ params }) => {
    try {
      const menu = await getPublicMenu({ data: params.slug });
      if (!menu) throw notFound();
      return menu;
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => {
    const r = loaderData?.restaurant;
    const name = r?.name ?? "Restaurant Menu";
    const address = r?.address ? `, ${r.address}` : "";
    const desc = loaderData
      ? `Browse live food menu, prices, and specials for ${name}${address}. Instant contactless ordering on Menuly.`
      : "Explore contactless food menu and dish prices.";
    const slug = r?.slug ?? "";
    const canonicalUrl = `https://www.menulyindia.online/menu/${slug}`;
    const cover = r?.cover_url || r?.logo_url || "https://www.menulyindia.online/assets/menuly-banner.png";

    return {
      meta: [
        { title: `${name} — Digital Food Menu & Online Prices | Menuly` },
        { name: "description", content: desc },
        {
          name: "keywords",
          content: `${name} menu, ${name} food prices, ${name} online menu, ${name} dishes, digital menu ${name}, contactless menu India, Menuly`,
        },
        { property: "og:type", content: "restaurant.menu" },
        { property: "og:site_name", content: "Menuly India" },
        { property: "og:title", content: `${name} — Interactive Digital Food Menu` },
        { property: "og:description", content: desc },
        { property: "og:url", content: canonicalUrl },
        { property: "og:image", content: cover },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: `${name} — Digital Food Menu & Prices` },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: cover },
      ],
      links: [
        { rel: "canonical", href: canonicalUrl },
      ],
    };
  },
  notFoundComponent: OfflineOrNotFound,
  errorComponent: OfflineOrNotFound,
  component: MenuComponent,
});

function MenuNotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-between bg-hero px-4 py-8 text-foreground">
      {/* Decorative Blur */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 size-80 rounded-full bg-primary/10 blur-3xl" />
      </div>

      {/* Brand Header */}
      <header className="relative z-10 w-full max-w-md flex justify-center py-2">
        <Link to="/" className="transition-opacity hover:opacity-85">
          <Logo />
        </Link>
      </header>

      {/* Main Card */}
      <main className="relative z-10 my-auto w-full max-w-md animate-rise rounded-3xl border border-border/70 bg-card/95 p-7 text-center shadow-lift backdrop-blur-md sm:p-9">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-secondary text-primary shadow-soft">
          <UtensilsCrossed className="size-8" />
        </div>

        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Menu Not Found
        </h1>

        <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
          This digital menu isn't available. The restaurant link might be mistyped or the QR code has expired.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <Button size="lg" asChild className="gap-2 shadow-soft">
            <Link to="/">
              <Home className="size-4" /> Go to Menuly
            </Link>
          </Button>
        </div>

        {/* Callout for Restaurant Owner */}
        <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-left">
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <QrCode className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Are you a restaurant owner?</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Set up a beautiful QR menu for your restaurant in just 5 minutes.
              </p>
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Create your free menu <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-xs text-muted-foreground text-center pt-4">
        <a
          href="https://www.menulyindia.online/"
          target="_blank"
          rel="noreferrer"
          className="hover:text-primary transition-colors inline-block"
        >
          Powered by Menuly &bull; Smart QR menus for modern dining
        </a>
      </footer>
    </div>
  );
}
