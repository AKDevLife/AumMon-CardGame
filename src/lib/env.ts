/**
 * Public (browser-safe) configuration.
 *
 * Only VITE_* variables reach the client bundle. They must contain public
 * values only: the Supabase project URL and the publishable/anon key.
 * Secret / service-role keys belong to Edge Functions and must NEVER be
 * prefixed with VITE_.
 */
export interface PublicEnv {
  supabaseUrl: string | undefined;
  supabasePublishableKey: string | undefined;
}

export function readPublicEnv(env: ImportMetaEnv = import.meta.env): PublicEnv {
  return {
    supabaseUrl: env.VITE_SUPABASE_URL,
    supabasePublishableKey: env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
}
