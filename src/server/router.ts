import {
  checkEmailAvailability,
  signupUser,
  verifyUserOtp,
  sendPhoneVerificationOtp,
  verifyPhoneVerificationOtp,
  resendUserOtp,
  loginUser,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateUserProfile,
  changeUserPassword,
  seedSuperAdmin,
} from "./auth/service";
import { verifyAccessToken } from "./auth/security";
import { checkRateLimit, AuthRateLimits } from "./auth/rate-limiter";
import { userStore, pendingRegistrationStore } from "./auth/store";
import { checkDatabaseConnection, prisma } from "./db";
import { getPlatformSettings, updatePlatformSettings } from "./platform/service";
import { trackVisitor, getExecutiveAnalytics } from "./analytics/service";
import { APP_VERSION, BUILD_TIMESTAMP } from "../lib/version";
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
  getEffectiveStarterPresets,
  saveStarterPresets,
} from "./restaurant/service";
import {
  sanitizeObject,
  sanitizeText,
  sanitizePrice,
  sanitizeUrl,
  sanitizeEmail,
  sanitizePhone,
} from "./security/sanitize";

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    const host = parsed.hostname;
    if (host === "localhost" || host === "127.0.0.1") return true;
    if (host === "menuly.app" || host.endsWith(".menuly.app")) return true;
    if (host === "menuly.in" || host.endsWith(".menuly.in")) return true;
    if (host.endsWith(".vercel.app")) return true;
    return false;
  } catch {
    return false;
  }
}

