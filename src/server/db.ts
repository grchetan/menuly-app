import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env["NODE_ENV"] === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env["NODE_ENV"] !== "production") {
  globalThis.__prisma = prisma;
}

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
