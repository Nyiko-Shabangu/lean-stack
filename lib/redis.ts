import Redis from 'ioredis';
import { env } from './env';
import type { RateLimitResult } from '@/types';

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
});

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err);
});

// ─── Atomic rate limiter using a Lua script ───────────────────────────────────
// Avoids the race condition of incr + expire being two separate commands.
// Returns [current_count, ttl_seconds]
const rateLimitScript = `
  local key = KEYS[1]
  local limit = tonumber(ARGV[1])
  local window = tonumber(ARGV[2])

  local current = redis.call('INCR', key)

  if current == 1 then
    redis.call('EXPIRE', key, window)
  end

  local ttl = redis.call('TTL', key)
  return {current, ttl}
`;

/**
 * Check and increment a rate limit bucket.
 *
 * @param identifier  Unique key — combine userId + route for per-endpoint limits.
 *                    e.g. `rl:${userId}:chat`
 * @param limit       Max requests allowed in the window
 * @param windowSecs  Rolling window length in seconds
 */
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowSecs: number
): Promise<RateLimitResult> {
  const result = await redis.eval(
    rateLimitScript,
    1,
    `rl:${identifier}`,
    limit.toString(),
    windowSecs.toString()
  ) as [number, number];

  const [current, ttl] = result;

  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current),
    resetInSeconds: ttl,
  };
}

export default redis;
