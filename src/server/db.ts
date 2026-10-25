import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  // Prefer DATABASE_URL (Supabase Transaction Pooler on port 6543) for high-concurrency production traffic
  let url = process.env["DATABASE_URL"] || process.env["DIRECT_URL"] || "";
  if (url) {
    if (url.includes("connection_limit=1")) {
      url = url.replace("connection_limit=1", "connection_limit=20&pool_timeout=20");
    } else if (!url.includes("connection_limit")) {
      const sep = url.includes("?") ? "&" : "?";
      url = `${url}${sep}connection_limit=20&pool_timeout=20`;
    }
  }

  const log = process.env["NODE_ENV"] === "development" ? (["warn", "error"] as const) : (["error"] as const);

  if (url) {
    return new PrismaClient({
      datasources: { db: { url } },
      log: [...log],
    });
  }

  return new PrismaClient({
    log: [...log],
  });
}

export const prisma = globalThis.__prisma ?? createPrismaClient();

// Ensure single Prisma instance across hot reloads and concurrent requests
globalThis.__prisma = prisma;

/**
 * Checks if the database is connected and accessible.
 */
export async function checkDatabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    const dbUrl = process.env["DATABASE_URL"];
    if (!dbUrl || dbUrl.includes("localhost:5432")) {
      return { connected: false, error: "DATABASE_URL not configured with live Supabase database" };
    }
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { connected: false, error: message };
  }
}

/**
 * Returns telemetry regarding database latency, pooler connection, and health.
 */
export async function getDatabaseMetrics(): Promise<{
  connected: boolean;
  latencyMs: number;
  poolMode: "Supabase Transaction Pooler (Port 6543)" | "Direct Connection (Port 5432)" | "Unknown";
  error?: string;
}> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;
    const isPooler = (process.env["DATABASE_URL"] || "").includes(":6543") || (process.env["DATABASE_URL"] || "").includes("pooler");
    return {
      connected: true,
      latencyMs,
      poolMode: isPooler ? "Supabase Transaction Pooler (Port 6543)" : "Direct Connection (Port 5432)",
    };
  } catch (err: unknown) {
    return {
      connected: false,
      latencyMs: Date.now() - start,
      poolMode: "Unknown",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
