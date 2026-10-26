interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodically clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000).unref?.();

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Check and record a rate-limit attempt for a given key
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return {
      allowed: true,
      remaining: options.max - 1,
      resetInSeconds: Math.ceil(options.windowMs / 1000),
    };
  }

  if (entry.count >= options.max) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: options.max - entry.count,
    resetInSeconds: Math.ceil((entry.resetAt - now) / 1000),
  };
}

/**
 * Standard Auth Limits
 */
export const AuthRateLimits = {
  // Max 5 signups per 15 minutes per IP
  SIGNUP: { windowMs: 15 * 60 * 1000, max: 5 },
  // Max 5 login attempts per 15 minutes per email/IP
  LOGIN: { windowMs: 15 * 60 * 1000, max: 5 },
  // Max 3 OTP resends per 10 minutes per email
  RESEND_OTP: { windowMs: 10 * 60 * 1000, max: 3 },
  // Max 5 OTP verification attempts per 10 minutes per email
  VERIFY_OTP: { windowMs: 10 * 60 * 1000, max: 5 },
  // Max 3 password reset requests per 15 minutes per email
  FORGOT_PASSWORD: { windowMs: 15 * 60 * 1000, max: 3 },
  // Max 5 public support / contact submissions per 15 minutes per IP (DoS & spam prevention)
  CONTACT: { windowMs: 15 * 60 * 1000, max: 5 },
  // Max 10 public feedback submissions per 15 minutes per IP (Spam prevention)
  FEEDBACK: { windowMs: 15 * 60 * 1000, max: 10 },
  // Max 3 admin seeding attempts per 15 minutes per IP
  ADMIN_SEED: { windowMs: 15 * 60 * 1000, max: 3 },
  // Max 30 email checks per minute per IP (prevents scraping/enumeration bots)
  CHECK_EMAIL: { windowMs: 60 * 1000, max: 30 },
  // Max 10 profile updates per 10 minutes per user/IP
  PROFILE_UPDATE: { windowMs: 10 * 60 * 1000, max: 10 },
  // Max 5 password changes per 15 minutes per user/IP
  CHANGE_PASSWORD: { windowMs: 15 * 60 * 1000, max: 5 },
  // Max 60 analytics beacon pings per minute per IP (prevents DDoS on database)
  TRACK_ANALYTICS: { windowMs: 60 * 1000, max: 60 },
};
