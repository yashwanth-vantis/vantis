#!/usr/bin/env node
// Lists every unresolved [PLACEHOLDER] in the content source and public files.
// Exits 1 if any remain. Runs before `npm run build`.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const TARGETS = ["src/content", "public"];
const EXT = /\.(ts|json|md|txt|webmanifest|xml|html)$/;
const PATTERN = /\[[A-Z][A-Z0-9 &\/-]*(?::[^\]\n]*)?\]/g;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : EXT.test(name) ? [p] : [];
  });
}

const hits = [];
for (const t of TARGETS) {
  let files = [];
  try { files = walk(join(ROOT, t)); } catch { continue; }
  for (const file of files) {
    readFileSync(file, "utf8").split("\n").forEach((line, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return; // skip comments
      for (const m of line.matchAll(PATTERN)) hits.push({ file: relative(ROOT, file), line: i + 1, text: m[0] });
    });
  }
}

if (!hits.length) {
  console.log("check:placeholders  0 unresolved placeholders.");
  process.exit(0);
}
const unique = [...new Set(hits.map((h) => h.text))];
console.error(`check:placeholders  ${unique.length} unresolved placeholder(s), ${hits.length} occurrence(s):\n`);
for (const h of hits) console.error(`  ${h.file}:${h.line}  ${h.text}`);
console.error(`\nUnique:\n${unique.map((u) => `  ${u}`).join("\n")}`);
console.error("\nResolve these in src/content/site.ts before a production build.");
process.exit(1);
