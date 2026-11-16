/**
 * Panright Studios — client runtime.
 *  - GSAP reveals, hero sequence and the pan page transition (all gated by
 *    gsap.matchMedia("(prefers-reduced-motion: no-preference)")).
 *  - Lifecycle: init on astro:page-load, full revert/kill on astro:before-swap,
 *    so no tween or ScrollTrigger survives a navigation.
 *  - Persisted nav state, mobile menu (focus trap, Escape), contact form.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(ScrollTrigger, CustomEase);
(window as unknown as { __panrightMotion: boolean }).__panrightMotion = true;
// Read-only diagnostics used by scripts/test (counts only; no state is exposed for mutation).
(window as unknown as { __panrightDebug: object }).__panrightDebug = {
  triggers: () => ScrollTrigger.getAll().length,
  tweens: () => gsap.globalTimeline.getChildren(true, true, false).filter((t) => t.isActive()).length,
};

const MOTION = "(prefers-reduced-motion: no-preference)";
const root = document.documentElement;
const motionAllowed = () => window.matchMedia(MOTION).matches;

/* ---------------------------------------------------------------- tokens */
function token(name: string): string {
  return getComputedStyle(root).getPropertyValue(name).trim();
}
function seconds(name: string): number {
  const v = token(name);
  return v.endsWith("ms") ? parseFloat(v) / 1000 : parseFloat(v);
}
function px(name: string): number {
  const v = token(name);
  return v.endsWith("rem") ? parseFloat(v) * parseFloat(getComputedStyle(root).fontSize) : parseFloat(v);
}
function bezier(name: string, fallback: string): string {
  const m = token(name).match(/cubic-bezier\(([^)]+)\)/);
  return m ? m[1].replace(/\s+/g, "") : fallback;
}
CustomEase.create("pr-out", bezier("--ease-out", "0.16,1,0.3,1"));
CustomEase.create("pr-pan", bezier("--ease-pan", "0.33,0,0.15,1"));

function motionTokens() {
  return {
    fast: seconds("--duration-fast"),
    base: seconds("--duration-base"),
    slow: seconds("--duration-slow"),
    pan: seconds("--duration-pan"),
    light: seconds("--duration-light"),
    distance: px("--reveal-distance"),
    stagger: seconds("--reveal-stagger"),
    space7: px("--space-7"),
  };
}

/* ---------------------------------------------------------- page motion */
let mm: gsap.MatchMedia | null = null;
let arrivedByClientNav = false;

function reveal(targets: Element | Element[], t: ReturnType<typeof motionTokens>, trigger?: Element, delay = 0) {
  return gsap.fromTo(
    targets,
    { opacity: 0, x: t.distance },
    {
      opacity: 1,
      x: 0,
      duration: t.slow,
      ease: "pr-out",
      stagger: Array.isArray(targets) ? t.stagger : 0,
      delay,
      clearProps: "transform",
      scrollTrigger: trigger ? { trigger, start: "top 85%", once: true } : undefined,
    },
  );
}

function initMotion() {
  mm = gsap.matchMedia();

  mm.add({ motion: MOTION, desktop: "(min-width: 64rem)" }, (ctx) => {
    const { motion, desktop } = ctx.conditions as { motion: boolean; desktop: boolean };
    if (!motion) {
      root.classList.remove("motion-ok");
      return;
    }
    root.classList.add("motion-ok");
    const t = motionTokens();
    const main = document.querySelector<HTMLElement>("[data-main]");

    // Incoming page: R on <main> after a client-side navigation.
    if (arrivedByClientNav && main) {
      gsap.fromTo(main, { opacity: 0, x: t.distance }, { opacity: 1, x: 0, duration: t.slow, ease: "pr-out", clearProps: "all" });
    }

    // Hero: frame pans right, then content R; light makes one pass and holds.
    const hero = document.querySelector<HTMLElement>("[data-hero]");
    if (hero) {
      const frame = hero.querySelector(desktop ? "[data-hero-frame-desktop]" : "[data-hero-frame-mobile]");
      const items = gsap.utils.toArray<Element>(hero.querySelectorAll("[data-hero-item]"));
      const light = hero.querySelector("[data-hero-light]");
      const tl = gsap.timeline();
      if (frame) tl.fromTo(frame, { opacity: 0, x: -t.space7 }, { opacity: 1, x: 0, duration: t.pan, ease: "pr-pan", clearProps: "transform" });
      // D-07: content starts at 50% of the pan so the headline (LCP) paints early.
      tl.fromTo(items, { opacity: 0, x: t.distance }, { opacity: 1, x: 0, duration: t.slow, ease: "pr-out", stagger: t.stagger, clearProps: "transform" }, t.pan * 0.5);
      if (light) gsap.fromTo(light, { x: 0 }, { x: "40vw", duration: t.light, ease: "none" });
    }

    // Scroll reveals.
    gsap.utils.toArray<Element>("[data-reveal]").forEach((el) => reveal(el, t, el));
    gsap.utils.toArray<Element>("[data-reveal-group]").forEach((group) => {
      reveal(Array.from(group.children).slice(0, 6), t, group);
      // Items beyond the sixth (max 6 per stagger) reveal together with the last one.
      const rest = Array.from(group.children).slice(6);
      if (rest.length) reveal(rest, t, group, t.stagger * 5);
    });

    return () => {
      /* matchMedia reverts every tween and ScrollTrigger created above */
    };
  });
}

