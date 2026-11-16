#!/usr/bin/env node
// Generates the favicon set and the 1200×630 Open Graph image into public/.
// Favicons come from brand/logos/logo-c-1.svg; the OG image is rendered with the
// self-hosted fonts and the outlined lockup, so it matches the site exactly.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import sharp from "sharp";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // global Playwright (see README)

const ROOT = process.cwd();
const PUB = resolve(ROOT, "public");
mkdirSync(PUB, { recursive: true });

const BG = "#06090D";
const FG = "#E4E9EE";
const MARK = 'M8 4h52.68v36H20v20H8Z M20 16v12h28.68V16Z';
const VIEWBOX = "2.34 0 64 64";

// 1. favicon.svg — follows the browser UI colour scheme so the mark never disappears.
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}"><style>path{fill:${FG}}@media (prefers-color-scheme:light){path{fill:${BG}}}</style><path fill-rule="evenodd" d="${MARK}"/></svg>\n`;
writeFileSync(resolve(PUB, "favicon.svg"), faviconSvg);

// 2. PNGs: mark on the brand ground, padded.
async function png(size, file, pad) {
  const inner = Math.round(size * (1 - pad * 2));
  const mark = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}" width="${inner}" height="${inner}"><path fill="${FG}" fill-rule="evenodd" d="${MARK}"/></svg>`);
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: await sharp(mark).png().toBuffer(), gravity: "center" }])
    .png({ compressionLevel: 9, palette: true })
    .toFile(resolve(PUB, file));
}
await png(32, "favicon-32.png", 0.06);
await png(180, "apple-touch-icon.png", 0.18);
await png(192, "icon-192.png", 0.18);
await png(512, "icon-512.png", 0.18);
await png(512, "icon-maskable-512.png", 0.28);

writeFileSync(
  resolve(PUB, "site.webmanifest"),
  JSON.stringify(
    {
      name: "Panright Studios",
      short_name: "Panright",
      start_url: "./",
      display: "browser",
      background_color: BG,
      theme_color: BG,
      icons: [
        { src: "icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "icon-512.png", sizes: "512x512", type: "image/png" },
        { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    null,
    2,
  ) + "\n",
);

// 3. OG image (1200×630): lockup + tagline, in the site's own type and frame.
const fontsDir = pathToFileURL(resolve(ROOT, "src/assets/fonts")).href;
const tokens = readFileSync(resolve(ROOT, "src/styles/tokens.css"), "utf8");
const { WORDMARK_PATH } = await import(pathToFileURL(resolve(ROOT, "src/components/logo-paths.generated.ts")).href).catch(async () => {
  const src = readFileSync(resolve(ROOT, "src/components/logo-paths.generated.ts"), "utf8");
  return { WORDMARK_PATH: JSON.parse(src.match(/WORDMARK_PATH = (".*?");/)[1]) };
});
const html = `<!doctype html><html><head><style>
${tokens}
@font-face{font-family:"Archivo";src:url(${fontsDir}/archivo-latin-var.woff2) format("woff2");font-weight:400 600;font-stretch:100% 125%}
@font-face{font-family:"IBM Plex Mono";src:url(${fontsDir}/ibm-plex-mono-latin-400.woff2) format("woff2")}
html,body{margin:0;width:1200px;height:630px;background:var(--color-bg);overflow:hidden}
body{position:relative;background-image:radial-gradient(360px 160px at 22% 55%, rgb(167 179 192 / .10), transparent),var(--glass-noise)}
.frame{position:absolute;left:64px;top:64px;width:1072px;height:448.5px;border:1px solid var(--color-border-strong);box-sizing:border-box}
.l{position:absolute;font:400 12px/1.4 var(--font-label);letter-spacing:.08em;color:var(--color-text-subtle);text-transform:uppercase}
h1{position:absolute;left:64px;bottom:64px;margin:0;font:500 72px/0.96 "Archivo";font-stretch:125%;letter-spacing:.01em;text-transform:uppercase;color:var(--color-text-primary);width:900px}
svg{position:absolute;left:64px;bottom:40px;height:28px;color:var(--color-text-primary)}
</style></head><body>
<div class="frame">
 <span class="l" style="left:16px;top:16px">SC 01 / TK 01</span>
 <span class="l" style="right:16px;top:16px">2.39 : 1</span>
 <span class="l" style="left:16px;bottom:16px">00:00:00:00</span>
 <h1>Know the film before the&nbsp;shoot.</h1>
</div>
<svg viewBox="0 0 346 48" fill="currentColor"><path d="${WORDMARK_PATH}"/><path fill-rule="evenodd" d="M290 10h53.02v28H290Z M295 15v18h43.02V15Z"/></svg>
</body></html>`;
writeFileSync("/tmp/og.html", html);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto("file:///tmp/og.html");
await page.evaluate(() => document.fonts.ready);
const shot = await page.screenshot({ type: "png" });
await browser.close();
await sharp(shot).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(resolve(PUB, "og.png"));
console.log("assets: favicon.svg, favicon-32.png, apple-touch-icon.png, icon-192/512, maskable, site.webmanifest, og.png");
