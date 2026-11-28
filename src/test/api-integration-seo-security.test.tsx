import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import serverHandler from "../server";
import { handleApiRoute } from "../server/router";
import { getSafeRedirectPath } from "../lib/safe-redirect";
import { signAccessToken } from "../server/auth/security";
import { createShopPaymentSession } from "../server/shop/service";
import { createOrder } from "../server/orders/service";
import { prisma } from "../server/db";
import { generateDynamicSitemapXml } from "../server/seo/sitemap";
import { AnnouncementMarquee } from "../components/AnnouncementMarquee";
import { MenuView } from "../components/MenuView";
import { INITIAL_DEMO_MENU, type FullMenu } from "../lib/restaurant";

describe("Menuly Integration, Security, SEO & Responsive UI Suite", () => {
  let testUserId = "";
  let testUserToken = "";
  let otherUserToken = "";
  let testRestId = "";
  const cleanupOrderIds: string[] = [];

  beforeAll(async () => {
    const email = "vitest-integration@menuly.test";
    let user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, fullName: true },
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: "vitest_hash_placeholder",
          fullName: "Vitest Integration User",
          role: "RESTAURANT_OWNER",
        },
        select: { id: true, email: true, role: true, fullName: true },
      });
    }
    testUserId = user.id;
    testUserToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: "RESTAURANT_OWNER",
      fullName: user.fullName,
    });
    otherUserToken = signAccessToken({
      userId: "other-vitest-user-id",
      email: "other@menuly.test",
      role: "RESTAURANT_OWNER",
      fullName: "Other User",
    });

    let rest = await prisma.restaurant.findUnique({
      where: { slug: "vitest-integration-kitchen" },
      select: { id: true },
    });
    if (!rest) {
      rest = await prisma.restaurant.create({
        data: {
          ownerId: user.id,
          name: "Vitest Integration Kitchen",
          slug: "vitest-integration-kitchen",
          isActive: false,
        },
        select: { id: true },
      });
    }
    testRestId = rest.id;
  });

  afterAll(async () => {
    if (cleanupOrderIds.length > 0) {
      await prisma.order.deleteMany({ where: { id: { in: cleanupOrderIds } } }).catch(() => {});
    }
    if (testRestId) {
      await prisma.menuItem.deleteMany({ where: { restaurantId: testRestId } }).catch(() => {});
      await prisma.category.deleteMany({ where: { restaurantId: testRestId } }).catch(() => {});
    }
  });

  describe("1. Redirect & Security Guardrail Verification", () => {
    it("blocks external, protocol-relative, backslash, and scheme-based open redirects", () => {
      expect(getSafeRedirectPath("/shop?checkout=1")).toBe("/shop?checkout=1");
      expect(getSafeRedirectPath("/dashboard#analytics")).toBe("/dashboard#analytics");

      expect(getSafeRedirectPath("https://evil.example/phish")).toBe("/");
      expect(getSafeRedirectPath("//evil.example/phish")).toBe("/");
      expect(getSafeRedirectPath("/\\evil.example")).toBe("/");
      expect(getSafeRedirectPath("javascript:alert(1)")).toBe("/");
      expect(getSafeRedirectPath("", "/dashboard")).toBe("/dashboard");
    });

    it("enforces strict CORS origin allowlist on sensitive endpoints", async () => {
      const req = new Request("https://www.menulyindia.online/api/auth/login", {
        method: "OPTIONS",
        headers: { Origin: "https://malicious-third-party.vercel.app" },
      });
      const res = await handleApiRoute(req);
      expect(res).not.toBeNull();
      expect(res!.headers.get("Access-Control-Allow-Origin")).toBeNull();

      const allowedReq = new Request("https://www.menulyindia.online/api/auth/login", {
        method: "OPTIONS",
        headers: { Origin: "https://www.menulyindia.online" },
      });
      const allowedRes = await handleApiRoute(allowedReq);
      expect(allowedRes!.headers.get("Access-Control-Allow-Origin")).toBe("https://www.menulyindia.online");
    });

    it("blocks demoEmail Google auth bypass when NODE_ENV=production or targeting admin", async () => {
      const origEnv = process.env["NODE_ENV"];
      try {
        process.env["NODE_ENV"] = "production";
        const res = await handleApiRoute(
          new Request("https://www.menulyindia.online/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ demoEmail: "victim@menuly.test" }),
          })
        );
        expect(res).not.toBeNull();
        expect(res!.status).toBe(400);
      } finally {
        process.env["NODE_ENV"] = origEnv;
      }

      // Even outside production, demoEmail cannot target SUPER_ADMIN_EMAIL
      const prevAdmin = process.env["SUPER_ADMIN_EMAIL"];
      try {
        process.env["SUPER_ADMIN_EMAIL"] = "boss-admin@menuly.test";
        const adminAttempt = await handleApiRoute(
          new Request("https://www.menulyindia.online/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ demoEmail: "boss-admin@menuly.test" }),
          })
        );
        if (!process.env["GOOGLE_CLIENT_ID"]) {
          expect(adminAttempt!.status).toBe(403);
        }
      } finally {
        if (prevAdmin === undefined) delete process.env["SUPER_ADMIN_EMAIL"];
        else process.env["SUPER_ADMIN_EMAIL"] = prevAdmin;
      }
    });

    it("rejects unauthenticated bank-webhook calls and enforces payment session ownership (IDOR protection)", async () => {
      const webhookRes = await handleApiRoute(
        new Request("https://www.menulyindia.online/api/shop/payments/bank-webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: 499.01, utr: "123456789012" }),
        })
      );
      expect(webhookRes!.status).toBe(401);

      const statusUnauth = await handleApiRoute(
        new Request("https://www.menulyindia.online/api/shop/payments/status?sessionId=fake_sess")
      );
      expect(statusUnauth!.status).toBe(401);

      const session = await createShopPaymentSession({
        userId: testUserId,
        customerName: "Vitest Buyer",
        customerPhone: "9876543210",
        amount: 499,
      });

      const idorRes = await handleApiRoute(
        new Request(`https://www.menulyindia.online/api/shop/payments/status?sessionId=${session.id}`, {
          headers: { Authorization: `Bearer ${otherUserToken}` },
        })
      );
      expect(idorRes!.status).toBe(403);

      const ownerRes = await handleApiRoute(
        new Request(`https://www.menulyindia.online/api/shop/payments/status?sessionId=${session.id}`, {
          headers: { Authorization: `Bearer ${testUserToken}` },
        })
      );
      expect(ownerRes!.status).toBe(200);
    });

    it("rejects oversized AI scan payloads and supports authenticated menu backup restoration", async () => {
      const giantPayload = "A".repeat(8 * 1024 * 1024 + 10);
      const scanRes = await handleApiRoute(
        new Request("https://www.menulyindia.online/api/restaurant/ai-menu/scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${testUserToken}`,
          },
          body: JSON.stringify({ imageBase64: giantPayload }),
        })
      );
      expect(scanRes!.status).toBe(413);

      const unauthRestore = await handleApiRoute(
        new Request("https://www.menulyindia.online/api/restaurant/restore-backup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categories: [] }),
        })
      );
      expect(unauthRestore!.status).toBe(401);

      const badRestore = await handleApiRoute(
        new Request("https://www.menulyindia.online/api/restaurant/restore-backup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${testUserToken}`,
          },
          body: JSON.stringify({ categories: [] }),
        })
      );
      expect(badRestore!.status).toBe(400);

      const goodRestore = await handleApiRoute(
        new Request("https://www.menulyindia.online/api/restaurant/restore-backup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${testUserToken}`,
          },
          body: JSON.stringify({
            mode: "replace",
            categories: [
              {
                name: "Restored Combos",
                items: [
                  {
                    name: "Royal Thali",
                    price: 299,
                    isVeg: true,
                    imageUrl: "javascript:alert(1)",
                  },
                ],
              },
            ],
          }),
        })
      );
      expect(goodRestore!.status).toBe(200);
      const out = await goodRestore!.json();
      expect(out.success).toBe(true);
      expect(out.createdDishesCount).toBe(1);

      const savedItem = await prisma.menuItem.findFirst({
        where: { restaurantId: testRestId, name: "Royal Thali" },
      });
      expect(savedItem).not.toBeNull();
      expect(savedItem?.imageUrl?.startsWith("javascript:")).toBe(false);
    });

    it("enforces authoritative DB dish prices and rejects out-of-stock dishes during table ordering", async () => {
      await prisma.menuItem.deleteMany({ where: { restaurantId: testRestId } });
      await prisma.category.deleteMany({ where: { restaurantId: testRestId } });

      const cat = await prisma.category.create({
        data: { restaurantId: testRestId, name: "Test Cat", position: 0 },
      });
      const activeDish = await prisma.menuItem.create({
        data: {
          restaurantId: testRestId,
          categoryId: cat.id,
          name: "Authoritative Paneer",
          price: 320,
          isVeg: true,
          available: true,
          position: 0,
        },
      });
      const soldOutDish = await prisma.menuItem.create({
        data: {
          restaurantId: testRestId,
          categoryId: cat.id,
          name: "Sold Out Kulfi",
          price: 90,
          isVeg: true,
          available: false,
          position: 1,
        },
      });

      // Attempt to tamper item price to ₹1 — backend must use ₹320 from DB
      const tamperedRes = await createOrder({
        restaurantId: testRestId,
        tableNumber: "T1",
        customerPhone: "9876543210",
        items: [{ id: activeDish.id, name: "Authoritative Paneer", price: 1, quantity: 2 }],
      });
      expect(tamperedRes.success).toBe(true);
      expect(tamperedRes.order?.grandTotal).toBe(640);
      if (tamperedRes.order) cleanupOrderIds.push(tamperedRes.order.id);

      // Unauthenticated order tracking must mask phone number
      const trackRes = await handleApiRoute(
        new Request(`https://www.menulyindia.online/api/orders/track?orderId=${encodeURIComponent(tamperedRes.order!.id)}`)
      );
      expect(trackRes!.status).toBe(200);
      const trackJson = await trackRes!.json();
      expect(trackJson.order.customerPhone).toBe("******3210");

      // Ordering an out-of-stock dish must be rejected
      const stockRes = await createOrder({
        restaurantId: testRestId,
        tableNumber: "T2",
        items: [{ id: soldOutDish.id, name: "Sold Out Kulfi", price: 90, quantity: 1 }],
      });
      expect(stockRes.success).toBe(false);
      expect(stockRes.status).toBe(400);
    });
  });

  describe("2. Dynamic XML Sitemap & HTTP Security Headers", () => {
    it("serves valid XML from /sitemap.xml with security headers and excludes admin routes", async () => {
      const xml = await generateDynamicSitemapXml();
      expect(xml).toContain("<urlset");
      expect(xml).toContain("https://www.menulyindia.online/shop</loc>");
      expect(xml).toContain("https://www.menulyindia.online/restaurants</loc>");
      expect(xml).not.toContain("/admin</loc>");
      expect(xml).not.toContain("/dashboard</loc>");

      const res = await serverHandler.fetch(
        new Request("https://www.menulyindia.online/sitemap.xml"),
        {},
        {}
      );
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("application/xml");
      expect(res.headers.get("x-content-type-options")).toBe("nosniff");
      expect(res.headers.get("x-frame-options")).toBe("DENY");
      expect(res.headers.get("strict-transport-security")).toContain("max-age=31536000");
    });
  });

  describe("3. UI Hook Integrity & Responsive Menu Filters", () => {
    it("toggles AnnouncementMarquee safely between empty/disabled and active without Rules-of-Hooks crashes", () => {
      const { rerender, container } = render(<AnnouncementMarquee enabled={false} text="" />);
      expect(container.firstChild).toBeNull();

      rerender(<AnnouncementMarquee enabled={true} text="Offer 1 | Offer 2" />);
      expect(screen.getAllByText("Offer 1").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Offer 2").length).toBeGreaterThanOrEqual(1);
    });

    it("filters non-vegetarian dishes when diner clicks Veg filter pill on MenuView", () => {
      const mixedMenu: FullMenu = {
        ...INITIAL_DEMO_MENU,
        restaurant: { ...INITIAL_DEMO_MENU.restaurant, isPureVeg: false },
        categories: [
          {
            id: "cat-1",
            restaurant_id: INITIAL_DEMO_MENU.restaurant.id,
            name: "Main Course",
            position: 0,
            created_at: new Date().toISOString(),
          },
        ],
        items: [
          {
            id: "veg-1",
            restaurant_id: INITIAL_DEMO_MENU.restaurant.id,
            category_id: "cat-1",
            name: "Veg Paneer Tikka Masala",
            description: "Rich creamy tomato gravy",
            price: 260,
            image_url: null,
            is_veg: true,
            available: true,
            position: 0,
            created_at: new Date().toISOString(),
          },
          {
            id: "nonveg-1",
            restaurant_id: INITIAL_DEMO_MENU.restaurant.id,
            category_id: "cat-1",
            name: "Murgh Makhani Classic",
            description: "Slow-simmered butter chicken",
            price: 340,
            image_url: null,
            is_veg: false,
            available: true,
            position: 1,
            created_at: new Date().toISOString(),
          },
        ],
      };

      render(<MenuView menu={mixedMenu} compact />);
      expect(screen.getAllByText("Veg Paneer Tikka Masala").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Murgh Makhani Classic").length).toBeGreaterThanOrEqual(1);

      const vegButton = screen.getByRole("button", { name: /veg/i });
      fireEvent.click(vegButton);

      expect(screen.getAllByText("Veg Paneer Tikka Masala").length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText("Murgh Makhani Classic")).toBeNull();

      fireEvent.click(vegButton);
      expect(screen.getAllByText("Murgh Makhani Classic").length).toBeGreaterThanOrEqual(1);
    });
  });
});
