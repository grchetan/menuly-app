export function reportLovableError(error: unknown, _context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  console.error("[Error Boundary]", error);
}