function destroyMotion() {
  mm?.revert();
  mm = null;
  ScrollTrigger.getAll().forEach((st) => st.kill());
  gsap.killTweensOf("[data-main]");
}

/* ---------------------------------------------------- pan transition */
let outgoing: gsap.core.Tween | null = null;

document.addEventListener("astro:before-preparation", (event) => {
  closeMenu(false);
  arrivedByClientNav = true;
  if (!motionAllowed()) return;
  const e = event as Event & { loader: () => Promise<void> };
  const main = document.querySelector<HTMLElement>("[data-main]");
  const originalLoader = e.loader;
  e.loader = async () => {
    const t = motionTokens();
    outgoing = main ? gsap.to(main, { autoAlpha: 0, x: -24, duration: t.base, ease: "pr-out" }) : null;
    await Promise.all([originalLoader(), outgoing ? outgoing.then() : Promise.resolve()]);
  };
});

document.addEventListener("astro:before-swap", () => {
  outgoing?.kill();
  outgoing = null;
  destroyMotion();
});

document.addEventListener("astro:after-swap", () => {
  // The swap replaces <html> attributes; restore the motion gate before paint.
  if (motionAllowed()) {
    root.classList.add("motion-ok");
    const main = document.querySelector<HTMLElement>("[data-main]");
    if (main) gsap.set(main, { opacity: 0 }); // incoming R starts from hidden (no flash)
  }
  updateCurrent();
});

function panLine() {
  const line = document.querySelector<HTMLElement>("[data-pan-line]");
  if (!line || !motionAllowed()) return;
  const t = motionTokens();
  gsap.killTweensOf(line);
  gsap.fromTo(
    line,
    { x: 0, autoAlpha: 1 },
    { x: () => window.innerWidth, duration: t.pan, ease: "pr-pan", onComplete: () => gsap.set(line, { autoAlpha: 0 }) },
  );
}

/* Keyboard users must never focus something still invisible: finish any
   reveal on the focused element (and its revealing ancestors) immediately. */
const REVEALED = "[data-reveal], [data-reveal-group] > *, [data-hero-item], [data-hero-frame-desktop], [data-hero-frame-mobile], [data-main]";
document.addEventListener("focusin", (e) => {
  let el = (e.target as HTMLElement).closest<HTMLElement>(REVEALED);
  while (el) {
    if (parseFloat(getComputedStyle(el).opacity) < 1) {
      gsap.killTweensOf(el);
      gsap.set(el, { opacity: 1, x: 0, clearProps: "transform" });
    }
    el = el.parentElement?.closest<HTMLElement>(REVEALED) ?? null;
  }
});

