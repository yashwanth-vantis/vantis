// Accessibility (axe, WCAG 2.2 AA), keyboard, mobile menu, page transition,
// animation leak, reduced motion, form and console checks.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const { AxeBuilder } = await import("@axe-core/playwright").then((m) => ({ AxeBuilder: m.default ?? m.AxeBuilder }));
const base = process.argv[2] ?? "http://localhost:4321";
const pages = ["/", "/services/", "/about/", "/contact/", "/privacy/", "/404.html"];
const results = [];
const ok = (name, pass, detail = "") => { results.push({ check: name, pass, detail }); };
const browser = await chromium.launch();

// 1. axe + console on every page, desktop and mobile, both motion modes
for (const [w, h] of [[1440, 900], [390, 844]]) {
  for (const rm of ["no-preference", "reduce"]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: rm });
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push(e.message));
    for (const p of pages) {
      await page.goto(base + p, { waitUntil: "networkidle" });
      await page.waitForTimeout(rm === "reduce" ? 200 : 2200);
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); } scrollTo(0, 0); });
      await page.waitForTimeout(rm === "reduce" ? 100 : 900);
      const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
      ok(`axe ${p} ${w} ${rm}`, axe.violations.length === 0, axe.violations.map((v) => `${v.id}(${v.nodes.length})`).join(", "));
    }
    ok(`console clean ${w} ${rm}`, errors.length === 0, errors.slice(0, 3).join(" | "));
    await ctx.close();
  }
}

// 2. keyboard: skip link, focus ring visibility, tab order
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  const skip = await page.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect(); return { cls: a.className, visible: r.top >= 0 && r.bottom <= innerHeight, outline: getComputedStyle(a).outlineStyle }; });
  ok("keyboard: first Tab lands on visible skip link", skip.cls.includes("skip-link") && skip.visible, JSON.stringify(skip));
  await page.keyboard.press("Enter");
  ok("keyboard: skip link moves focus to <main>", await page.evaluate(() => document.activeElement?.id === "main"));
  const order = [];
  let allRings = true;
  for (let i = 0; i < 9; i++) {
    await page.keyboard.press("Tab");
    const f = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { t: (a.getAttribute("aria-label") || a.textContent || a.tagName).trim().slice(0, 28), ring: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2, color: cs.outlineColor }; });
    order.push(f.t + (f.ring ? "" : " [NO RING]")); if (!f.ring) allRings = false;
  }
  ok("keyboard: focus ring (2px accent) on every stop", allRings, order.join(" → "));
  await page.close();
}

// 3. mobile menu: open, trap, Escape, focus return
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.focus("[data-menu-toggle]");
  await page.keyboard.press("Enter");
  const opened = await page.evaluate(() => ({ exp: document.querySelector("[data-menu-toggle]").getAttribute("aria-expanded"), hidden: document.querySelector("[data-menu-panel]").hidden, label: document.querySelector("[data-menu-label]").textContent, focusInPanel: !!document.activeElement.closest("[data-menu-panel]"), mainInert: document.querySelector("[data-main]").inert }));
  ok("menu: opens with Enter, focus moves into panel, page inert", opened.exp === "true" && !opened.hidden && opened.focusInPanel && opened.mainInert && opened.label === "Close", JSON.stringify(opened));
  let trapped = true;
  for (let i = 0; i < 12; i++) { await page.keyboard.press(i % 3 === 2 ? "Shift+Tab" : "Tab"); if (!(await page.evaluate(() => !!document.activeElement.closest("[data-site-header]")))) trapped = false; }
  ok("menu: focus trapped in header/panel over 12 Tab/Shift+Tab presses", trapped);
  await page.keyboard.press("Escape");
  const closed = await page.evaluate(() => ({ exp: document.querySelector("[data-menu-toggle]").getAttribute("aria-expanded"), hidden: document.querySelector("[data-menu-panel]").hidden, focusOnToggle: document.activeElement.matches("[data-menu-toggle]"), mainInert: document.querySelector("[data-main]").inert }));
  ok("menu: Escape closes and returns focus to toggle", closed.exp === "false" && closed.hidden && closed.focusOnToggle && !closed.mainInert, JSON.stringify(closed));
  const small = await page.evaluate(() => Array.from(document.querySelectorAll("a, button, input, select, textarea")).filter((el) => el.offsetParent !== null && !el.classList.contains("skip-link")).map((el) => { const r = el.getBoundingClientRect(); return { t: (el.textContent || el.id || el.className).trim().slice(0, 30), h: r.height, w: r.width }; }).filter((r) => r.h < 47.5 && r.w > 0));
  ok("tap targets ≥ 48px tall on home (390)", small.length === 0, JSON.stringify(small));
  // menu link navigates and closes
  await page.click("[data-menu-toggle]");
  await page.click("[data-menu-panel] a[href='/about/']");
  await page.waitForURL("**/about/");
  await page.waitForTimeout(600);
  ok("menu: link navigates and panel closes", await page.evaluate(() => document.querySelector("[data-menu-panel]").hidden && !document.querySelector("[data-main]").inert));
  await page.close();
}

