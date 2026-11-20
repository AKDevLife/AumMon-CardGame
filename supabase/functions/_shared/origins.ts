/**
 * CORS allow-list matching (pure, unit-tested). Patterns are exact origins or
 * `https://*<suffix>` wildcards (e.g. `https://*-aum-mon.vercel.app` for Vercel
 * preview deployments). Wildcards only match plain https origins.
 */
export function originAllowed(origin: string, patterns: readonly string[]): boolean {
  return patterns.some((p) =>
    p.startsWith("https://*")
      ? /^https:\/\/[a-z0-9.-]+$/i.test(origin) && origin.endsWith(p.slice("https://*".length))
      : p === origin,
  );
}
