/**
 * Validates post-authentication redirect paths to prevent Open Redirect attacks.
 * Only relative internal application paths (starting with a single `/`) are permitted.
 */
export function getSafeRedirectPath(raw: string | null | undefined, fallback = "/"): string {
  if (!raw || typeof raw !== "string") return fallback;

  let trimmed = raw.trim();
  if (!trimmed) return fallback;

  // Strip null bytes / CR / LF that could split HTTP headers
  let cleaned = "";
  for (let i = 0; i < trimmed.length; i++) {
    const code = trimmed.charCodeAt(i);
    if (code >= 32 && code !== 127) {
      cleaned += trimmed[i];
    }
  }
  trimmed = cleaned.trim();

  // Must start with a single forward slash, never protocol-relative `//` or backslash `/\`
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\") || trimmed.includes("\\")) {
    return fallback;
  }

  // Disallow scheme prefixes even after encoding tricks
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/i.test(trimmed)) {
    return fallback;
  }

  try {
    const sentinel = "https://menulyindia.online";
    const parsed = new URL(trimmed, sentinel);
    if (parsed.origin !== sentinel) {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
