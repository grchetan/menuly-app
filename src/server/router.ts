import {
  signupUser,
  verifyUserOtp,
  resendUserOtp,
  loginUser,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  seedSuperAdmin,
} from "./auth/service";
import { verifyAccessToken } from "./auth/security";
import { userStore } from "./auth/store";
import { checkDatabaseConnection, prisma } from "./db";
import {
  getOrCreateUserRestaurant,
  updateRestaurant,
  addCategory,
  renameCategory,
  deleteCategory,
  addDish,
  updateDish,
  deleteDish,
  toggleDishAvailable,
  getPublicRestaurantMenu,
  getAllRestaurantsForAdmin,
  applyPresetToRestaurant,
  getTablesForRestaurant,
  saveTableForRestaurant,
  deleteTableForRestaurant,
  bulkCreateTablesForRestaurant,
} from "./restaurant/service";

function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      ...headers,
    },
  });
}

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
  // Also check cookie if present
  const cookie = req.headers.get("cookie");
  if (cookie) {
    const match = cookie.match(/menuly_token=([^;]+)/);
    if (match && match[1]) return decodeURIComponent(match[1]);
  }
  return null;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * Handle all /api/* requests with high-performance native Web Request/Response
 */
export async function handleApiRoute(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Handle CORS Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Only handle /api/* routes
  if (!pathname.startsWith("/api/")) {
    return null;
  }

  const clientIp = getClientIp(request);

  try {
    // --------------------------------------------------------------------------
    // SYSTEM HEALTH & DIAGNOSTICS: /api/health
    // --------------------------------------------------------------------------
    if (pathname === "/api/health" && request.method === "GET") {
      const dbStatus = await checkDatabaseConnection();
      return json({
        status: "ok",
        platform: "Menuly",
        timestamp: new Date().toISOString(),
        database: dbStatus,
        smtp: {
          user: process.env["SMTP_USER"] || "menulyoffcial@gmail.com",
          configured: Boolean(process.env["SMTP_PASS"] && process.env["SMTP_PASS"] !== ""),
        },
      });
    }

    // --------------------------------------------------------------------------
    // 1. SIGNUP: POST /api/auth/signup
    // --------------------------------------------------------------------------
    if (pathname === "/api/auth/signup" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const res = await signupUser({
        email: body.email,
        password: body.password,
        fullName: body.fullName,
        clientIp,
      });
      return json(res, res.status);
    }

    // --------------------------------------------------------------------------
    // 2. VERIFY OTP: POST /api/auth/verify-otp
    // --------------------------------------------------------------------------
    if (pathname === "/api/auth/verify-otp" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const res = await verifyUserOtp({
        email: body.email,
        otp: body.otp,
        type: body.type || "SIGNUP",
        clientIp,
      });
      return json(res, res.status);
    }

    // --------------------------------------------------------------------------
    // 3. RESEND OTP: POST /api/auth/resend-otp
    // --------------------------------------------------------------------------
    if (pathname === "/api/auth/resend-otp" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const res = await resendUserOtp({
        email: body.email,
        type: body.type || "SIGNUP",
        clientIp,
      });
      return json(res, res.status);
    }

    // --------------------------------------------------------------------------
    // 4. LOGIN: POST /api/auth/login
    // --------------------------------------------------------------------------
    if (pathname === "/api/auth/login" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const res = await loginUser({
        email: body.email,
        password: body.password,
        clientIp,
      });
      return json(res, res.status);
    }

    // --------------------------------------------------------------------------
    // 5. FORGOT PASSWORD: POST /api/auth/forgot-password
    // --------------------------------------------------------------------------
    if (pathname === "/api/auth/forgot-password" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const res = await forgotPassword({
        email: body.email,
        clientIp,
      });
      return json(res, res.status);
    }

    // --------------------------------------------------------------------------
    // 6. RESET PASSWORD: POST /api/auth/reset-password
    // --------------------------------------------------------------------------
    if (pathname === "/api/auth/reset-password" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const res = await resetPassword({
        email: body.email,
        otp: body.otp,
        newPassword: body.newPassword,
      });
      return json(res, res.status);
    }

    // --------------------------------------------------------------------------
    // 7. LOGOUT: POST /api/auth/logout
    // --------------------------------------------------------------------------
    if (pathname === "/api/auth/logout" && request.method === "POST") {
      return json({ success: true, message: "Logged out successfully." });
    }

    // --------------------------------------------------------------------------
    // 8. GET CURRENT USER: GET /api/auth/me
    // --------------------------------------------------------------------------
    if (pathname === "/api/auth/me" && request.method === "GET") {
      const token = extractBearerToken(request);
      const res = await getCurrentUser(token);
      return json(res, res.status);
    }

    // --------------------------------------------------------------------------
    // PUBLIC CUSTOMER QR SCAN: GET /api/public/menu/:slug
    // --------------------------------------------------------------------------
    if (pathname.startsWith("/api/public/menu/") && request.method === "GET") {
      const slug = pathname.replace("/api/public/menu/", "").trim();
      const table = url.searchParams.get("table") || undefined;
      const menu = await getPublicRestaurantMenu(slug, table, clientIp);
      if (!menu) {
        return json({ error: "Restaurant menu not found or currently paused." }, 404);
      }
      return json({ success: true, ...menu });
    }

    // --------------------------------------------------------------------------
    // RESTAURANT OWNER APIs (Protected with JWT)
    // --------------------------------------------------------------------------
    if (pathname.startsWith("/api/restaurant/")) {
      const token = extractBearerToken(request);
      if (!token) {
        return json({ error: "Authentication required. Please log in." }, 401);
      }
      const auth = verifyAccessToken(token);
      if (!auth) {
        return json({ error: "Session expired. Please log in again." }, 401);
      }

      // 1. GET /api/restaurant/my-menu
      if (pathname === "/api/restaurant/my-menu" && request.method === "GET") {
        const menu = await getOrCreateUserRestaurant(auth.userId, auth.email, auth.fullName);
        return json({ success: true, ...menu });
      }

      // 2. POST /api/restaurant/update
      if (pathname === "/api/restaurant/update" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const updated = await updateRestaurant(auth.userId, body);
        return json({ success: true, message: "Restaurant profile saved.", restaurant: updated });
      }

      // 3. POST /api/restaurant/category/add
      if (pathname === "/api/restaurant/category/add" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        if (!body.name?.trim()) {
          return json({ error: "Category name is required" }, 400);
        }
        const cat = await addCategory(auth.userId, body.name);
        return json({ success: true, category: cat });
      }

      // 4. POST /api/restaurant/category/rename
      if (pathname === "/api/restaurant/category/rename" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        if (!body.id || !body.name?.trim()) {
          return json({ error: "Category ID and name are required" }, 400);
        }
        await renameCategory(auth.userId, body.id, body.name);
        return json({ success: true, message: "Category renamed" });
      }

      // 5. POST /api/restaurant/category/delete
      if (pathname === "/api/restaurant/category/delete" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        if (!body.id) {
          return json({ error: "Category ID required" }, 400);
        }
        await deleteCategory(auth.userId, body.id);
        return json({ success: true, message: "Category deleted" });
      }

      // 6. POST /api/restaurant/item/add
      if (pathname === "/api/restaurant/item/add" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        if (!body.name?.trim() || !body.categoryId) {
          return json({ error: "Dish name and category are required" }, 400);
        }
        const item = await addDish(auth.userId, {
          categoryId: body.categoryId,
          name: body.name,
          price: Number(body.price) || 0,
          description: body.description,
          imageUrl: body.imageUrl,
          isVeg: body.isVeg ?? true,
        });
        return json({ success: true, item });
      }

      // 7. POST /api/restaurant/item/update
      if (pathname === "/api/restaurant/item/update" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        if (!body.id) {
          return json({ error: "Item ID required" }, 400);
        }
        const item = await updateDish(auth.userId, body.id, body.updates || {});
        return json({ success: true, item });
      }

      // 8. POST /api/restaurant/item/delete
      if (pathname === "/api/restaurant/item/delete" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        if (!body.id) {
          return json({ error: "Item ID required" }, 400);
        }
        await deleteDish(auth.userId, body.id);
        return json({ success: true, message: "Dish removed" });
      }

      // 9. POST /api/restaurant/item/toggle-available
      if (pathname === "/api/restaurant/item/toggle-available" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        if (!body.id) {
          return json({ error: "Item ID required" }, 400);
        }
        const updated = await toggleDishAvailable(auth.userId, body.id);
        return json({ success: true, item: updated });
      }

      // 10. POST /api/restaurant/preset (Load complete starter pack directly into database)
      if (pathname === "/api/restaurant/preset" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        if (!body.presetId) {
          return json({ error: "Preset ID required" }, 400);
        }
        const updated = await applyPresetToRestaurant(auth.userId, body.presetId);
        return json({ success: true, message: "Starter menu pack loaded into database.", ...updated });
      }

      // 11. GET /api/restaurant/tables
      if (pathname === "/api/restaurant/tables" && request.method === "GET") {
        const tables = await getTablesForRestaurant(auth.userId);
        return json({ success: true, tables });
      }

      // 12. POST /api/restaurant/tables/save
      if (pathname === "/api/restaurant/tables/save" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        if (!body.tableNumber?.trim()) {
          return json({ error: "Table number is required" }, 400);
        }
        const table = await saveTableForRestaurant(auth.userId, body.tableNumber, body.label);
        return json({ success: true, table });
      }

      // 13. POST /api/restaurant/tables/delete
      if (pathname === "/api/restaurant/tables/delete" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        if (!body.id) {
          return json({ error: "Table ID is required" }, 400);
        }
        await deleteTableForRestaurant(auth.userId, body.id);
        return json({ success: true, message: "Table removed" });
      }

      // 14. POST /api/restaurant/tables/bulk
      if (pathname === "/api/restaurant/tables/bulk" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const count = Number(body.count) || 10;
        const prefix = body.prefix || "Table ";
        const tables = await bulkCreateTablesForRestaurant(auth.userId, count, prefix);
        return json({ success: true, tables });
      }
    }

    // --------------------------------------------------------------------------
    // 9. SUPER ADMIN PROTECTED APIS
    // --------------------------------------------------------------------------
    if (pathname.startsWith("/api/admin/")) {
      const token = extractBearerToken(request);
      if (!token) {
        return json({ error: "Unauthorized. Authentication token required." }, 401);
      }

      const payload = verifyAccessToken(token);
      if (!payload || payload.role !== "SUPER_ADMIN") {
        return json(
          { error: "Forbidden. Super Admin access privileges required." },
          403
        );
      }

      // GET /api/admin/users
      if (pathname === "/api/admin/users" && request.method === "GET") {
        const users = await userStore.getAllUsers();
        return json({
          success: true,
          users: users.map((u) => ({
            id: u.id,
            email: u.email,
            role: u.role,
            fullName: u.fullName,
            isVerified: u.isVerified,
            createdAt: u.createdAt,
          })),
        });
      }

      // GET /api/admin/restaurants
      if (pathname === "/api/admin/restaurants" && request.method === "GET") {
        const rests = await getAllRestaurantsForAdmin();
        return json({
          success: true,
          restaurants: rests,
        });
      }

      // POST /api/admin/restaurant/toggle-status
      if (pathname === "/api/admin/restaurant/toggle-status" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        if (!body.id) return json({ error: "Restaurant ID required" }, 400);
        const current = await prisma.restaurant.findUnique({ where: { id: body.id } });
        if (!current) return json({ error: "Restaurant not found" }, 404);
        const updated = await prisma.restaurant.update({
          where: { id: body.id },
          data: { isActive: !current.isActive },
        });
        return json({ success: true, status: updated.isActive ? "active" : "suspended" });
      }

      // POST /api/admin/seed
      if (pathname === "/api/admin/seed" && request.method === "POST") {
        const admin = await seedSuperAdmin();
        return json({ success: true, message: `Super admin ready: ${admin.email}` });
      }

      // Default Admin Route
      return json({ success: true, message: "Admin API online" });
    }

    // Route not found in /api/*
    return json({ error: "API endpoint not found" }, 404);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API Error]", message);
    return json({ error: "Internal Server Error", message }, 500);
  }
}
