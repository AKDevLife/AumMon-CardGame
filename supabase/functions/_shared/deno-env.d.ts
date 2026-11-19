// Minimal Deno ambient types so Edge Functions are type-checked with the repo's
// TypeScript (tsconfig.functions.json). Runtime is Supabase Edge Runtime (Deno).
declare namespace Deno {
  interface Env {
    get(key: string): string | undefined;
  }
  const env: Env;
  function serve(handler: (request: Request) => Response | Promise<Response>): unknown;
}