/* ---------------------------------------------------------- nav state */
function updateCurrent() {
  const path = location.pathname.endsWith("/") ? location.pathname : `${location.pathname}/`;
  document.querySelectorAll<HTMLAnchorElement>("[data-site-header] [data-nav-link]").forEach((a) => {
    const href = a.getAttribute("href") ?? "";
    if (href !== import.meta.env.BASE_URL && href !== "/" && path.startsWith(href)) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

/* --------------------------------------------------------- mobile menu */
let menuOpen = false;
const focusableSel = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function menuEls() {
  return {
    header: document.querySelector<HTMLElement>("[data-site-header]"),
    toggle: document.querySelector<HTMLButtonElement>("[data-menu-toggle]"),
    label: document.querySelector<HTMLElement>("[data-menu-label]"),
    panel: document.querySelector<HTMLElement>("[data-menu-panel]"),
  };
}

function setInert(on: boolean) {
  document.querySelectorAll<HTMLElement>("[data-main], [data-site-footer], .skip-link").forEach((el) => {
    if (on) el.setAttribute("inert", "");
    else el.removeAttribute("inert");
  });
}

function openMenu() {
  const { toggle, label, panel } = menuEls();
  if (!toggle || !panel) return;
  menuOpen = true;
  panel.hidden = false;
  toggle.setAttribute("aria-expanded", "true");
  if (label) label.textContent = "Close";
  document.body.style.overflow = "hidden";
  setInert(true);
  panel.querySelector<HTMLElement>("a")?.focus();
}

function closeMenu(returnFocus = true) {
  const { toggle, label, panel } = menuEls();
  if (!menuOpen || !toggle || !panel) return;
  menuOpen = false;
  panel.hidden = true;
  toggle.setAttribute("aria-expanded", "false");
  if (label) label.textContent = "Menu";
  document.body.style.overflow = "";
  setInert(false);
  if (returnFocus) toggle.focus();
}

document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  if (target.closest("[data-menu-toggle]")) {
    menuOpen ? closeMenu() : openMenu();
  }
});

document.addEventListener("keydown", (e) => {
  if (!menuOpen) return;
  if (e.key === "Escape") {
    e.preventDefault();
    closeMenu();
    return;
  }
  if (e.key === "Tab") {
    const { header } = menuEls();
    if (!header) return;
    const items = Array.from(header.querySelectorAll<HTMLElement>(focusableSel)).filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

window.matchMedia("(min-width: 40rem)").addEventListener("change", (mq) => {
  if (mq.matches) closeMenu(false);
});

/* --------------------------------------------------------- contact form */
function initForm() {
  const form = document.querySelector<HTMLFormElement>("[data-contact-form]");
  if (!form) return;
  const status = form.querySelector<HTMLElement>("[data-form-status]");
  const submit = form.querySelector<HTMLButtonElement>("button[type=submit]");
  const msg = (key: string) => form.dataset[key] ?? "";

  const fieldError = (field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): string => {
    if (field.type === "checkbox") return (field as HTMLInputElement).checked || !field.required ? "" : msg("errConsent");
    const value = field.value.trim();
    if (field.required && !value) return msg("errRequired");
    if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return msg("errEmail");
    return "";
  };

  const show = (field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, text: string) => {
    const box = form.querySelector<HTMLElement>(`#${field.id}-error`);
    if (box) box.textContent = text;
    if (text) field.setAttribute("aria-invalid", "true");
    else field.removeAttribute("aria-invalid");
  };

  const fields = Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea")).filter((f) => f.name && f.type !== "hidden");
  fields.forEach((f) => {
    // Clear an error as soon as the field becomes valid while typing. No blur
    // validation: a layout change on blur would move the submit button under the pointer.
    const recheck = () => { if (f.getAttribute("aria-invalid") && !fieldError(f)) show(f, ""); };
    f.addEventListener("input", recheck);
    f.addEventListener("change", recheck);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (status) status.textContent = "";
    let firstBad: HTMLElement | null = null;
    fields.forEach((f) => {
      const err = fieldError(f);
      show(f, err);
      if (err && !firstBad) firstBad = f;
    });
    if (firstBad) {
      if (status) status.textContent = msg("error");
      (firstBad as HTMLElement).focus();
      return;
    }
    const endpoint = form.getAttribute("action") ?? "";
    if (!endpoint || /\[[A-Z]/.test(endpoint)) {
      if (status) status.textContent = msg("endpointMissing");
      return;
    }
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

/* ---------------------------------------------------------- lifecycle */
document.addEventListener("astro:page-load", () => {
  updateCurrent();
  initMotion();
  initForm();
  if (arrivedByClientNav) {
    panLine();
    document.querySelector<HTMLElement>("[data-main]")?.focus({ preventScroll: true });
  }
});
