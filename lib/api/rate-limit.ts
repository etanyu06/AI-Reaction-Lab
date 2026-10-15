import { AppError } from "@/lib/api/errors";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const memoryStore = new Map<string, RateLimitEntry>();

export type RateLimitRule = {
  key: string;
  limit: number;
  windowMs: number;
};

export async function enforceRateLimit(rule: RateLimitRule) {
  const now = Date.now();
  const current = memoryStore.get(rule.key);

  if (!current || current.resetAt <= now) {
    memoryStore.set(rule.key, {
      count: 1,
      resetAt: now + rule.windowMs
    });
    return;
  }

  if (current.count >= rule.limit) {
    throw new AppError("RATE_LIMITED", "Too many requests. Please try again later.", 429);
  }

  current.count += 1;
}

export function rateLimitKey(parts: Array<string | number | null | undefined>) {
  return parts.filter(Boolean).join(":");
}
