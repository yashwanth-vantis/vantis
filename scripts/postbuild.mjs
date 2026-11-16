#!/usr/bin/env node
// Post-build guard: fails if built HTML/CSS/JS references any external host
// (fonts, CDNs, analytics). Only the [DOMAIN] canonical/OG URLs and schema.org
// / sitemaps.org / w3.org namespaces are allowed. Prints a size summary.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";
import { brotliCompressSync, gzipSync } from "node:zlib";

const DIST = join(process.cwd(), "dist");
const files = (function walk(d) {
  return readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
})(DIST);

const ALLOWED = /^https?:\/\/(\[DOMAIN\]|schema\.org|www\.sitemaps\.org|www\.w3\.org|c2pa\.org)/;
// GSAP ships its docs URL inside console-warning strings; that is text, not a request.
const TEXT_ONLY = /^https?:\/\/(gsap\.com|greensock\.com)/;
const bad = [];
let raw = 0, br = 0, gz = 0;
for (const f of files) {
  const ext = extname(f);
  const buf = readFileSync(f);
  raw += buf.length;
  if ([".html", ".css", ".js", ".svg", ".xml", ".txt", ".webmanifest"].includes(ext)) {
    br += brotliCompressSync(buf).length;
    gz += gzipSync(buf, { level: 9 }).length;
    const text = buf.toString("utf8");
    for (const m of text.matchAll(/https?:\/\/[^\s"'<>)]+/g)) if (!ALLOWED.test(m[0]) && !(ext === ".js" && TEXT_ONLY.test(m[0]))) bad.push(`${relative(DIST, f)}  ${m[0]}`);
  } else {
    br += buf.length; gz += buf.length;
  }
}
if (bad.length) {
  console.error("postbuild: external references found:\n" + [...new Set(bad)].map((b) => "  " + b).join("\n"));
  process.exit(1);
}
console.log(`postbuild: ${files.length} files, ${(raw / 1024).toFixed(1)} KB raw, ~${(br / 1024).toFixed(1)} KB brotli, no external hosts.`);
