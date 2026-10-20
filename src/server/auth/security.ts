import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const BCRYPT_SALT_ROUNDS = 10;

export interface TokenPayload {
  userId: string;
  email: string;
  role: "SUPER_ADMIN" | "RESTAURANT_OWNER" | "STAFF";
  fullName?: string | null;
}

/**
 * Hash a plain text password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Compare a plain text password with a bcrypt hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a cryptographically secure 6-digit numeric OTP
 */
export function generateNumericOtp(): string {
  // Generates integer between 100000 and 999999 inclusive
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hash an OTP for secure storage in PostgreSQL
 */
export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, BCRYPT_SALT_ROUNDS);
}

/**
 * Compare a candidate OTP with its stored hash
 */
export async function compareOtp(candidateOtp: string, storedHash: string): Promise<boolean> {
  return bcrypt.compare(candidateOtp, storedHash);
}

/**
 * Generate a JWT access token
 */
export function signAccessToken(payload: TokenPayload): string {
  const secret = process.env["JWT_SECRET"] || "menuly-dev-secret-key-fallback-32chars";
  const expiresIn = process.env["JWT_EXPIRES_IN"] || "7d";
  return jwt.sign(payload, secret, { expiresIn: expiresIn as "7d" });
}

/**
 * Verify and decode a JWT access token
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const secret = process.env["JWT_SECRET"] || "menuly-dev-secret-key-fallback-32chars";
    return jwt.verify(token, secret) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Generate a random refresh token string and its hash
 */
export function generateRefreshToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(40).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hash };
}

/**
 * Hash a candidate refresh token
 */
export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
