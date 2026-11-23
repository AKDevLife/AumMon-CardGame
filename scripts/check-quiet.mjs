#!/usr/bin/env node
/**
 * Runs the same steps as `pnpm check` but prints output only for failing steps.
 * Usage: pnpm check:quiet
 */
import { spawnSync } from "node:child_process";

const steps = ["typecheck", "lint", "format:check", "test", "build", "check:secrets"];

for (const step of steps) {
  const r = spawnSync("pnpm", ["-s", step], {
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (r.status !== 0) {
    const out = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim().split("\n");
    console.log(`FAIL ${step}\n${out.slice(-60).join("\n")}`);
    process.exit(r.status ?? 1);
  }
  console.log(`ok   ${step}`);
}