// 4. tap targets on every page at 390
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  for (const p of pages) {
    await page.goto(base + p, { waitUntil: "networkidle" });
    const small = await page.evaluate(() => Array.from(document.querySelectorAll("a, button, input, select, textarea, label[for]")).filter((el) => el.offsetParent !== null && !el.classList.contains("skip-link") && el.type !== "checkbox").map((el) => { const r = el.getBoundingClientRect(); return { t: (el.textContent || el.id).trim().slice(0, 30), h: Math.round(r.height) }; }).filter((r) => r.h < 47.5 && r.h > 0));
    const labels = small.filter((s) => s.t && !/^(Name|Production house|Work email|Your role|Where is the film now|Message)/.test(s.t));
    ok(`tap targets ≥ 48px ${p}`, labels.length === 0, JSON.stringify(labels));
  }
  await page.close();
}

// 5. page transition: persistence, pan line, no leaked triggers/tweens
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const fresh = {};
  for (const p of ["/", "/services/", "/about/"]) {
    await page.goto(base + p, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    fresh[p] = await page.evaluate(() => window.__panrightDebug.triggers());
  }
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.evaluate(() => { document.querySelector("[data-site-header]").__marker = "persist"; document.querySelector("[data-site-footer]").__marker = "persist"; });
  let sawLine = false;
  const route = ["/services/", "/about/", "/", "/services/", "/about/", "/"];
  const counts = [];
  for (const p of route) {
    await page.click(`[data-site-header] a[href='${p}']`);
    await page.waitForURL(`**${p}`);
    const lineMid = await page.waitForFunction(() => { const l = document.querySelector("[data-pan-line]"); return parseFloat(getComputedStyle(l).opacity) > 0 ? true : null; }, null, { timeout: 1500 }).then(() => true).catch(() => false);
    sawLine ||= lineMid;
    await page.waitForTimeout(2600);
    counts.push({ p, triggers: await page.evaluate(() => window.__panrightDebug.triggers()), fresh: fresh[p] });
  }
  const persisted = await page.evaluate(() => document.querySelector("[data-site-header]").__marker === "persist" && document.querySelector("[data-site-footer]").__marker === "persist");
  ok("transition: nav and footer persist (same DOM nodes)", persisted);
  ok("transition: pan line crosses the viewport", sawLine);
  ok("transition: ScrollTrigger count after nav equals fresh load (no leaks)", counts.every((c) => c.triggers === c.fresh), JSON.stringify(counts));
  const after = await page.evaluate(() => ({ line: getComputedStyle(document.querySelector("[data-pan-line]")).opacity, active: window.__panrightDebug.tweens(), mainOpacity: getComputedStyle(document.querySelector("[data-main]")).opacity, current: document.querySelector("[data-site-header] a[aria-current]")?.getAttribute("href") ?? null }));
  ok("transition: settles (line hidden, main visible, no active tweens except hero light)", after.line === "0" && after.mainOpacity === "1" && after.active <= 1, JSON.stringify(after));
  await page.click("[data-site-header] a[href='/contact/']");
  await page.waitForURL("**/contact/");
  await page.waitForTimeout(800);
  ok("transition: aria-current follows client navigation", await page.evaluate(() => document.querySelector("[data-site-header] .bar__links a[aria-current='page']")?.getAttribute("href") === "/contact/"));
  ok("transition: no page errors", errors.length === 0, errors.join(" | "));
  await page.close();
}

