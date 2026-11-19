import { HttpError } from "./http.ts";
import { db } from "./db.ts";

/**
 * Fixed-window rate limit per user/action (blueprint §4.9). Uses its own
 * autocommit statement so rejected (rolled-back) requests still count.
 */
export async function rateLimit(
  userId: string,
  action: string,
  limit: number,
  windowSeconds: number,
) {
  const [row] = await db()<{ count: number }[]>`
    insert into private.rate_limits (user_id, action, window_start, count)
    values (${userId}, ${action}, to_timestamp(floor(extract(epoch from now()) / ${windowSeconds}) * ${windowSeconds}), 1)
    on conflict (user_id, action, window_start) do update set count = private.rate_limits.count + 1
    returning count`;
  if ((row?.count ?? 0) > limit)
    throw new HttpError(429, "rate_limited", "Too many requests, try again shortly");
}