function getCorsHeaders(req: Request, pathname: string): Record<string, string> {
  const origin = req.headers.get("origin");

  // Public read-only endpoints allow any origin (QR customer menu, presets, version, health)
  if (
    pathname.startsWith("/api/public/") ||
    pathname === "/api/starter-presets" ||
    pathname === "/api/version" ||
    pathname === "/api/health"
  ) {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
  }

  // Sensitive or authenticated endpoints: reflect origin only if allowed
  if (origin && isOriginAllowed(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
      "Vary": "Origin",
    };
  }

  return {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
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
  const corsHeaders = getCorsHeaders(request, pathname);

  const json = (data: unknown, status = 200, headers: Record<string, string> = {}) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        ...corsHeaders,
        ...headers,
      },
    });
  };

  // Handle CORS Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
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
          configured: Boolean(process.env["SMTP_PASS"] && process.env["SMTP_PASS"] !== ""),
        },
      });
    }

    // --------------------------------------------------------------------------
    // VERSION & UPDATE DISCOVERY: /api/version
    // --------------------------------------------------------------------------
    if (pathname === "/api/version" && request.method === "GET") {
      return json({
        success: true,
        version: APP_VERSION,
        timestamp: BUILD_TIMESTAMP,
      });
    }

    // --------------------------------------------------------------------------
    // PLATFORM SETTINGS (Public GET / Protected POST): /api/platform/settings
    // --------------------------------------------------------------------------
    if (pathname === "/api/platform/settings" && request.method === "GET") {
      const settings = await getPlatformSettings();
      return json({
        success: true,
        settings,
      });
    }

    if (pathname === "/api/platform/settings" && request.method === "POST") {
      const token = extractBearerToken(request);
      if (!token) {
        return json({ error: "Unauthorized. Super Admin authentication token required." }, 401);
      }
      const payload = verifyAccessToken(token);
      if (!payload || payload.role !== "SUPER_ADMIN") {
        return json({ error: "Forbidden. Super Admin access privileges required." }, 403);
      }

      const body = await request.json().catch(() => ({}));
      const settingsToUpdate = body.settings || body;
      const updated = await updatePlatformSettings(settingsToUpdate);
      return json({
        success: true,
        message: "Platform settings updated and persisted to PostgreSQL",
        settings: updated,
      });
    }

    // --------------------------------------------------------------------------
    // STARTER PRESETS (Public GET): /api/starter-presets
    // --------------------------------------------------------------------------
    if (pathname === "/api/starter-presets" && request.method === "GET") {
      const presets = await getEffectiveStarterPresets();
      const settings = await getPlatformSettings();
      return json({
        success: true,
        presets,
        defaultPresetId: settings.defaultStarterPreset || "dhaba",
      });
    }

    // --------------------------------------------------------------------------
    // 0. CHECK EMAIL: POST /api/auth/check-email (Ultra-fast real-time check)
    // --------------------------------------------------------------------------
    if (pathname === "/api/auth/check-email" && request.method === "POST") {
      const rate = checkRateLimit(`check_email:${clientIp}`, AuthRateLimits.CHECK_EMAIL);
      if (!rate.allowed) {
        return json(
          { error: `Too many requests. Please wait ${rate.resetInSeconds}s before checking another email.` },
          429
        );
      }
      const rawBody = await request.json().catch(() => ({}));
      const body = sanitizeObject(rawBody);
      const res = await checkEmailAvailability(body.email || "");
      return json(res, res.status);
    }

    // --------------------------------------------------------------------------
    // 1. SIGNUP: POST /api/auth/signup
    // --------------------------------------------------------------------------
    if (pathname === "/api/auth/signup" && request.method === "POST") {
      const rawBody = await request.json().catch(() => ({}));
      const body = sanitizeObject(rawBody);
      const res = await signupUser({
        email: body.email,
        password: body.password,
        fullName: body.fullName,
        phone: body.phone,
        clientIp,
      });
      return json(res, res.status);
    }

    // --------------------------------------------------------------------------
    // 2. VERIFY OTP: POST /api/auth/verify-otp
    // --------------------------------------------------------------------------
    if (pathname === "/api/auth/verify-otp" && request.method === "POST") {
      const rawBody = await request.json().catch(() => ({}));
      const body = sanitizeObject(rawBody);
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
      const rawBody = await request.json().catch(() => ({}));
      const body = sanitizeObject(rawBody);
      const res = await resendUserOtp({
        email: body.email,
        type: body.type || "SIGNUP",
        clientIp,
      });
      return json(res, res.status);
    }

    // --------------------------------------------------------------------------
    // 2b. SEND PHONE OTP: POST /api/auth/send-phone-otp
    // --------------------------------------------------------------------------
    if (pathname === "/api/auth/send-phone-otp" && request.method === "POST") {
      const rawBody = await request.json().catch(() => ({}));
      const body = sanitizeObject(rawBody);
      const res = await sendPhoneVerificationOtp({
        email: body.email,
        phone: body.phone,
        clientIp,
      });
      return json(res, res.status);
    }

    // --------------------------------------------------------------------------
    // 2c. VERIFY PHONE OTP: POST /api/auth/verify-phone-otp
    // --------------------------------------------------------------------------
    if (pathname === "/api/auth/verify-phone-otp" && request.method === "POST") {
      const rawBody = await request.json().catch(() => ({}));
      const body = sanitizeObject(rawBody);
      const res = await verifyPhoneVerificationOtp({
        email: body.email,
        phone: body.phone,
        otp: body.otp,
      });
      return json(res, res.status);
    }

    // --------------------------------------------------------------------------
    // 4. LOGIN: POST /api/auth/login
    // --------------------------------------------------------------------------
    if (pathname === "/api/auth/login" && request.method === "POST") {
      const rawBody = await request.json().catch(() => ({}));
      const body = sanitizeObject(rawBody);
      const res = await loginUser({
        identifier: body.identifier || body.email,
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
      const rawBody = await request.json().catch(() => ({}));
      const body = sanitizeObject(rawBody);
      const res = await forgotPassword({
        identifier: body.identifier || body.email,
        email: body.email,
        clientIp,
      });
      return json(res, res.status);
    }

    // --------------------------------------------------------------------------
    // 6. RESET PASSWORD: POST /api/auth/reset-password
    // --------------------------------------------------------------------------
    if (pathname === "/api/auth/reset-password" && request.method === "POST") {
      const rawBody = await request.json().catch(() => ({}));
      const body = sanitizeObject(rawBody);
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
    // 9. UPDATE USER PROFILE: POST /api/auth/profile/update
    // --------------------------------------------------------------------------
    if (pathname === "/api/auth/profile/update" && request.method === "POST") {
      const token = extractBearerToken(request);
      if (!token) return json({ error: "Authentication required." }, 401);
      const auth = verifyAccessToken(token);
      if (!auth) return json({ error: "Session expired. Please log in again." }, 401);

      const rate = checkRateLimit(`profile:${auth.userId}:${clientIp}`, AuthRateLimits.PROFILE_UPDATE);
      if (!rate.allowed) {
        return json({ error: `Too many profile updates. Please wait ${rate.resetInSeconds}s.` }, 429);
      }

      const rawBody = await request.json().catch(() => ({}));
      const body = sanitizeObject(rawBody);
      const res = await updateUserProfile({
        userId: auth.userId,
        fullName: body.fullName,
        email: body.email,
        restaurantName: body.restaurantName,
        phone: body.phone,
        whatsapp: body.whatsapp,
        logoUrl: body.logoUrl,
      });
      return json(res, res.status);
    }

    // --------------------------------------------------------------------------
    // 10. CHANGE PASSWORD: POST /api/auth/profile/change-password
    // --------------------------------------------------------------------------
    if (pathname === "/api/auth/profile/change-password" && request.method === "POST") {
      const token = extractBearerToken(request);
      if (!token) return json({ error: "Authentication required." }, 401);
      const auth = verifyAccessToken(token);
      if (!auth) return json({ error: "Session expired. Please log in again." }, 401);

      const rate = checkRateLimit(`pwd:${auth.userId}:${clientIp}`, AuthRateLimits.CHANGE_PASSWORD);
      if (!rate.allowed) {
        return json({ error: `Too many password change attempts. Please wait ${rate.resetInSeconds}s.` }, 429);
      }

      const rawBody = await request.json().catch(() => ({}));
      const body = sanitizeObject(rawBody);
      const res = await changeUserPassword({
        userId: auth.userId,
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      });
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
    // USER STATUS / VERIFICATION: GET /api/user/status & GET /api/auth/me
    // --------------------------------------------------------------------------
    if ((pathname === "/api/user/status" || pathname === "/api/auth/me") && request.method === "GET") {
      const token = extractBearerToken(request);
      if (!token) {
        return json({ error: "Authentication required", code: "UNAUTHORIZED" }, 401);
      }
      const auth = verifyAccessToken(token);
      if (!auth) {
        return json({ error: "Session expired. Please log in again.", code: "TOKEN_EXPIRED" }, 401);
      }
      const user = await userStore.findById(auth.userId);
      if (!user || user.deletedAt) {
        return json({
          error: "Menuly Official: Your account has been deleted by administration.",
          code: "ACCOUNT_DELETED",
          isDeleted: true,
        }, 403);
      }
      if (user.isBanned) {
        return json({
          error: user.banReason || "Your account has been suspended by Menuly Administration.",
          code: "ACCOUNT_BANNED",
          isBanned: true,
          banReason: user.banReason,
        }, 403);
      }
      return json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified,
        },
      });
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

      // Live verification of account status against database
      const user = await userStore.findById(auth.userId);
      if (!user || user.deletedAt) {
        return json({
          error: "Menuly Official: Your account has been deleted by administration.",
          code: "ACCOUNT_DELETED",
          isDeleted: true,
        }, 403);
      }
      if (user.isBanned) {
        return json({
          error: user.banReason || "Your account has been suspended by Menuly Administration.",
          code: "ACCOUNT_BANNED",
          isBanned: true,
          banReason: user.banReason,
        }, 403);
      }

      // 1. GET /api/restaurant/my-menu
      if (pathname === "/api/restaurant/my-menu" && request.method === "GET") {
        const menu = await getOrCreateUserRestaurant(auth.userId, auth.email, auth.fullName, auth.role);
        return json({ success: true, ...menu });
      }

      // 2. POST /api/restaurant/update
      if (pathname === "/api/restaurant/update" && request.method === "POST") {
        const rawBody = await request.json().catch(() => ({}));
        const body = sanitizeObject(rawBody);
        const updated = await updateRestaurant(auth.userId, body);
        return json({ success: true, message: "Restaurant profile saved.", restaurant: updated });
      }

      // 3. POST /api/restaurant/category/add
      if (pathname === "/api/restaurant/category/add" && request.method === "POST") {
        const rawBody = await request.json().catch(() => ({}));
        const body = sanitizeObject(rawBody);
        if (!body.name?.trim()) {
          return json({ error: "Category name is required" }, 400);
        }
        const cat = await addCategory(auth.userId, body.name);
        return json({ success: true, category: cat });
      }

      // 4. POST /api/restaurant/category/rename
      if (pathname === "/api/restaurant/category/rename" && request.method === "POST") {
        const rawBody = await request.json().catch(() => ({}));
        const body = sanitizeObject(rawBody);
        if (!body.id || !body.name?.trim()) {
          return json({ error: "Category ID and name are required" }, 400);
        }
        await renameCategory(auth.userId, body.id, body.name);
        return json({ success: true, message: "Category renamed" });
      }

      // 5. POST /api/restaurant/category/delete
      if (pathname === "/api/restaurant/category/delete" && request.method === "POST") {
        const rawBody = await request.json().catch(() => ({}));
        const body = sanitizeObject(rawBody);
        if (!body.id) {
          return json({ error: "Category ID required" }, 400);
        }
        await deleteCategory(auth.userId, body.id);
        return json({ success: true, message: "Category deleted" });
      }

      // 6. POST /api/restaurant/item/add
      if (pathname === "/api/restaurant/item/add" && request.method === "POST") {
        const rawBody = await request.json().catch(() => ({}));
        const body = sanitizeObject(rawBody);
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
        const rawBody = await request.json().catch(() => ({}));
        const body = sanitizeObject(rawBody);
        if (!body.id) {
          return json({ error: "Item ID required" }, 400);
        }
        const item = await updateDish(auth.userId, body.id, body.updates || {});
        return json({ success: true, item });
      }

      // 8. POST /api/restaurant/item/delete
      if (pathname === "/api/restaurant/item/delete" && request.method === "POST") {
        const rawBody = await request.json().catch(() => ({}));
        const body = sanitizeObject(rawBody);
        if (!body.id) {
          return json({ error: "Item ID required" }, 400);
        }
        await deleteDish(auth.userId, body.id);
        return json({ success: true, message: "Dish removed" });
      }

      // 9. POST /api/restaurant/item/toggle-available
      if (pathname === "/api/restaurant/item/toggle-available" && request.method === "POST") {
        const rawBody = await request.json().catch(() => ({}));
        const body = sanitizeObject(rawBody);
        if (!body.id) {
          return json({ error: "Item ID required" }, 400);
        }
        const updated = await toggleDishAvailable(auth.userId, body.id);
        return json({ success: true, item: updated });
      }

      // 10. POST /api/restaurant/preset (Load complete starter pack directly into database)
      if (pathname === "/api/restaurant/preset" && request.method === "POST") {
        const rawBody = await request.json().catch(() => ({}));
        const body = sanitizeObject(rawBody);
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
        const rawBody = await request.json().catch(() => ({}));
        const body = sanitizeObject(rawBody);
        if (!body.tableNumber?.trim()) {
          return json({ error: "Table number is required" }, 400);
        }
        const table = await saveTableForRestaurant(auth.userId, body.tableNumber, body.label);
        return json({ success: true, table });
      }

      // 13. POST /api/restaurant/tables/delete
      if (pathname === "/api/restaurant/tables/delete" && request.method === "POST") {
        const rawBody = await request.json().catch(() => ({}));
        const body = sanitizeObject(rawBody);
        if (!body.id) {
          return json({ error: "Table ID is required" }, 400);
        }
        await deleteTableForRestaurant(auth.userId, body.id);
        return json({ success: true, message: "Table removed" });
      }

      // 14. POST /api/restaurant/tables/bulk
      if (pathname === "/api/restaurant/tables/bulk" && request.method === "POST") {
        const rawBody = await request.json().catch(() => ({}));
        const body = sanitizeObject(rawBody);
        const count = Number(body.count) || 10;
        const prefix = body.prefix || "Table ";
        const tables = await bulkCreateTablesForRestaurant(auth.userId, count, prefix);
        return json({ success: true, tables });
      }
    }

    // --------------------------------------------------------------------------
    // 8. PUBLIC CONTACT & SUPPORT TICKET SUBMISSION
    // --------------------------------------------------------------------------
    if ((pathname === "/api/support/ticket" || pathname === "/api/contact/submit") && request.method === "POST") {
      const rate = checkRateLimit(`contact:${clientIp}`, AuthRateLimits.CONTACT);
      if (!rate.allowed) {
        return json(
          { error: `Too many submissions. Please wait ${rate.resetInSeconds}s before submitting again.` },
          429
        );
      }

      const body = await request.json().catch(() => ({}));
      const messageContent = (body.description || body.message || "").trim().slice(0, 3000);
      const subjectContent = (body.subject || body.category || "General Support Inquiry").trim().slice(0, 200);

      if (!messageContent) {
        return json({ error: "Message content is required" }, 400);
      }

      const token = extractBearerToken(request);
      let userId: string | null = null;
      let restaurantId: string | null = null;
      if (token) {
        const auth = verifyAccessToken(token);
        if (auth) {
          userId = auth.userId;
          const r = await prisma.restaurant.findFirst({ where: { ownerId: auth.userId } });
          if (r) restaurantId = r.id;
        }
      }

      const ticketId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
      const rawAdditionalInfo = (body.additionalInfo || "").trim().slice(0, 2000);
      const combinedDescription = rawAdditionalInfo
        ? `${messageContent}\n\n[Additional Context]\n${rawAdditionalInfo}`
        : messageContent;

      const ticket = await prisma.supportTicket.create({
        data: {
          id: ticketId,
          userId,
          restaurantId,
          restaurantName: (body.restaurantName?.trim() || body.restaurant?.trim() || "Menuly Guest / Partner").slice(0, 150),
          ownerEmail: (body.ownerEmail?.trim() || body.email?.trim() || "menulyofficial@gmail.com").slice(0, 150),
          ownerPhone: (body.ownerPhone?.trim() || body.phone?.trim() || "").slice(0, 30) || null,
          category: (body.category || "General Support").slice(0, 100),
          subject: subjectContent,
          description: combinedDescription,
          priority: body.priority === "high" || body.priority === "urgent" ? body.priority : "medium",
          status: "open",
        },
      });

      return json({
        success: true,
        ticketId: ticket.id,
        ticket,
        message: "Your message has been received! Our support team will get back to you shortly.",
      });
    }

    // --------------------------------------------------------------------------
    // 8.1 PUBLIC CUSTOMER FEEDBACK SUBMISSION
    // --------------------------------------------------------------------------
    if (pathname === "/api/feedback/submit" && request.method === "POST") {
      const rate = checkRateLimit(`feedback:${clientIp}`, AuthRateLimits.FEEDBACK);
      if (!rate.allowed) {
        return json(
          { error: `Too many submissions. Please wait ${rate.resetInSeconds}s before sending more feedback.` },
          429
        );
      }

      const body = await request.json().catch(() => ({}));
      const message = (body.message || body.feedback || "").trim().slice(0, 2000);
      const rating = Math.min(5, Math.max(1, Number(body.rating) || 5));

      if (!message && !body.rating) {
        return json({ error: "Please provide a rating or feedback message" }, 400);
      }

      const feedbackId = `FB-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      const feedbackItem = {
        id: feedbackId,
        name: (body.name?.trim() || "Verified Diner / Partner").slice(0, 100),
        email: (body.email?.trim() || "").slice(0, 150) || null,
        phone: (body.phone?.trim() || "").slice(0, 30) || null,
        restaurantName: (body.restaurantName?.trim() || body.restaurant?.trim() || "Menuly Hospitality").slice(0, 150),
        rating,
        category: (body.category || "Overall Experience").slice(0, 100),
        message: message || "No written remarks provided.",
        recommend: body.recommend !== false,
        wouldRecommend: body.recommend !== false,
        createdAt: new Date().toISOString(),
      };

      // 1. Store in PlatformSetting under key "menuly_feedbacks"
      let existingFeedbacks: any[] = [];
      try {
        const setting = await prisma.platformSetting.findUnique({
          where: { key: "menuly_feedbacks" },
        });
        if (setting && Array.isArray(setting.value)) {
          existingFeedbacks = setting.value;
        }
      } catch (err) {
        console.error("Error loading feedbacks from platformSetting:", err);
      }

      const updatedFeedbacks = [feedbackItem, ...existingFeedbacks];
      await prisma.platformSetting.upsert({
        where: { key: "menuly_feedbacks" },
        create: {
          key: "menuly_feedbacks",
          value: updatedFeedbacks,
        },
        update: {
          value: updatedFeedbacks,
        },
      });

      // 2. Also register a record in support tickets so it shows in support metrics
      try {
        await prisma.supportTicket.create({
          data: {
            id: `TKT-${feedbackId.slice(-6)}`,
            restaurantName: feedbackItem.restaurantName,
            ownerEmail: feedbackItem.email || "feedback@menuly.app",
            ownerPhone: feedbackItem.phone,
            category: "Customer Feedback",
            subject: `[${rating}★ Feedback] ${feedbackItem.category}`,
            description: `Rating: ${rating}/5 Stars\nWould Recommend: ${feedbackItem.recommend ? "Yes" : "No"}\n\nFeedback:\n${feedbackItem.message}`,
            priority: rating <= 2 ? "high" : "low",
            status: "resolved",
          },
        });
      } catch (err) {
        console.error("Error creating feedback support ticket mirror:", err);
      }

      return json({
        success: true,
        feedbackId,
        message: "Thank you for sharing your feedback! We truly appreciate your support.",
      });
    }

    // --------------------------------------------------------------------------
    // 8.2 PUBLIC VISITOR & META ADS ANALYTICS BEACON: POST /api/analytics/track
    // --------------------------------------------------------------------------
    if (pathname === "/api/analytics/track" && request.method === "POST") {
      const rate = checkRateLimit(`track:${clientIp}`, AuthRateLimits.TRACK_ANALYTICS);
      if (!rate.allowed) {
        return json({ success: true, live: 1 });
      }

      const rawBody = await request.json().catch(() => ({}));
      const body = sanitizeObject(rawBody);
      const userAgent = request.headers.get("user-agent") || "";
      const isMobile = userAgent.toLowerCase().includes("mobi") || userAgent.toLowerCase().includes("android") || userAgent.toLowerCase().includes("iphone");

      const cleanReferrer = (body.referrer ? sanitizeUrl(body.referrer) : null) || request.headers.get("referer");

      const res = await trackVisitor({
        path: sanitizeText(body.path || "/", 100),
        ...(body.source ? { source: sanitizeText(body.source, 50) } : {}),
        ...(body.medium ? { medium: sanitizeText(body.medium, 50) } : {}),
        ...(body.campaign ? { campaign: sanitizeText(body.campaign, 50) } : {}),
        ...(cleanReferrer ? { referrer: cleanReferrer.slice(0, 500) } : {}),
        device: body.device ? String(body.device).slice(0, 30) : (isMobile ? "mobile" : "desktop"),
        ...(body.browser ? { browser: sanitizeText(body.browser, 50) } : {}),
        ...(body.sessionId ? { sessionId: sanitizeText(body.sessionId, 64) } : {}),
        clientIp,
      });

      return json({ success: true, live: res.liveActiveCount });
    }

    // --------------------------------------------------------------------------
    // 9. SUPER ADMIN SEED & PROTECTED APIS
    // --------------------------------------------------------------------------
    // POST /api/admin/seed (Bootstrap/seed Super Admin)
    if (pathname === "/api/admin/seed" && request.method === "POST") {
      const rate = checkRateLimit(`seed:${clientIp}`, AuthRateLimits.ADMIN_SEED);
      if (!rate.allowed) {
        return json({ error: `Too many requests. Please wait ${rate.resetInSeconds}s.` }, 429);
      }

      // Check if a super admin account already exists
      const existingSuperAdmin = await prisma.user.findFirst({
        where: { role: "SUPER_ADMIN" },
      });

      if (existingSuperAdmin) {
        const seedSecret = request.headers.get("x-seed-secret");
        const envSecret = process.env["ADMIN_SEED_SECRET"];

        // Block unauthenticated calls once Super Admin is initialized
        if (!envSecret || seedSecret !== envSecret) {
          return json(
            { error: "Super Admin account is already initialized. Seeding is locked." },
            403
          );
        }
      }

      const admin = await seedSuperAdmin();
      return json({ success: true, message: `Super admin ready: ${admin.email}` });
    }

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

      // GET /api/admin/users (Strictly verified platform users only, active / not in trash)
      if (pathname === "/api/admin/users" && request.method === "GET") {
        const users = await prisma.user.findMany({
          where: { isVerified: true, deletedAt: null },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            email: true,
            role: true,
            fullName: true,
            phone: true,
            isVerified: true,
            isBanned: true,
            banReason: true,
            createdAt: true,
            restaurants: {
              where: { deletedAt: null },
              select: { id: true, name: true, slug: true, isActive: true },
              take: 1,
            },
          },
        });
        return json({
          success: true,
          users: users.map((u) => ({
            id: u.id,
            email: u.email,
            role: u.role,
            fullName: u.fullName,
            phone: u.phone,
            isVerified: u.isVerified,
            isBanned: u.isBanned ?? false,
            banReason: u.banReason ?? null,
            createdAt: u.createdAt,
            restaurant: u.restaurants[0] || null,
          })),
        });
      }

      // GET /api/admin/pending-signups (Separate table for unverified / abandoned leads)
      if (pathname === "/api/admin/pending-signups" && request.method === "GET") {
        const pending = await pendingRegistrationStore.listAll();
        return json({
          success: true,
          pending: pending.map((p) => ({
            id: p.id,
            email: p.email,
            fullName: p.fullName || "Unverified Visitor",
            phone: p.phone,
            attempts: p.attempts,
            lastOtpSent: p.lastOtpSent,
            createdAt: p.createdAt,
          })),
        });
      }

      // POST /api/admin/pending-signups/delete
      if (pathname === "/api/admin/pending-signups/delete" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        if (body.email) {
          await pendingRegistrationStore.delete(body.email);
        }
        return json({ success: true, message: "Pending registration removed." });
      }

      // POST /api/admin/users/update-role
      if (pathname === "/api/admin/users/update-role" && request.method === "POST") {
        if (payload.email !== "menulyofficial@gmail.com") {
          return json({ error: "Access Denied: Only the Master Platform Administrator can assign or modify administrative roles." }, 403);
        }

        const body = await request.json().catch(() => ({}));
        if (!body.userId || !body.role) {
          return json({ error: "User ID and target role required" }, 400);
        }
        if (body.role !== "SUPER_ADMIN" && body.role !== "RESTAURANT_OWNER") {
          return json({ error: "Invalid role specified" }, 400);
        }
        const target = await prisma.user.findUnique({ where: { id: body.userId } });
        if (!target) return json({ error: "User not found" }, 404);

        if (target.email === "menulyofficial@gmail.com" && body.role !== "SUPER_ADMIN") {
          return json({ error: "Primary Platform Administrator cannot be demoted." }, 403);
        }

        const updated = await prisma.user.update({
          where: { id: body.userId },
          data: { role: body.role },
        });

        return json({ success: true, user: updated });
      }

      // POST /api/admin/users/delete (Soft delete -> Moves account & restaurant to Trash for 30 days)
      if (pathname === "/api/admin/users/delete" && request.method === "POST") {
        if (payload.email !== "menulyofficial@gmail.com") {
          return json({ error: "Access Denied: Only the Master Platform Administrator can delete user accounts." }, 403);
        }

        const body = await request.json().catch(() => ({}));
        if (!body.userId) return json({ error: "User ID required" }, 400);

        const target = await prisma.user.findUnique({ where: { id: body.userId } });
        if (!target) return json({ error: "User not found" }, 404);

        if (target.email === "menulyofficial@gmail.com") {
          return json({ error: "Primary Platform Administrator cannot be deleted." }, 403);
        }
        if (target.id === payload.userId) {
          return json({ error: "You cannot delete your own logged-in admin account." }, 403);
        }

        const now = new Date();
        // Move user & restaurant to Trash (Soft Delete)
        await prisma.user.update({
          where: { id: body.userId },
          data: { deletedAt: now },
        });
        await prisma.restaurant.updateMany({
          where: { ownerId: body.userId },
          data: { deletedAt: now, isActive: false },
        });
        await prisma.session.deleteMany({ where: { userId: body.userId } }).catch(() => {});
        userStore.invalidateEmailCache(target.email);

        return json({
          success: true,
          message: "User account and restaurant moved to Trash. It will be kept for 30 days before permanent deletion.",
        });
      }

      // POST /api/admin/users/ban (Suspend or Unsuspend User Account)
      if (pathname === "/api/admin/users/ban" && request.method === "POST") {
        if (payload.email !== "menulyofficial@gmail.com" && payload.role !== "SUPER_ADMIN") {
          return json({ error: "Access Denied: Only Platform Administrators can suspend accounts." }, 403);
        }

        const body = await request.json().catch(() => ({}));
        if (!body.userId) return json({ error: "User ID required" }, 400);

        const target = await prisma.user.findUnique({ where: { id: body.userId } });
        if (!target) return json({ error: "User not found" }, 404);

        if (target.email === "menulyofficial@gmail.com") {
          return json({ error: "Primary Platform Administrator cannot be suspended." }, 403);
        }

        const isBanned = body.isBanned !== undefined ? Boolean(body.isBanned) : true;
        const banReason = body.banReason?.trim() || "Your account has been suspended by Menuly Administration.";

        await prisma.user.update({
          where: { id: body.userId },
          data: {
            isBanned,
            banReason: isBanned ? banReason : null,
          },
        });

        if (isBanned) {
          await prisma.session.deleteMany({ where: { userId: body.userId } }).catch(() => {});
        }
        userStore.invalidateEmailCache(target.email);

        return json({
          success: true,
          message: isBanned ? "User account has been suspended." : "User account has been unsuspended.",
          isBanned,
          banReason: isBanned ? banReason : null,
        });
      }

      // GET /api/admin/trash (List soft-deleted accounts in 30-day recycle bin, auto-purges >30 days)
      if (pathname === "/api/admin/trash" && request.method === "GET") {
        // Auto-purge records older than 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        try {
          const expiredUsers = await prisma.user.findMany({
            where: { deletedAt: { lt: thirtyDaysAgo } },
            select: { id: true, email: true },
          });
          for (const exp of expiredUsers) {
            const rests = await prisma.restaurant.findMany({ where: { ownerId: exp.id } });
            for (const r of rests) {
              await prisma.restaurant.delete({ where: { id: r.id } }).catch(() => {});
            }
            await prisma.session.deleteMany({ where: { userId: exp.id } }).catch(() => {});
            await prisma.user.delete({ where: { id: exp.id } }).catch(() => {});
            userStore.invalidateEmailCache(exp.email);
          }
        } catch (e) {
          console.warn("[Trash Auto-Purge Exception]:", e);
        }

        const trashedUsers = await prisma.user.findMany({
          where: { deletedAt: { not: null } },
          orderBy: { deletedAt: "desc" },
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
            deletedAt: true,
            restaurants: {
              select: { id: true, name: true, slug: true },
              take: 1,
            },
          },
        });

        const items = trashedUsers.map((u) => {
          const deletedTime = u.deletedAt ? new Date(u.deletedAt).getTime() : Date.now();
          const daysPassed = Math.floor((Date.now() - deletedTime) / (1000 * 60 * 60 * 24));
          const daysRemaining = Math.max(0, 30 - daysPassed);

          return {
            id: u.id,
            email: u.email,
            fullName: u.fullName,
            phone: u.phone,
            role: u.role,
            deletedAt: u.deletedAt,
            restaurant: u.restaurants[0] || null,
            daysRemaining,
            daysPassed,
          };
        });

        return json({ success: true, trash: items });
      }

      // POST /api/admin/trash/restore (Restore account & restaurant from Trash)
      if (pathname === "/api/admin/trash/restore" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        if (!body.userId) return json({ error: "User ID required" }, 400);

        const target = await prisma.user.findUnique({ where: { id: body.userId } });
        if (!target) return json({ error: "User not found in database" }, 404);

        await prisma.user.update({
          where: { id: body.userId },
          data: { deletedAt: null },
        });
        await prisma.restaurant.updateMany({
          where: { ownerId: body.userId },
          data: { deletedAt: null, isActive: true },
        });
        userStore.invalidateEmailCache(target.email);

        return json({ success: true, message: "User account and restaurant restored successfully." });
      }

      // POST /api/admin/trash/purge (Immediate permanent hard delete)
      if (pathname === "/api/admin/trash/purge" && request.method === "POST") {
        if (payload.email !== "menulyofficial@gmail.com") {
          return json({ error: "Access Denied: Only Master Admin can permanently purge records." }, 403);
        }

        const body = await request.json().catch(() => ({}));
        if (!body.userId) return json({ error: "User ID required" }, 400);

        const target = await prisma.user.findUnique({ where: { id: body.userId } });
        if (!target) return json({ error: "User not found" }, 404);

        if (target.email === "menulyofficial@gmail.com") {
          return json({ error: "Primary Platform Administrator cannot be purged." }, 403);
        }

        const rests = await prisma.restaurant.findMany({ where: { ownerId: body.userId } });
        for (const r of rests) {
          await prisma.restaurant.delete({ where: { id: r.id } }).catch(() => {});
        }
        await prisma.session.deleteMany({ where: { userId: body.userId } }).catch(() => {});
        await prisma.user.delete({ where: { id: body.userId } });
        userStore.invalidateEmailCache(target.email);

        return json({ success: true, message: "User permanently purged from database." });
      }

      // POST /api/admin/restaurants/delete
      if (pathname === "/api/admin/restaurants/delete" && request.method === "POST") {
        if (payload.email !== "menulyofficial@gmail.com") {
          return json({ error: "Access Denied: Only the Master Platform Administrator can delete restaurants." }, 403);
        }

        const body = await request.json().catch(() => ({}));
        if (!body.id) return json({ error: "Restaurant ID required" }, 400);

        const target = await prisma.restaurant.findUnique({ where: { id: body.id } });
        if (!target) return json({ error: "Restaurant not found" }, 404);

        await prisma.restaurant.delete({ where: { id: body.id } });
        return json({ success: true, message: "Restaurant deleted successfully" });
      }

      // GET /api/admin/restaurants
      if (pathname === "/api/admin/restaurants" && request.method === "GET") {
        const rests = await getAllRestaurantsForAdmin();
        return json({
          success: true,
          restaurants: rests,
        });
      }

      // GET /api/admin/tickets
      if (pathname === "/api/admin/tickets" && request.method === "GET") {
        const tickets = await prisma.supportTicket.findMany({
          orderBy: { createdAt: "desc" },
        });
        return json({
          success: true,
          tickets: tickets.map((t) => ({
            id: t.id,
            restaurantName: t.restaurantName,
            restaurantSlug: t.restaurantName.toLowerCase().replace(/\s+/g, "-"),
            ownerEmail: t.ownerEmail,
            phone: t.ownerPhone || "+91 98765 00000",
            category: t.category,
            subject: t.subject,
            description: t.description,
            priority: t.priority,
            status: t.status,
            createdAt: t.createdAt.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }),
            adminNote: t.adminNotes || "",
          })),
        });
      }

      // POST /api/admin/tickets/update
      if (pathname === "/api/admin/tickets/update" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        if (!body.id) return json({ error: "Ticket ID required" }, 400);
        const updated = await prisma.supportTicket.update({
          where: { id: body.id },
          data: {
            ...(body.status ? { status: body.status } : {}),
            ...(body.adminNote !== undefined ? { adminNotes: body.adminNote } : {}),
          },
        });
        return json({ success: true, ticket: updated });
      }

      // GET /api/admin/feedbacks
      if (pathname === "/api/admin/feedbacks" && request.method === "GET") {
        let feedbacks: any[] = [];
        try {
          const setting = await prisma.platformSetting.findUnique({
            where: { key: "menuly_feedbacks" },
          });
          if (setting && Array.isArray(setting.value)) {
            feedbacks = setting.value;
          }
        } catch (err) {
          console.error("Error fetching feedbacks:", err);
        }

        // Calculate analytics
        const total = feedbacks.length;
        const sumRatings = feedbacks.reduce((acc, f) => acc + (Number(f.rating) || 5), 0);
        const avgRating = total > 0 ? (sumRatings / total).toFixed(1) : "5.0";
        const recommendCount = feedbacks.filter((f) => f.recommend !== false && f.wouldRecommend !== false).length;
        const recommendPercent = total > 0 ? Math.round((recommendCount / total) * 100) : 100;

        const normalizedFeedbacks = feedbacks.map((f: any) => ({
          ...f,
          rating: Number(f.rating) || 5,
          recommend: f.recommend !== undefined ? f.recommend : (f.wouldRecommend !== false),
          wouldRecommend: f.wouldRecommend !== undefined ? f.wouldRecommend : (f.recommend !== false),
        }));

        return json({
          success: true,
          feedbacks: normalizedFeedbacks,
          stats: {
            total,
            avgRating,
            averageRating: avgRating,
            recommendPercent,
            distribution: {
              5: feedbacks.filter((f) => Number(f.rating) === 5).length,
              4: feedbacks.filter((f) => Number(f.rating) === 4).length,
              3: feedbacks.filter((f) => Number(f.rating) === 3).length,
              2: feedbacks.filter((f) => Number(f.rating) === 2).length,
              1: feedbacks.filter((f) => Number(f.rating) === 1).length,
            },
          },
        });
      }

      // POST /api/admin/feedback/delete
      if (pathname === "/api/admin/feedback/delete" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        if (!body.id) return json({ error: "Feedback ID required" }, 400);

        const setting = await prisma.platformSetting.findUnique({
          where: { key: "menuly_feedbacks" },
        });
        if (setting && Array.isArray(setting.value)) {
          const filtered = setting.value.filter((f: any) => f.id !== body.id);
          await prisma.platformSetting.update({
            where: { key: "menuly_feedbacks" },
            data: { value: filtered },
          });
        }

        // Clean up mirror ticket if one was created
        try {
          await prisma.supportTicket.deleteMany({
            where: { id: `TKT-${String(body.id).slice(-6)}` },
          });
        } catch {
          // ignore
        }

        return json({ success: true, message: "Feedback deleted successfully" });
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

      // POST /api/admin/settings
      if (pathname === "/api/admin/settings" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const settingsToUpdate = body.settings || body;
        const updated = await updatePlatformSettings(settingsToUpdate);
        return json({
          success: true,
          message: "Platform settings updated and persisted to PostgreSQL",
          settings: updated,
        });
      }

      // GET /api/admin/analytics
      if (pathname === "/api/admin/analytics" && request.method === "GET") {
        const periodParam = (url.searchParams.get("period") || "7d") as "today" | "7d" | "30d" | "all";
        const analytics = await getExecutiveAnalytics(periodParam);
        return json({
          success: true,
          analytics,
        });
      }

      // POST /api/admin/starter-presets
      if (pathname === "/api/admin/starter-presets" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        if (!Array.isArray(body.presets)) {
          return json({ error: "presets array is required" }, 400);
        }
        await saveStarterPresets(body.presets, body.defaultPresetId);
        return json({ success: true, message: "Starter menu presets updated successfully" });
      }

      // Default Admin Route
      return json({ success: true, message: "Admin API online" });
    }

    // Route not found in /api/*
    return json({ error: "API endpoint not found" }, 404);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API Error]", message);
    const isDev = process.env["NODE_ENV"] !== "production";
    return json(
      {
        error: isDev ? (message || "Internal Server Error") : "An unexpected server error occurred. Please try again later.",
        ...(isDev ? { details: message } : {}),
      },
      500
    );
  }
}
