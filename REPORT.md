# Panright Studios: build report

## What was built

- **Pages.** Astro 7 static site with GSAP 3.15 and ScrollTrigger: Home, Services, About, Contact, `/privacy/` (heading plus "[PRIVACY POLICY: to be supplied]") and a 404 page in the same system.
- **Page transition.** Uses ClientRouter. The nav, footer and pan line persist. The outgoing `<main>` fades and travels −24px; the incoming page gets R; one 1px line crosses the viewport.
- **Content.** All copy is in `src/content/site.ts`. All 14 placeholders render visibly.
  - `npm run check:placeholders` lists them and exits 1.
  - `npm run build` is gated on that check.
  - `npm run build:preview` produced the delivered `dist/`.
- **Fonts.** Self-hosted, trimmed variable fonts. Only Archivo and Hanken Grotesk are preloaded, both with `font-display: swap` and metric-matched fallbacks. Archivo verified rendering at 1.30× width at `font-stretch: 125%`.
- **Logo.** The wordmark is outlined from Archivo (wdth 125, wght 500) and used as an inline `currentColor` SVG.
- **Icons and share image.** Favicon set (SVG, 32px, 180px apple-touch, 192, 512 and maskable icons, manifest), theme-color `#06090D`, and a 1200×630 OG image rendered from the lockup and tagline.
- **SEO.** Titles and descriptions from the spec, canonicals on `https://[DOMAIN]`, sitemap.xml, robots.txt, Open Graph and Twitter tags, Organization JSON-LD (name and URL only).
- **No third parties.** No analytics, CDNs or external fonts. A postbuild guard fails the build on any external host.
- **Deployment.** `infra/DEPLOY.md` covers S3 with OAC, CloudFront, ACM in us-east-1, DNS, cache rules, the response headers policy, Brotli and invalidation. `scripts/csp.mjs` generates the hash-locked CSP; the site was tested under it with zero console errors. Nothing was deployed.
- **MediaFrame.** The component is built but unused, and is documented in the README.

## Measured results

### Lighthouse 13

Scores are Performance / Accessibility / Best Practices / SEO.

| Page | Mobile | Desktop |
|---|---|---|
| Home | 100 / 100 / 100 / 83 | 100 / 100 / 100 / 83 |
| Services | 98 / 100 / 100 / 83 | 100 / 100 / 100 / 83 |
| About | 100 / 100 / 100 / 83 | 100 / 100 / 100 / 83 |
| Contact | 100 / 100 / 100 / 83 | 100 / 100 / 100 / 83 |
| Privacy | 100 / 100 / 100 / 83 | 100 / 100 / 100 / 83 |
| 404 | 100 / 100 / 100 / 50 | 100 / 100 / 100 / 50 |

- **CLS** is 0.000 everywhere. Mobile LCP is 1.37–1.89s; desktop LCP is 0.17–0.43s.
- **SEO 83** comes only from the `[DOMAIN]` placeholder: the canonical and the robots Sitemap line are not valid URLs.
- **With a test domain** substituted in a scratch copy, Home, About and Contact score SEO 100 on mobile and desktop.
- **404 SEO 50** is expected, because the page is `noindex`.
- **Below 95+:** only the SEO scores miss the target, all because of the placeholder. Every Performance, Accessibility and Best Practices score is 98 or higher.

### axe-core (WCAG 2.0, 2.1 and 2.2 A/AA, plus best-practice)

Zero violations on all six pages, at 1440 and 390 wide, with and without reduced motion (24 runs).

### Behaviour suite: 53 of 53 checks passed (`reports/behaviour.txt`)

- **Keyboard.** The first Tab reaches a visible skip link, which moves focus to `<main>`. Every stop shows the 2px accent ring.
- **Hero during animation.** Content mid-reveal is still reachable by keyboard. This was a bug found in testing: hidden content was skipped by Tab. It is fixed.
- **Mobile menu.** Opens with Enter and moves focus into the panel. Focus is trapped over 12 Tab and Shift+Tab presses, and the page behind is inert. Escape closes it and returns focus to the button. Links navigate and close it.
- **Tap targets.** Every tap target on every page is at least 48px tall at 390 wide.
- **Transitions.**
  - Nav and footer are the same DOM nodes after navigation.
  - The pan line crosses the viewport, then hides; `<main>` ends fully visible.
  - Across a six-step navigation loop, the ScrollTrigger count on every page equals a fresh load (no leaks).
  - `aria-current` follows client-side navigation, with no page errors.
