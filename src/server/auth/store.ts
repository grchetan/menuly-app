import { prisma } from "../db";
import { type UserRole } from "./rbac";
import bcrypt from "bcryptjs";

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string | null;
  phone: string | null;
  role: UserRole;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredOtp {
  id: string;
  email: string;
  otpHash: string;
  type: "SIGNUP" | "PASSWORD_RESET" | "LOGIN";
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  verified: boolean;
  createdAt: Date;
}

// Pre-seed dev store with default Super Admin so local tests and dashboard access work out of the box
const defaultAdminEmail = (process.env["SUPER_ADMIN_EMAIL"] || "admin@menuly.com").toLowerCase().trim();
const defaultAdminPass = process.env["SUPER_ADMIN_PASSWORD"] || "AdminPassword123!";
const defaultAdminHash = bcrypt.hashSync(defaultAdminPass, 10);

const devUsers = new Map<string, StoredUser>([
  [
    defaultAdminEmail,
    {
      id: "usr-superadmin-seed",
      email: defaultAdminEmail,
      passwordHash: defaultAdminHash,
      fullName: "Super Admin",
      phone: "+919876543210",
      role: "SUPER_ADMIN",
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
]);
const devOtps = new Map<string, StoredOtp>();

function isPrismaAvailable(): boolean {
  const dbUrl = process.env["DATABASE_URL"];
  return Boolean(dbUrl) && !dbUrl?.includes("localhost:5432");
}

/**
 * User Store Operations
 */
export const userStore = {
  async findByEmail(email: string): Promise<StoredUser | null> {
    const normalized = email.toLowerCase().trim();
    if (isPrismaAvailable()) {
      try {
        const u = await prisma.user.findUnique({ where: { email: normalized } });
        if (u) {
          return {
            id: u.id,
            email: u.email,
            passwordHash: u.passwordHash,
            fullName: u.fullName,
            phone: u.phone,
            role: u.role as UserRole,
            isVerified: u.isVerified,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
          };
        }
        return null;
      } catch {
        // Fall back to dev store if database query fails
      }
    }
    return devUsers.get(normalized) || null;
  },

  async findById(id: string): Promise<StoredUser | null> {
    if (isPrismaAvailable()) {
      try {
        const u = await prisma.user.findUnique({ where: { id } });
        if (u) {
          return {
            id: u.id,
            email: u.email,
            passwordHash: u.passwordHash,
            fullName: u.fullName,
            phone: u.phone,
            role: u.role as UserRole,
            isVerified: u.isVerified,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
          };
        }
        return null;
      } catch {
        // Fall back
      }
    }
    for (const u of devUsers.values()) {
      if (u.id === id) return u;
    }
    return null;
  },

  async create(data: {
    email: string;
    passwordHash: string;
    fullName?: string;
    role?: UserRole;
    isVerified?: boolean;
  }): Promise<StoredUser> {
    const normalized = data.email.toLowerCase().trim();
    const newUser: StoredUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      email: normalized,
      passwordHash: data.passwordHash,
      fullName: data.fullName || null,
      phone: null,
      role: data.role || "RESTAURANT_OWNER",
      isVerified: data.isVerified || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (isPrismaAvailable()) {
      try {
        const u = await prisma.user.create({
          data: {
            email: normalized,
            passwordHash: data.passwordHash,
            fullName: data.fullName || null,
            role: data.role || "RESTAURANT_OWNER",
            isVerified: data.isVerified || false,
          },
        });
        return {
          id: u.id,
          email: u.email,
          passwordHash: u.passwordHash,
          fullName: u.fullName,
          phone: u.phone,
          role: u.role as UserRole,
          isVerified: u.isVerified,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        };
      } catch {
        // fallback
      }
    }

    devUsers.set(normalized, newUser);
    return newUser;
  },

  async update(
    id: string,
    data: Partial<{
      passwordHash: string;
      fullName: string | null;
      phone: string | null;
      isVerified: boolean;
      role: UserRole;
    }>
  ): Promise<StoredUser | null> {
    if (isPrismaAvailable()) {
      try {
        const u = await prisma.user.update({
          where: { id },
          data,
        });
        return {
          id: u.id,
          email: u.email,
          passwordHash: u.passwordHash,
          fullName: u.fullName,
          phone: u.phone,
          role: u.role as UserRole,
          isVerified: u.isVerified,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        };
      } catch {
        // fallback
      }
    }

    for (const [email, u] of devUsers.entries()) {
      if (u.id === id) {
        const updated = {
          ...u,
          ...data,
          updatedAt: new Date(),
        };
        devUsers.set(email, updated);
        return updated;
      }
    }
    return null;
  },

  async getAllUsers(): Promise<StoredUser[]> {
    if (isPrismaAvailable()) {
      try {
        const users = await prisma.user.findMany({
          orderBy: { createdAt: "desc" },
        });
        return users.map((u) => ({
          id: u.id,
          email: u.email,
          passwordHash: u.passwordHash,
          fullName: u.fullName,
          phone: u.phone,
          role: u.role as UserRole,
          isVerified: u.isVerified,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        }));
      } catch {
        // fallback
      }
    }
    return Array.from(devUsers.values());
  },
};

/**
 * OTP Store Operations
 */
export const otpStore = {
  async saveOtp(data: {
    email: string;
    otpHash: string;
    type: "SIGNUP" | "PASSWORD_RESET" | "LOGIN";
    expiresAt: Date;
    maxAttempts?: number;
  }): Promise<StoredOtp> {
    const normalized = data.email.toLowerCase().trim();
    const entry: StoredOtp = {
      id: `otp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      email: normalized,
      otpHash: data.otpHash,
      type: data.type,
      expiresAt: data.expiresAt,
      attempts: 0,
      maxAttempts: data.maxAttempts || 5,
      verified: false,
      createdAt: new Date(),
    };

    if (isPrismaAvailable()) {
      try {
        // Invalidate prior unverified OTPs for this email and type
        await prisma.otpVerification.updateMany({
          where: { email: normalized, type: data.type, verified: false },
          data: { verified: true },
        });

        const created = await prisma.otpVerification.create({
          data: {
            email: normalized,
            otpHash: data.otpHash,
            type: data.type,
            expiresAt: data.expiresAt,
            maxAttempts: data.maxAttempts || 5,
          },
        });

        return {
          id: created.id,
          email: created.email,
          otpHash: created.otpHash,
          type: created.type as StoredOtp["type"],
          expiresAt: created.expiresAt,
          attempts: created.attempts,
          maxAttempts: created.maxAttempts,
          verified: created.verified,
          createdAt: created.createdAt,
        };
      } catch {
        // fallback
      }
    }

    // Dev store fallback: invalidate previous
    for (const [key, val] of devOtps.entries()) {
      if (val.email === normalized && val.type === data.type) {
        devOtps.set(key, { ...val, verified: true });
      }
    }
    devOtps.set(entry.id, entry);
    return entry;
  },

  async findLatestValidOtp(
    email: string,
    type: "SIGNUP" | "PASSWORD_RESET" | "LOGIN"
  ): Promise<StoredOtp | null> {
    const normalized = email.toLowerCase().trim();

    if (isPrismaAvailable()) {
      try {
        const latest = await prisma.otpVerification.findFirst({
          where: {
            email: normalized,
            type,
            verified: false,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
        });
        if (latest) {
          return {
            id: latest.id,
            email: latest.email,
            otpHash: latest.otpHash,
            type: latest.type as StoredOtp["type"],
            expiresAt: latest.expiresAt,
            attempts: latest.attempts,
            maxAttempts: latest.maxAttempts,
            verified: latest.verified,
            createdAt: latest.createdAt,
          };
        }
      } catch {
        // fallback
      }
    }

    // Dev store fallback
    const matching = Array.from(devOtps.values())
      .filter((o) => o.email === normalized && o.type === type && !o.verified && o.expiresAt > new Date())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return matching[0] || null;
  },

  async findLatestPasswordResetOtp(email: string): Promise<StoredOtp | null> {
    const normalized = email.toLowerCase().trim();

    if (isPrismaAvailable()) {
      try {
        const latest = await prisma.otpVerification.findFirst({
          where: {
            email: normalized,
            type: "PASSWORD_RESET",
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
        });
        if (latest) {
          return {
            id: latest.id,
            email: latest.email,
            otpHash: latest.otpHash,
            type: latest.type as StoredOtp["type"],
            expiresAt: latest.expiresAt,
            attempts: latest.attempts,
            maxAttempts: latest.maxAttempts,
            verified: latest.verified,
            createdAt: latest.createdAt,
          };
        }
      } catch {
        // fallback
      }
    }

    // Dev store fallback
    const matching = Array.from(devOtps.values())
      .filter((o) => o.email === normalized && o.type === "PASSWORD_RESET" && o.expiresAt > new Date())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return matching[0] || null;
  },

  async invalidateOtp(id: string): Promise<void> {
    if (isPrismaAvailable()) {
      try {
        await prisma.otpVerification.update({
          where: { id },
          data: { verified: true, expiresAt: new Date(Date.now() - 1000) },
        });
      } catch {
        // fallback
      }
    }
    const mem = devOtps.get(id);
    if (mem) {
      devOtps.set(id, { ...mem, verified: true, expiresAt: new Date(Date.now() - 1000) });
    }
  },

  async incrementAttempts(id: string): Promise<number> {
    if (isPrismaAvailable()) {
      try {
        const updated = await prisma.otpVerification.update({
          where: { id },
          data: { attempts: { increment: 1 } },
        });
        return updated.attempts;
      } catch {
        // fallback
      }
    }

    const entry = devOtps.get(id);
    if (entry) {
      entry.attempts += 1;
      devOtps.set(id, entry);
      return entry.attempts;
    }
    return 1;
  },

  async markVerified(id: string): Promise<void> {
    if (isPrismaAvailable()) {
      try {
        await prisma.otpVerification.update({
          where: { id },
          data: { verified: true },
        });
        return;
      } catch {
        // fallback
      }
    }

    const entry = devOtps.get(id);
    if (entry) {
      entry.verified = true;
      devOtps.set(id, entry);
    }
  },
};
