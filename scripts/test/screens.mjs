// Screenshots of every page at the review viewports. Usage: node scripts/test/screens.mjs [baseURL] [outDir] [--reduced]
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const { chromium } = createRequire(import.meta.url)("playwright");
const base = process.argv[2] ?? "http://localhost:4321";
const out = process.argv[3] ?? "screenshots";
const reduced = process.argv.includes("--reduced");
const full = !process.argv.includes("--fold");
mkdirSync(out, { recursive: true });
const pages = { home: "/", services: "/services/", about: "/about/", contact: "/contact/", privacy: "/privacy/", "404": "/missing-page/" };
const sizes = [[1440, 900], [1366, 650], [1280, 720], [1024, 768], [768, 1024], [390, 844]];
const browser = await chromium.launch();
for (const [w, h] of sizes) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: reduced ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  for (const [name, path] of Object.entries(pages)) {
    await page.goto(base + path, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    // let the hero sequence finish, then scroll through to fire every reveal
    await page.waitForTimeout(1800);
    if (full) {
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 300) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(900);
    }
    await page.screenshot({ path: `${out}/${name}-${w}x${h}${full ? "" : "-fold"}.png`, fullPage: full });
  }
  await ctx.close();
}
await browser.close();
console.log("screenshots written to", out);
