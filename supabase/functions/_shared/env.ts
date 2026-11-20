/** Deployment tier (AUMMON_ENV). Unknown or unset → production, the safest default. */
export type AppEnv = "development" | "staging" | "production";

export function parseAppEnv(value: string | undefined): AppEnv {
  return value === "development" || value === "staging" ? value : "production";
}
