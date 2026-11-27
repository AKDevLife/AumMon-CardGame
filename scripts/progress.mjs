#!/usr/bin/env node
/**
 * Roadmap progress from checkboxes in the platform + per-game roadmaps.
 * Counts top-level tasks only (`- [ ] **P.N** ...`); indented subtasks are ignored.
 * Usage: pnpm progress
 */
import { readFileSync } from "node:fs";

const FILES = [
  ["Platform", "docs/platform/ROADMAP.md"],
  ["BLUFF", "docs/games/bluff/ROADMAP.md"],
  ["Object Battle", "docs/games/object-battle/ROADMAP.md"],
];
const phases = [];
for (const [label, file] of FILES) {
  let current;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const heading = /^## (Phase \d+)\b(.*)$/.exec(line);
    if (heading) {
      const title = heading[2].replace(/^\s*[—-]\s*/, "");
      current = { name: `${label} · ${heading[1]}`, title, tasks: [] };
      phases.push(current);
      continue;
    }
    const task = /^- \[( |x|~|!)\] \*\*(\d+\.\d+)\*\*\s*(.*)$/.exec(line);
    if (task && current) {
      const status = { x: "done", "!": "blocked", "~": "in-progress" }[task[1]] ?? "todo";
      current.tasks.push({ id: task[2], title: task[3].split(" — ")[0], status });
    }
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
