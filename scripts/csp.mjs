#!/usr/bin/env node
// Prints the Content-Security-Policy for the built site, with sha256 hashes of
// every inline <script> (the motion gate). Re-run after each build; paste into
// the CloudFront response headers policy (infra/DEPLOY.md §6).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
const DIST = join(process.cwd(), "dist");
const html = (function walk(d) { return readdirSync(d).flatMap((n) => statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : n.endsWith(".html") ? [join(d, n)] : []); })(DIST);
const hashes = new Set();
for (const f of html) {
  for (const m of readFileSync(f, "utf8").matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/\ssrc=|ld\+json/.test(m[1])) continue;
    hashes.add(`'sha256-${createHash("sha256").update(m[2]).digest("base64")}'`);
  }
}
const csp = [
  "default-src 'self'",
  `script-src 'self' ${[...hashes].join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");
console.log(csp);
