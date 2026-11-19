import postgres from "npm:postgres@3.4.9";

let sql: ReturnType<typeof postgres> | undefined;

/** Server-only Postgres connection (SUPABASE_DB_URL is provided by the Edge Runtime). */
export function db(): ReturnType<typeof postgres> {
  if (!sql) {
    const url = Deno.env.get("SUPABASE_DB_URL");
    if (!url) throw new Error("SUPABASE_DB_URL not configured");
    sql = postgres(url, { max: 2, prepare: false, idle_timeout: 20 });
  }
  return sql;
}
