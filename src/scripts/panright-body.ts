/**
 * Panright — client runtime for the body sections and inner pages (everything inside .prb).
 *  - Scroll reveals (R): opacity + horizontal travel, gated by
 *    gsap.matchMedia("(prefers-reduced-motion: no-preference)"), values read from tokens.
 *  - Contact form validation (aria-live status, aria-invalid, focus first invalid).
 *  - Lifecycle: init on astro:page-load, revert + kill on astro:before-swap.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
const token = (n: string) => getComputedStyle(root).getPropertyValue(n).trim();
const seconds = (n: string) => { const v = token(n); return v.endsWith("ms") ? parseFloat(v) / 1000 : parseFloat(v); };
const pixels = (n: string) => { const v = token(n); return v.endsWith("rem") ? parseFloat(v) * parseFloat(getComputedStyle(root).fontSize) : parseFloat(v); };
const bezier = (n: string): ((t: number) => number) => {
  const m = token(n).match(/cubic-bezier\(([^)]+)\)/);
  if (!m) return (t) => t;
  const [x1, y1, x2, y2] = m[1].split(",").map(Number);
  const at = (a: number, b: number, s: number) => 3 * (1 - s) * (1 - s) * s * a + 3 * (1 - s) * s * s * b + s * s * s;
  return (t) => {
    if (t <= 0 || t >= 1) return t;
    let lo = 0, hi = 1, s = t;
    for (let i = 0; i < 24; i++) { const x = at(x1, x2, s); if (Math.abs(x - t) < 1e-6) break; if (x < t) lo = s; else hi = s; s = (lo + hi) / 2; }
    return at(y1, y2, s);
  };
};

let mm: gsap.MatchMedia | null = null;

function initReveals() {
  const wrappers = Array.from(document.querySelectorAll<HTMLElement>(".prb"));
  if (!wrappers.length) return;
  mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const t = { duration: seconds("--duration-slow"), ease: bezier("--ease-out"), stagger: seconds("--reveal-stagger"), x: pixels("--reveal-distance") };
    const holdsFocus = (el: Element) => el.contains(document.activeElement);
    const reveal = (targets: Element[], trigger: Element) => {
      const list = targets.filter((el) => !holdsFocus(el));
      if (!list.length) return;
      gsap.set(list, { opacity: 0, x: t.x });
      gsap.to(list, {
        opacity: 1, x: 0, duration: t.duration, ease: t.ease, stagger: t.stagger, clearProps: "transform",
        scrollTrigger: { trigger, start: "top 85%", once: true },
      });
    };
    wrappers.forEach((w) => {
      w.querySelectorAll("[data-reveal]").forEach((el) => reveal([el], el));
      w.querySelectorAll("[data-reveal-group]").forEach((g) => reveal(Array.from(g.children).slice(0, 6), g));
      w.classList.add("prb-ready"); // GSAP owns the hidden state now
    });
  });
  // Reduced motion: nothing is hidden.
  mm.add("(prefers-reduced-motion: reduce)", () => { wrappers.forEach((w) => w.classList.add("prb-ready")); });
}

// Keyboard focus never lands on something still invisible.
document.addEventListener("focusin", (e) => {
  let el = (e.target as HTMLElement).closest<HTMLElement>(".prb [data-reveal], .prb [data-reveal-group] > *");
  while (el) {
    if (parseFloat(getComputedStyle(el).opacity) < 1) { gsap.killTweensOf(el); gsap.set(el, { opacity: 1, x: 0, clearProps: "transform" }); }
    el = el.parentElement?.closest<HTMLElement>(".prb [data-reveal], .prb [data-reveal-group] > *") ?? null;
  }
});

function initForm() {
  const form = document.querySelector<HTMLFormElement>("[data-contact-form]");
  if (!form || form.dataset.ready === "1") return;
  form.dataset.ready = "1";
  const status = form.querySelector<HTMLElement>("[data-form-status]");
  const submit = form.querySelector<HTMLButtonElement>("button[type=submit]");
  const msg = (k: string) => form.dataset[k] ?? "";
  type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  const fieldError = (f: Field): string => {
    if (f.type === "checkbox") return (f as HTMLInputElement).checked || !f.required ? "" : msg("errConsent");
    const v = f.value.trim();
    if (f.required && !v) return msg("errRequired");
    if (f.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return msg("errEmail");
    return "";
  };
  const show = (f: Field, text: string) => {
    const box = form.querySelector<HTMLElement>(`#${f.id}-error`);
    if (box) box.textContent = text;
    if (text) f.setAttribute("aria-invalid", "true"); else f.removeAttribute("aria-invalid");
  };
  const fields = Array.from(form.querySelectorAll<Field>("input, select, textarea")).filter((f) => f.name);
  fields.forEach((f) => {
    const recheck = () => { if (f.getAttribute("aria-invalid") && !fieldError(f)) show(f, ""); };
    f.addEventListener("input", recheck);
    f.addEventListener("change", recheck);
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (status) status.textContent = "";
    let first: Field | null = null;
    for (const f of fields) { const err = fieldError(f); show(f, err); if (err && !first) first = f; }
    if (first) { if (status) status.textContent = msg("error"); (first as Field).focus(); return; }
    const endpoint = form.getAttribute("action") ?? "";
    if (!endpoint || /\[[A-Z]/.test(endpoint)) { if (status) status.textContent = msg("endpointMissing"); return; }
    submit?.setAttribute("aria-disabled", "true");
    try {
      const res = await fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      if (status) status.textContent = msg("success");
    } catch {
      if (status) status.textContent = msg("error");
    } finally {
      submit?.removeAttribute("aria-disabled");
    }
  });
}

document.addEventListener("astro:page-load", () => { initReveals(); initForm(); });
document.addEventListener("astro:before-swap", () => {
  mm?.revert();
  mm = null;
  ScrollTrigger.getAll().forEach((st) => st.kill());
});
