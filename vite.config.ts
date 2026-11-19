import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Only variables prefixed with VITE_ are exposed to the browser bundle.
// Never prefix a secret / service-role key with VITE_.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  envPrefix: "VITE_",
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: { sourcemap: false },
});
