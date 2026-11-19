import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "engine",
          environment: "node",
          include: ["packages/game-engine/tests/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "architecture",
          environment: "node",
          include: [
            "tests/architecture/**/*.test.ts",
            "tests/integration/**/*.test.ts",
            "tests/backend/**/*.test.ts",
          ],
        },
      },
      {
        plugins: [react()],
        test: {
          name: "web",
          environment: "jsdom",
          include: ["src/**/*.test.{ts,tsx}"],
          setupFiles: ["src/test/setup.ts"],
        },
      },
    ],
  },
});
