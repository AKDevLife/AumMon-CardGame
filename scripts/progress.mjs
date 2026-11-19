#!/usr/bin/env node
/**
 * Computes roadmap progress from docs/DEVELOPMENT_ROADMAP.md checkboxes.
 * Counts top-level tasks only (`- [ ] **P.N** ...`); indented subtasks are ignored.
 * Usage: pnpm progress
 */
import { readFileSync } from "node:fs";

const text = readFileSync("docs/DEVELOPMENT_ROADMAP.md", "utf8");
const phases = [];
let current;

for (const line of text.split("\n")) {
  const heading = /^## (Phase \d+)\b(.*)$/.exec(line);
  if (heading) {
    current = { name: heading[1], title: heading[2].replace(/^\s*[—-]\s*/, ""), tasks: [] };
    phases.push(current);
    continue;
  }
  const task = /^- \[( |x)\] \*\*(\d+\.\d+)\*\*\s*(.*)$/.exec(line);
  if (task && current) {
    const rest = task[3];
    const status =
      task[1] === "x"
        ? "done"
        : rest.includes("🔒")
          ? "blocked"
          : rest.includes("⏳")
            ? "in-progress"
            : "todo";
    current.tasks.push({ id: task[2], title: rest.split(" — ")[0], status });
  }
}

const pct = (done, total) => (total === 0 ? 0 : Math.round((done / total) * 100));
let done = 0;
let total = 0;
console.log("| Phase | Done | Total | % |\n|---|---:|---:|---:|");
for (const p of phases) {
  const d = p.tasks.filter((t) => t.status === "done").length;
  done += d;
  total += p.tasks.length;
  console.log(`| ${p.name} ${p.title} | ${d} | ${p.tasks.length} | ${pct(d, p.tasks.length)}% |`);
}
console.log(`| **Overall** | **${done}** | **${total}** | **${pct(done, total)}%** |`);

for (const status of ["in-progress", "blocked"]) {
  const list = phases.flatMap((p) => p.tasks.filter((t) => t.status === status));
  console.log(
    `\n${status}: ${list.length ? list.map((t) => `${t.id} ${t.title}`).join("; ") : "none"}`,
  );
}
