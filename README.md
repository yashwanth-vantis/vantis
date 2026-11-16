# Panright Studios: website

Astro (static) + GSAP/ScrollTrigger. Four pages (Home, Services, About, Contact), plus Privacy and a 404 page. Built from `brand/` (tokens.css, usage-rules.md, page-spec.md, brand core, logos). Every deviation from those files is logged in `DECISIONS.md`.

## Commands

| Command | What it does |
|---|---|
| `npm ci` | Install (Node 20+; tested on Node 22) |
| `npm run dev` | Dev server at http://localhost:4321 |
| `npm run check:placeholders` | Lists every unresolved `[PLACEHOLDER]`; exits 1 if any remain |
| `npm run build` | **Production build.** Runs the placeholder check first and fails while any placeholder remains. Then builds to `dist/` and runs a guard that fails on any external host reference |
| `npm run build:preview` | Same build without the placeholder gate (for review only) |
| `npm run preview` | Serves `dist/` at http://localhost:4321 |
| `npm test` | Hero fit + behaviour/accessibility suite against a running preview (needs Playwright: `npx playwright install chromium`) |
| `npm run fonts` | Rebuilds trimmed fonts, metric fallbacks and the outlined wordmark (Python: `pip install fonttools brotli uharfbuzz`) |
| `npm run assets` | Regenerates favicons, the manifest and the 1200×630 OG image into `public/` |
| `node scripts/csp.mjs` | Prints the Content-Security-Policy (with script hashes) for the current `dist/` |

Deployment (S3 + CloudFront + OAC): see `infra/DEPLOY.md`. Nothing has been deployed.

### Test deploy: GitHub Pages

`.github/workflows/deploy-pages.yml` builds and publishes on every push to `main`.

- The site appears at `https://yashwanth-vantis.github.io/vantis/`.
- The workflow sets `BASE_PATH` to the repository name automatically.
- The test build keeps the placeholders and is marked `noindex`.
- One-time setup: in the repository, go to Settings → Pages → Build and deployment and set Source to **GitHub Actions**.

To build the sub-path version locally, run `BASE_PATH=/vantis/ npm run build:preview`.

## Where things live

```
src/content/site.ts        ALL copy, SEO and placeholders (the only file to edit for content)
src/styles/tokens.css      design tokens (verbatim from brand/, do not edit)
src/styles/global.css      base, grid, type, buttons, cards; font-stack overrides (D-07)
src/styles/fonts.css       self-hosted @font-face (hashed by Vite)
src/assets/fonts/          trimmed woff2 (Archivo var, Hanken Grotesk var, Plex Mono 400/500)
src/components/            Nav, Footer, Logo, Hero, Statement, Method, PhaseGrid, CtaBand,
                           PageHeader, PhaseSection, PrincipleGrid, CompanyNote, ContactForm, MediaFrame
src/scripts/app.ts         GSAP motion, pan transition, lifecycle cleanup, menu, form
src/layouts/Base.astro     head/SEO/JSON-LD, ClientRouter, persisted nav/footer/pan line
public/                    favicon set, manifest, og.png (generated)
scripts/                   placeholder check, postbuild guard, asset/font generators, CSP, tests
reports/                   Lighthouse JSON/HTML, behaviour and hero-fit results
screenshots/               full/, fold/, reduced-motion/ at 6 viewports
infra/DEPLOY.md            AWS deployment runbook
```

## Before launch

1. Fill every placeholder in `src/content/site.ts` (`npm run check:placeholders` lists them), including `formEndpoint`.
2. Get brand sign-off on the outlined wordmark (`src/components/logo-paths.generated.ts`, D-10).
3. Add the privacy policy text to `src/pages/privacy.astro` via `site.ts`.
4. Run `npm run build`, then follow `infra/DEPLOY.md`.

## Adding stills later: `<MediaFrame>`

`src/components/MediaFrame.astro` is built but **not used at launch**, and no imagery is included.

- 2.39:1, zero radius. On hover the image pans left by `--hover-pan` over `--duration-pan` / `--ease-pan`. It is static under reduced motion (tokens set `--hover-pan: 0%`).
- Usage:
  ```astro
  ---
  import MediaFrame from "../components/MediaFrame.astro";
  import still from "../assets/stills/sc12.jpg";
  ---
  <MediaFrame src={still.src} width={still.width} height={still.height} alt="Describe the shot" caption="SC 12 / TK 03" />
  ```
- Rules (usage-rules.md): grade stills to `#59626B` or darker if glass ever sits over them, and use `--color-scrim` when brighter. Captions are mono slate data only. No stock imagery.
- Only add MediaFrame where page-spec.md places media. It currently places none.

## Motion

Every tween runs inside `gsap.matchMedia("(prefers-reduced-motion: no-preference)")`. On `astro:before-swap` the matchMedia context is reverted and all ScrollTriggers are killed. On `astro:page-load` everything is rebuilt. `npm test` verifies there are no leaks.
