/** HTTP helpers: CORS allow-list, JSON responses, safe body parsing. */
import { recordMetric } from "./metrics.ts";
import { originAllowed } from "./origins.ts";

const DEFAULT_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173", "http://127.0.0.1:4173"];
const MAX_BODY_BYTES = 8 * 1024;

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function allowedOrigin(origin: string | null): string | null {
  if (!origin) return null;
  const configured = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const patterns = configured.length > 0 ? configured : DEFAULT_ORIGINS;
  return originAllowed(origin, patterns) ? origin : null;
}

function corsHeaders(request: Request): Record<string, string> {
  const origin = allowedOrigin(request.headers.get("origin"));
  return origin
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        Vary: "Origin",
      }
    : { Vary: "Origin" };
}

export function json(request: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...corsHeaders(request),
    },
  });
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES)
    throw new HttpError(413, "payload_too_large", "Request body too large");
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    throw new HttpError(400, "invalid_json", "Body must be JSON");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new HttpError(400, "invalid_body", "Body must be a JSON object");
  }
  return parsed as Record<string, unknown>;
}

/** Wraps a handler with CORS preflight, method check and safe error responses. */
export function handler(
  fn: (request: Request) => Promise<unknown>,
): (request: Request) => Promise<Response> {
  return async (request) => {
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    if (request.method !== "POST") return json(request, { error: "method_not_allowed" }, 405);
    const startedAt = performance.now();
    let status = 200;
    let code: string | null = null;
    try {
      return json(request, await fn(request));
    } catch (error) {
      if (error instanceof HttpError) {
        status = error.status;
        code = error.code;
        return json(request, { error: error.code, message: error.message }, error.status);
      }
      // Never leak internals (state, SQL, stack) to the client.
      console.error("Unhandled error", error instanceof Error ? error.message : error);
      status = 500;
      code = "internal_error";
      return json(request, { error: "internal_error" }, 500);
    } finally {
      await recordMetric(request, status, code, startedAt);
    }
  };
}
