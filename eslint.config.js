// @ts-check
import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * Engine isolation (blueprint section 2 "Engine Isolation Rule" and 5.1).
 * packages/game-engine must stay pure TypeScript: no React, Supabase, UI,
 * Node.js, Deno, HTTP or database code.
 */
const engineRestrictedImports = {
  paths: [
    { name: "react", message: "game-engine must not depend on React." },
    { name: "react-dom", message: "game-engine must not depend on React." },
  ],
  patterns: [
    { group: ["react/*", "react-dom/*"], message: "game-engine must not depend on React." },
    { group: ["@supabase/*", "supabase"], message: "game-engine must not depend on Supabase." },
    { group: ["node:*"], message: "game-engine must be runtime-agnostic (no Node.js APIs)." },
    { regex: "^(npm|jsr|https?):", message: "game-engine must not import remote modules." },
  ],
};

const crossLayerMessage =
  "game-engine must not import frontend (src/) or backend (supabase/) code.";

export default tseslint.config(
  {
    ignores: [
      "dist/",
      "coverage/",
      "playwright-report/",
      "test-results/",
      "supabase/.temp/",
      "node_modules/",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["eslint.config.js", "scripts/*.mjs"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
    },
  },
  {
    files: ["eslint.config.js", "scripts/**/*.mjs"],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: { globals: globals.node },
  },

  // Frontend
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },

  // Node-side config and test files
  {
    files: ["*.config.ts", "tests/**/*.ts"],
    languageOptions: { globals: globals.node },
  },

  // Pure game engine — strict isolation
  {
    files: ["packages/game-engine/**/*.ts"],
    languageOptions: { globals: {} },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          ...engineRestrictedImports,
          patterns: [
            ...engineRestrictedImports.patterns,
            { regex: "(^|/)(src|supabase)(/|$)", message: crossLayerMessage },
          ],
        },
      ],
      "@typescript-eslint/no-restricted-imports": "off",
      "no-restricted-globals": [
        "error",
        ...[
          "window",
          "document",
          "localStorage",
          "sessionStorage",
          "navigator",
          "fetch",
          "XMLHttpRequest",
          "WebSocket",
          "process",
          "Buffer",
          "require",
          "Deno",
          "Bun",
          "setTimeout",
          "setInterval",
        ].map((name) => ({
          name,
          message: "game-engine is pure and runtime-agnostic; inject this via the adapter layer.",
        })),
      ],
      "no-restricted-properties": [
        "error",
        {
          object: "Math",
          property: "random",
          message: "Use the injected RandomSource so results are deterministic and replayable.",
        },
        {
          object: "Date",
          property: "now",
          message: "Pass time in as a parameter; the engine must be deterministic.",
        },
        {
          object: "crypto",
          property: "getRandomValues",
          message: "Use the injected RandomSource.",
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "NewExpression[callee.name='Date']",
          message: "Pass time in as a parameter; the engine must be deterministic.",
        },
      ],
    },
  },
  {
    // Engine tests may use the test runner but not runtime-specific APIs.
    files: ["packages/game-engine/tests/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          ...engineRestrictedImports,
          patterns: [
            ...engineRestrictedImports.patterns,
            // Tests may import the engine's own ../src only.
            { regex: "^(?!\\.\\./src/)(.*/)?(src|supabase)(/|$)", message: crossLayerMessage },
          ],
        },
      ],
    },
  },
);
