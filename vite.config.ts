import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// Only variables prefixed with VITE_ are exposed to the browser bundle.
// Never prefix a secret / service-role key with VITE_.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  // Build-log diagnostic (never prints values): shows whether the hosting
  // provider passed the public Supabase settings to this build.
  const present = (key: string) => (env[key] ? "set" : "MISSING");
  console.log(
    `[aummon] VITE_SUPABASE_URL: ${present("VITE_SUPABASE_URL")}, VITE_SUPABASE_PUBLISHABLE_KEY: ${present("VITE_SUPABASE_PUBLISHABLE_KEY")}`,
  );
  return {
    plugins: [react(), tailwindcss()],
    envPrefix: "VITE_",
    server: { port: 5173, strictPort: true },
    preview: { port: 4173, strictPort: true },
    build: { sourcemap: false },
  };
});