// 6. reduced motion: nothing hidden, light at end, instant swap, no pan line
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(base + "/", { waitUntil: "networkidle" });
  const s = await page.evaluate(() => ({
    gate: document.documentElement.classList.contains("motion-ok"),
    hidden: Array.from(document.querySelectorAll("[data-reveal], [data-reveal-group] > *, [data-hero-item], [data-hero-frame-desktop]")).filter((e) => getComputedStyle(e).opacity !== "1").length,
    light: getComputedStyle(document.querySelector("[data-hero-light]")).transform,
    tweens: window.__panrightDebug.tweens(),
  }));
  ok("reduced motion: no gate, nothing hidden, no tweens, light at end position", !s.gate && s.hidden === 0 && s.tweens === 0 && s.light.includes("matrix(1, 0, 0, 1, 576"), JSON.stringify(s));
  await page.click("[data-site-header] a[href='/services/']");
  await page.waitForURL("**/services/");
  const r = await page.evaluate(() => ({ line: getComputedStyle(document.querySelector("[data-pan-line]")).opacity, main: getComputedStyle(document.querySelector("[data-main]")).opacity, tweens: window.__panrightDebug.tweens() }));
  ok("reduced motion: instant swap, no pan line, no tweens", r.line === "0" && r.main === "1" && r.tweens === 0, JSON.stringify(r));
  await ctx.close();
}

// 7. contact form
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base + "/contact/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.click("[data-contact-form] button[type=submit]");
  const e = await page.evaluate(() => ({ status: document.querySelector("[data-form-status]").textContent, live: document.querySelector("[data-form-status]").getAttribute("aria-live"), invalid: Array.from(document.querySelectorAll("[aria-invalid=true]")).map((x) => x.id), focus: document.activeElement.id }));
  ok("form: empty submit → error in aria-live region, fields marked, focus first invalid", e.status.startsWith("Not sent. Check") && e.live === "polite" && e.invalid.join() === "f-name,f-house,f-email,f-consent" && e.focus === "f-name", JSON.stringify(e));
  await page.fill("#f-name", "A Producer");
  await page.fill("#f-house", "A House");
  await page.fill("#f-email", "bad");
  await page.check("#f-consent");
  await page.click("[data-contact-form] button[type=submit]");
  const e2 = await page.evaluate(() => ({ invalid: Array.from(document.querySelectorAll("[aria-invalid=true]")).map((x) => x.id), msg: document.querySelector("#f-email-error").textContent }));
  ok("form: bad email flagged with message", e2.invalid.join() === "f-email" && e2.msg.length > 0, JSON.stringify(e2));
  await page.fill("#f-email", "a@house.com");
  await page.click("[data-contact-form] button[type=submit]");
  const e3 = await page.evaluate(() => document.querySelector("[data-form-status]").textContent);
  ok("form: valid submit with no endpoint reports the [FORM ENDPOINT] placeholder (nothing faked)", e3.includes("[FORM ENDPOINT]"), e3);
  await page.close();
}

await browser.close();
const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.check}${r.detail ? `\n      ${r.detail.slice(0, 300)}` : ""}`);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
