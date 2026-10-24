import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { handleApiRoute } from "./server/router";
import { isMaintenanceModeActive, getPlatformSettings } from "./server/platform/service";
import { renderMaintenanceHtml } from "./server/platform/html";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown; error?: unknown; status?: unknown };
    return payload.unhandled === true || payload.message === "HTTPError" || (payload.error === true && payload.status === 500);
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      // 1. Intercept and handle /api/* REST endpoints (Custom Auth, OTP, Admin, Platform Settings)
      const apiResponse = await handleApiRoute(request);
      if (apiResponse) return apiResponse;

      // 2. Intercept page requests when Platform Maintenance Mode is active
      const url = new URL(request.url);
      const pathname = url.pathname;

      // CRITICAL EXEMPTIONS:
      // - Restaurant QR Menus (/menu/*) MUST NEVER GO DOWN! Diners seated at tables can always view menus.
      // - Master Admin Suite (/admin*) must remain open so admins can manage and turn off maintenance.
      // - Static assets, Vite build files, and client scripts must pass through.
      const isExempt =
        pathname.startsWith("/menu/") ||
        pathname === "/menu" ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/_build/") ||
        pathname.startsWith("/assets/") ||
        pathname.startsWith("/@") ||
        pathname.includes(".");

      if (!isExempt) {
        const inMaintenance = await isMaintenanceModeActive();
        if (inMaintenance) {
          const settings = await getPlatformSettings();
          return new Response(renderMaintenanceHtml(settings), {
            status: 503,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Retry-After": "120",
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "X-Content-Type-Options": "nosniff",
              "X-Frame-Options": "SAMEORIGIN",
            },
          });
        }
      }

      // 3. Delegate SSR and page requests to TanStack Start
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "SAMEORIGIN",
        },
      });
    }
  },
};
