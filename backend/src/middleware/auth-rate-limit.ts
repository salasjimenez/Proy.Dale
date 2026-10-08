import type { RequestHandler } from "express";
import { env } from "../config/env.js";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS_BEFORE_CLEANUP = 5000;

function cleanupExpired(now: number): void {
  if (buckets.size < MAX_BUCKETS_BEFORE_CLEANUP) return;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function clientKey(ip: string | undefined): string {
  return ip?.trim() || "unknown";
}

export const authRateLimit: RequestHandler = (req, res, next) => {
  const now = Date.now();
  cleanupExpired(now);

  const key = clientKey(req.ip);
  const current = buckets.get(key);
  const bucket = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + env.authRateLimitWindowMs }
    : current;

  bucket.count += 1;
  buckets.set(key, bucket);

  const remaining = Math.max(0, env.authRateLimitMax - bucket.count);
  const resetSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  res.setHeader("RateLimit-Limit", String(env.authRateLimitMax));
  res.setHeader("RateLimit-Remaining", String(remaining));
  res.setHeader("RateLimit-Reset", String(resetSeconds));

  if (bucket.count > env.authRateLimitMax) {
    res.status(429).json({
      error: "RATE_LIMITED",
      message: "Demasiados intentos seguidos. Espera unos minutos antes de volver a intentar.",
      retryAfterSeconds: resetSeconds,
    });
    return;
  }

  next();
};

export function resetAuthRateLimitForTests(): void {
  buckets.clear();
}
