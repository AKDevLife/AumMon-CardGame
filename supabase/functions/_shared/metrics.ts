import { db } from "./db.ts";

/** Records one request metric (never blocks or fails the request). Task 7.2. */
export async function recordMetric(
  request: Request,
  status: number,
  errorCode: string | null,
  startedAt: number,
) {
  const fn = new URL(request.url).pathname.split("/").filter(Boolean).pop() ?? "unknown";
  try {
    await db()`
      insert into private.function_metrics (function_name, status, error_code, duration_ms)
      values (${fn.slice(0, 64)}, ${status}, ${errorCode}, ${Math.round(performance.now() - startedAt)})`;
  } catch (error) {
    console.error("metric write failed", error instanceof Error ? error.message : error);
  }
}
