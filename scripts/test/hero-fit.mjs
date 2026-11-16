// Measures the hero against page-spec.md: frame ratio, inner height vs headline height,
// line count, CTA visibility and Archivo width-axis rendering.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const base = process.argv[2] ?? "http://localhost:4321";
const sizes = [[1440, 900], [1440, 780], [1366, 650], [1536, 730], [1280, 720], [1280, 1024], [1024, 768], [1024, 1366], [1920, 1080], [2560, 1440]];
const browser = await chromium.launch();
const rows = [];
for (const [w, h] of sizes) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const r = await page.evaluate(() => {
    const frame = document.querySelector("[data-hero-frame-desktop]").getBoundingClientRect();
    const title = document.querySelector(".hero__title");
    const t = title.getBoundingClientRect();
    const cs = getComputedStyle(title);
    const fs = parseFloat(cs.fontSize);
    const lh = parseFloat(cs.lineHeight);
    const cta = document.querySelector("[data-hero-cta]").getBoundingClientRect();
    const inset = 64;
    // width-axis check: same text at wdth 100 vs computed
    const mk = (st) => { const s = document.createElement("span"); s.textContent = "KNOW THE FILM"; s.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font-family:Archivo;font-size:100px;font-weight:500;font-stretch:${st}`; document.body.append(s); const w = s.getBoundingClientRect().width; s.remove(); return w; };
    const w100 = mk("100%"), w125 = mk("125%");
    return {
      frameW: +frame.width.toFixed(1), frameH: +frame.height.toFixed(1), ratio: +(frame.width / frame.height).toFixed(3),
      inner: +(frame.height - 2 * inset - 2).toFixed(1), headline: +t.height.toFixed(1), lines: Math.round(t.height / lh),
      fontSize: +fs.toFixed(1), titleRightInFrame: t.right <= frame.right - inset + 0.5, titleTopInFrame: t.top >= frame.top + inset - 0.5,
      ctaBottom: +cta.bottom.toFixed(1), ctaVisible: cta.bottom <= innerHeight, stretchRatio: +(w125 / w100).toFixed(3),
      archivoLoaded: document.fonts.check('500 100px Archivo'),
    };
  });
  rows.push({ viewport: `${w}x${h}`, ...r });
  await page.close();
}
await browser.close();
console.table(rows);
