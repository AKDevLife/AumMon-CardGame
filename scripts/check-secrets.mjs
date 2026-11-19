#!/usr/bin/env node
/**
 * Secret guard (blueprint Phase 1 exit criteria: "no secret in client bundle or Git").
 *
 * 1. Fails if any real .env file (other than .env.example) is tracked by Git.
 * 2. Scans tracked files and the built client bundle (dist/) for patterns that
 *    look like real credentials (Supabase secret keys, service-role JWTs,
 *    private keys, common provider tokens).
 *
 * Usage: node scripts/check-secrets.mjs   (run after `pnpm build` to include dist/)
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const SELF = "scripts/check-secrets.mjs";

const PATTERNS = [
  { name: "Supabase secret key", re: /sb_secret_[A-Za-z0-9_-]{16,}/ },
  { name: "Private key block", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  {
    name: "GitHub token",
    re: /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b|github_pat_[A-Za-z0-9_]{40,}/,
  },
  { name: "Vercel token assignment", re: /VERCEL_TOKEN\s*=\s*["']?[A-Za-z0-9]{20,}/ },
  { name: "Supabase access token", re: /\bsbp_[A-Za-z0-9]{30,}\b/ },
  { name: "AWS access key", re: /\bAKIA[0-9A-Z]{16}\b/ },
];

const JWT_RE = /eyJ[A-Za-z0-9_-]{10,}\.(eyJ[A-Za-z0-9_-]{10,})\.[A-Za-z0-9_-]{10,}/g;

/** Flags JWTs whose payload claims role=service_role. */
function findServiceRoleJwt(text) {
  for (const match of text.matchAll(JWT_RE)) {
    try {
      const payload = JSON.parse(Buffer.from(match[1], "base64url").toString("utf8"));
      if (payload && payload.role === "service_role") return true;
    } catch {
      // not a decodable JWT payload
    }
  }
  return false;
}

function trackedFiles() {
  const out = execFileSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    {
      cwd: root,
      encoding: "utf8",
    },
  );
  return out.split("\0").filter(Boolean);
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [relative(root, full)];
  });
}

const problems = [];

const files = trackedFiles();
for (const file of files) {
  const base = file.split("/").pop() ?? file;
  if (/^\.env(\..+)?$/.test(base) && base !== ".env.example") {
    problems.push(`${file}: environment file must not be committed`);
  }
}

const toScan = new Set([...files, ...walk(join(root, "dist"))]);
toScan.delete(SELF);

for (const file of toScan) {
  const full = join(root, file);
  if (!existsSync(full) || statSync(full).size > 5_000_000) continue;
  const text = readFileSync(full, "utf8");
  for (const { name, re } of PATTERNS) {
    if (re.test(text)) problems.push(`${file}: looks like a ${name}`);
  }
  if (findServiceRoleJwt(text)) problems.push(`${file}: contains a service_role JWT`);
}

if (problems.length > 0) {
  console.error("Secret check FAILED:\n" + problems.map((p) => `  - ${p}`).join("\n"));
  process.exit(1);
}
console.log(`Secret check passed (${toScan.size} files scanned).`);
