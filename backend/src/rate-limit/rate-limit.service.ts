import { Injectable } from '@nestjs/common';

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

export interface CheckLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
}

@Injectable()
export class RateLimitService {
  private store = new Map<string, RateLimitEntry>();

  async checkLimit(
    key: string,
    limit: number,
    windowMs: number,
  ): Promise<CheckLimitResult> {
    const now = Date.now();
    const entry = this.store.get(key);

    // If no entry or window expired, start fresh
    if (!entry || now - entry.windowStart >= windowMs) {
      this.store.set(key, { count: 1, windowStart: now });
      return { allowed: true, remaining: limit - 1 };
    }

    // Check if limit exceeded
    if (entry.count >= limit) {
      const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
      return { allowed: false, remaining: 0, retryAfter };
    }

    // Increment count
    entry.count++;
    return { allowed: true, remaining: limit - entry.count };
  }

  async getRemainingRequests(key: string, limit: number): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) {
      return limit;
    }
    return Math.max(0, limit - entry.count);
  }
}
