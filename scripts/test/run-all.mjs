// Runs the automated checks against a running preview (npm run preview).
import { execFileSync } from "node:child_process";
const base = process.argv[2] ?? "http://localhost:4321";
for (const s of ["scripts/test/hero-fit.mjs", "scripts/test/behaviour.mjs"]) {
  console.log(`\n▶ ${s}`);
  execFileSync(process.execPath, [s, base], { stdio: "inherit" });
}