- **Reduced motion.** Nothing is hidden and no tweens run; the hero light sits at its end position; the page swap is instant with no pan line.
- **Form.** The error message is announced through an aria-live region, invalid fields are marked, and focus moves to the first one. A bad email gets its own message. A valid submit with no endpoint says so; nothing is faked.
- **Console.** No errors or warnings on any page, in either motion mode.

### Hero fit (`reports/hero-fit.txt`)

The frame is exactly 2.39:1 at every width tested from 1024 to 2560. The headline is always three lines and inside the frame, and the primary CTA is above the fold at every size tested:

| Viewport | CTA bottom (must be ≤ viewport height) |
|---|---|
| 1366×650 | 626 |
| 1440×780 | 756 |
| 1536×730 | 706 |
| 1280×720 | 696 |
| 1024×768 | 686 |
| 1440×900 | 825 |

Against the spec's fit-check numbers on tall screens (inner height / headline height):

| Width | Measured | page-spec.md |
|---|---|---|
| 1440 | 419 / 299.4 | 421.0 / 299.5 |
| 1280 | 352 / 270.5 | 354.0 / 270.5 |
| 1024 | 244.9 / 224.0 | 246.9 / 224.0 |

The 2px difference is the frame's 1px border on each side.

### Screenshots

All six pages at 1440×900, 1366×650, 1280×720, 1024×768, 768×1024 and 390×844, in three sets: full page, above the fold, and reduced motion. Plus one of the mobile menu open. I reviewed them against usage-rules.md and fixed:

- the frame touching the nav on short screens;
- the narrowed hero leaving a void on the right (it is now centred);
- an unspecified "Home" link in the mobile menu (removed).

## Deviations from the spec

All 31 are logged in DECISIONS.md. The main ones:

1. **D-01, hero open item.** On short viewports the whole hero stage narrows by viewport height; the frame never changes ratio. The headline size is capped so it always fits.
2. **D-03.** Hero content starts at 50% of the frame pan, not after it, so the LCP element paints early.
3. **D-07.** Font-stack variables are redefined in global.css to insert metric fallbacks. tokens.css itself is byte-identical.
4. **D-16 and D-17.**
   - Inputs use a `--color-text-subtle` border to meet the WCAG 3:1 non-text contrast rule; focus goes to `--color-text-muted` plus the focus ring, instead of `--color-border-strong`.
   - Errors use a 2px primary border and text, because there is no red in the eight tokens.
5. **D-05.**
   - On tablet the hero card stacks below the frame.
   - On mobile the inset is vertical only, because the frame has no side lines there.
6. **D-11.** `THE PREMISE` and `THE BELIEF` use mono, treated as scene-slug metadata.
7. **D-14.** New functional microcopy: form field errors, "(optional)", "Choose one", and the 404 copy.
8. **D-19.** The Services header has no label, because the spec gives none.
9. **D-27 and D-28.** The delivered `dist/` comes from the ungated preview build. Canonicals use the literal `[DOMAIN]`.

## Open items

- Resolve the placeholders:
  - `[DOMAIN]`, `[CONTACT EMAIL]`, `[RESPONSE TIME]`, `[LEGAL ENTITY]`, `[YEAR]`
  - `[FORM ENDPOINT]` (needs a backend, because S3 cannot process forms)
  - `[METHOD FACTS]`, `[SERVICE DESCRIPTIONS]`
  - `[FOUNDING STORY]`, `[TEAM]`, `[LOCATION]`, `[FOUNDED]`
  - `[PRIVACY POLICY]` and the privacy policy text
- Brand sign-off on the outlined wordmark, which is outlined in code rather than in Figma, and on the OG image.
- Confirm the twelve service names; the spec flags them for confirmation.
- Confirm D-11 (mono statement labels) and D-01 (centred letterbox on short screens).
- Before go-live: add the form endpoint's origin to the CSP, set up the CloudFront distribution following DEPLOY.md, re-run Lighthouse on the live domain, and then submit to Awwwards.
- Not tested: real Safari and Firefox, and real devices. All testing ran in headless Chromium.
