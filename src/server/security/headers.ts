/**
 * HTTP Security Headers & Session Cookie Helpers
 */

const STATIC_SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(self), microphone=(), geolocation=()",
};

export function isSecureRequest(request?: Request): boolean {
  if (!request) return process.env["NODE_ENV"] === "production";
  const forwardedProto = request.headers.get("x-forwarded-proto")?.toLowerCase();
  if (forwardedProto === "https") return true;
  return request.url.startsWith("https://") || process.env["NODE_ENV"] === "production";
}

export function buildSecurityHeaders(request?: Request): Record<string, string> {
  const headers: Record<string, string> = { ...STATIC_SECURITY_HEADERS };
  if (isSecureRequest(request)) {
    headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
  }
  return headers;
}

export function applySecurityHeaders(response: Response, request?: Request): Response {
  const secHeaders = buildSecurityHeaders(request);
  const nextHeaders = new Headers(response.headers);
  for (const [key, val] of Object.entries(secHeaders)) {
    if (!nextHeaders.has(key)) {
      nextHeaders.set(key, val);
    }
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: nextHeaders,
  });
}

export function buildSessionCookieHeader(token: string, request?: Request): string {
  const secureFlag = isSecureRequest(request) ? "; Secure" : "";
  return `menuly_token=${encodeURIComponent(token)}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${secureFlag}`;
}

export function buildClearSessionCookieHeader(request?: Request): string {
  const secureFlag = isSecureRequest(request) ? "; Secure" : "";
  return `menuly_token=; Path=/; Max-Age=0; SameSite=Lax${secureFlag}`;
}
