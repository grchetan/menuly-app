import { prisma } from "../db";

const BASE_SITE_URL = "https://www.menulyindia.online";
const SITEMAP_CACHE_TTL_MS = 5 * 60 * 1000;

let cachedSitemap: { xml: string; expiresAt: number } | null = null;

function escapeXml(val: string): string {
  return val
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const CORE_ROUTES: Array<{ path: string; priority: string; freq: string }> = [
  { path: "", priority: "1.0", freq: "daily" },
  { path: "/shop", priority: "0.9", freq: "daily" },
  { path: "/restaurants", priority: "0.9", freq: "daily" },
  { path: "/how-to-use", priority: "0.8", freq: "weekly" },
  { path: "/menu/menuly-official", priority: "0.8", freq: "weekly" },
  { path: "/about", priority: "0.7", freq: "monthly" },
  { path: "/contact", priority: "0.7", freq: "monthly" },
  { path: "/community", priority: "0.7", freq: "weekly" },
  { path: "/terms", priority: "0.4", freq: "monthly" },
  { path: "/privacy", priority: "0.4", freq: "monthly" },
  { path: "/shipping", priority: "0.4", freq: "monthly" },
  { path: "/refund", priority: "0.4", freq: "monthly" },
  { path: "/cancellation-refund", priority: "0.4", freq: "monthly" },
  { path: "/cookies", priority: "0.3", freq: "monthly" },
];

export function invalidateSitemapCache(): void {
  cachedSitemap = null;
}

export async function generateDynamicSitemapXml(baseUrl = BASE_SITE_URL): Promise<string> {
  if (cachedSitemap && cachedSitemap.expiresAt > Date.now()) {
    return cachedSitemap.xml;
  }

  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const today = new Date().toISOString().split("T")[0];
  const entries: string[] = [];

  for (const page of CORE_ROUTES) {
    entries.push(
      `  <url>\n    <loc>${escapeXml(`${normalizedBase}${page.path}`)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${page.freq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>`
    );
  }

  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 1000,
    });

    const seenSlugs = new Set<string>(["menuly-official"]);
    for (const rest of restaurants) {
      if (!rest.slug || seenSlugs.has(rest.slug)) continue;
      // Skip synthetic test slugs
      if (rest.slug.startsWith("vitest-")) continue;
      seenSlugs.add(rest.slug);

      const lastMod = rest.updatedAt ? rest.updatedAt.toISOString().split("T")[0] : today;
      const encodedSlug = encodeURIComponent(rest.slug);
      entries.push(
        `  <url>\n    <loc>${escapeXml(`${normalizedBase}/restaurants/${encodedSlug}`)}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`
      );
      entries.push(
        `  <url>\n    <loc>${escapeXml(`${normalizedBase}/menu/${encodedSlug}`)}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`
      );
    }
  } catch (err) {
    console.warn("[Sitemap] Failed to query live restaurants, serving core routes:", err);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join(
    "\n"
  )}\n</urlset>\n`;

  cachedSitemap = { xml, expiresAt: Date.now() + SITEMAP_CACHE_TTL_MS };
  return xml;
}
