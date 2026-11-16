# Panright Studios: Page Spec

## Global

**Conventions.** All names are `tokens.css` tokens. Text is left-aligned. Sections use `--section-y`. Raised card: `--color-raised`, `--border-hair`, `--radius-2`.
- **R** (reveal): opacity 0→1, translateX(`--reveal-distance`→0), `--duration-slow`, `--ease-out`, stagger `--reveal-stagger`, once, at "top 85%".
- **H** (hover): colour and border only, `--duration-fast`, `--ease-out`.
- **Accent button H:** label underline draws left to right, `--duration-base`; fill unchanged.

**Nav `<Nav>`.** Sticky, 64px, `.glass-nav`. Left: primary lockup (logo A-c). Right: Services, About, Contact in `--font-body`, `--text-small`, `--weight-strong`, `--color-text-muted`. Current page: `--color-text-primary` with a 1px underline. Hover: underline draws left to right, `--duration-base`.

**Footer `<Footer>`.** `--color-surface`. Cols 1–5: primary lockup (logo A-c) and "Know the film before the shoot." Cols 7–9: page links. Cols 10–12: [CONTACT EMAIL]. Base row: © [YEAR] [LEGAL ENTITY] · Privacy in `--font-body`, `--text-small`, `--color-text-muted`; only `END OF REEL` is a mono label.

**Page transition `<PanTransition>`.** Astro `ClientRouter`; nav and footer persist. Outgoing `<main>`: opacity 1→0, translateX(0→-24px), `--duration-base`. Incoming: R. One 1px `--color-border-strong` vertical line crosses the viewport left to right, `--duration-pan`, `--ease-pan`. Reduced motion: instant swap.

**Mobile (<640px).** Four columns, single-column stacks. Nav shows logo and a "Menu" label (nav link style) opening a solid `--color-bg` panel (no glass), links at `--text-h2`. Hover becomes `:active`. Tap targets 48px minimum.

**SEO.**

| Page | Title | Description |
|---|---|---|
| Home | Panright Studios: Know the film before the shoot | A filmmaking suite for production houses. Validate your film on the page, then carry it through prep, shoot and edit. |
| Services | Services: Panright Studios | Four phases for one film: validate, prepare, capture, finish. From script selection to the edit. |
| About | About: Panright Studios | Named for the camera move. Built for filmmakers, not replacing them. Validation before the shoot, not after the audience reacts. |
| Contact | Contact: Panright Studios | Production houses: tell us what is on your slate and start a conversation before your next shoot. |

## Home

### 1. Hero `<Hero>` + `<HeroBackdrop>`
- **Purpose:** State the promise in one frame, with no imagery.
- **Layout (≥1024px):** `min-height: 100svh`, `--color-bg`, 64px top padding for the nav. The group (frame, then lead and buttons) is centred vertically. Backdrop, bottom to top:
  1. Light: one radial-gradient ellipse, 60vw × 50vh, `rgb(167 179 192 / 0.10)` to transparent, centred at 20% / 50%.
  2. Grain: `--glass-noise`, tiled, full bleed.
  3. Frame: outline, 1px `--color-border-strong`, 12 columns wide, `aspect-ratio: 2.39`, `height: auto`, no `min-height`. Only the headline sits inside it.
- **Frame contents (≥1024px):**
  - Corner labels: mono, `--color-text-subtle`, `--space-3` from each corner. Top-left `SC 01 / TK 01`, top-right `2.39 : 1`, bottom-left `00:00:00:00`. `PANRIGHT STUDIOS` sits on the bottom line, right-aligned to col 8.
  - Headline: `--space-7` inset, cols 1–11, three lines maximum, aligned to the bottom inset.
  - Lead and buttons: below the frame, cols 1–6. Frame to lead `--space-5`; lead to buttons `--stack-heading`.
  - Glass card: cols 9–12. Its top edge sits `--space-5` above the frame's bottom line, so the card straddles it. It is a sibling of the frame, never inside it, so it cannot change the frame's height.
- **Fit check (worst case, three lines):** inner height against headline height is 421.0 / 299.5 at 1440, 354.0 / 270.5 at 1280 and 246.9 / 224.0 at 1024. Inner height grows 0.42px per px of viewport width and the headline 0.18px, so the headline fits at every width from 1024 to 1440; above 1440 both are capped. Total hero height (nav, frame, lead, buttons, gaps) is 750 at 1440×900, 714 at 1280×720 and 604 at 1024×768; on shorter screens the hero grows and the frame does not. **Open item, verify in the build:** at usable viewport heights under about 750px (typical laptop browsers) the lead and buttons sit below the fold.
- **Layout (<1024px):** headline, lead and buttons stay inside the frame with `--space-7` inset and `min-height: fit-content`, so the frame grows past 2.39:1 and the `2.39 : 1` label is hidden. On mobile the frame keeps only its top and bottom lines and the card stacks below.
- **Copy:** Headline (display): "Know the film before the shoot." Lead: "Validate your film on the page, not after the audience reacts." Button (accent): "Start a conversation". Link: "See the four phases". Card label: `BEFORE DAY ONE`. Card text: "The script is tested. Then the money moves."
- **Card text:** label `BEFORE DAY ONE` in `--font-label`, `--text-label`, uppercase, `--tracking-label`, `--color-text-muted`. Body in `--font-body`, `--text-body`, `--color-text-primary`. No accent in the card.
- **Card contrast** (fill at 56% over `--color-bg`, hero light at its 10% peak, both grain layers at about 3%): muted 7.30–7.92, primary 12.73–13.82. Even at 9% grain muted holds 5.6. Subtle would be 4.22 and fail AA, which is why rule 10 bars it. The fallback fill is darker, so equal or better.
- **Motion:** On load the frame pans right: translateX(-`--space-7`→0), opacity 0→1, `--duration-pan`, `--ease-pan`. Then content R. Light makes one pass, translateX(0→40vw), linear, `--duration-light`, then holds. No loop. Reduced motion: light starts at its end position.
- **Glass:** `.glass-card`, this one card only.

### 2. Premise `<Statement>`
- **Purpose:** Carry the core message.
- **Layout:** Label cols 1–3, text cols 4–11. `--color-bg`.
- **Copy:** Label: `THE PREMISE`. Headline (h2): "A hard note on the script costs less than a hard verdict on opening night." Copy: "A film usually meets its hardest questions in front of an audience. By then the budget is spent and the cut is locked. Panright moves that moment to the page."
- **Motion:** R.
- **Glass:** None.

### 3. Method `<Method>`
- **Purpose:** Say what Panright does, in facts only.
- **Layout:** Header cols 1–4; four hairline-separated rows cols 6–12, each a mono index and one sentence.
- **Copy:** Headline (h2): "How the film is tested." Rows: "Scripts are selected and filtered." / "The idea is validated before money reaches the shoot." / "Support continues through prep, shoot and post." / "The edit is AI-assisted. Your editor keeps final cut." [METHOD FACTS]
- **Motion:** R, rows staggered. Row H: border to `--color-border-strong`.
- **Glass:** None.

### 4. Phases `<PhaseGrid>`
- **Purpose:** Show four equal phases; route to Services.
- **Layout:** `--color-surface`. Four raised cards, three columns each; tablet 2 × 2.
- **Copy:** Headline (h2): "Four phases. One film." Cards: `01` Validate, "Know what the script is before it costs anything." `02` Prepare, "Walk onto set with the plan already questioned." `03` Capture, "Keep the shoot close to the film you approved." `04` Finish, "The edit, assisted. The cut, yours." Link: "All services".
- **Motion:** R, staggered. Card H.
- **Glass:** None.

### 5. Principle `<Statement>`
- **Purpose:** State the ethic.
- **Layout:** Text cols 3–10, `--space-9` above and below.
- **Copy:** Headline (h2): "Built for filmmakers, not replacing them." Copy: "Panright does the reading, the checking and the paperwork. The people who make films make every decision that matters."
- **Motion:** R.
- **Glass:** None.

### 6. CTA `<CtaBand>`
- **Purpose:** One next step. Reused on Services, About.
- **Layout:** Headline cols 1–8, button cols 10–12, baseline-aligned. Top hairline.
- **Copy:** Headline (h2): "Bring the script before the schedule." Button: "Start a conversation".
- **Motion:** R.
- **Glass:** None.

## Services

### 1. Header `<PageHeader>`
- **Purpose:** Frame the suite as one sequence.
- **Layout:** Label and h1 cols 1–9; lead cols 1–6. `--space-9` top. Below: mono anchor row `01 VALIDATE / 02 PREPARE / 03 CAPTURE / 04 FINISH`.
- **Copy:** Headline: "Four phases. One film." Lead: "Panright follows one film from the first read to the final cut. Each phase hands the next a plan that has already been questioned."
- **Motion:** R. Anchor H: underline draw.
- **Glass:** None.

### 2–5. Phase sections `<PhaseSection>` × 4
- **Purpose:** One phase each, in production order.
- **Layout:** Index and phase name cols 1–4; headline, copy and three hairline rows of services cols 6–12. Alternate `--color-bg` and `--color-surface`.
- **Copy:**
  - Headlines repeat Home section 4.
  - `01` Validate. "Scripts are selected and filtered. The idea is tested on the page, before a penny goes to the shoot." Services: Script Shortlist, Idea Validation, Flaw Report.
  - `02` Prepare. "Pre-production support for the film that passed validation." Services: Script Breakdown, Budget and Schedule, Shoot Readiness Check.
  - `03` Capture. "On-set support through every shoot day." Services: Daily Shoot Tracking, Continuity Log, Dailies Review.
  - `04` Finish. "Post-production support through the edit. Final cut stays with your editor." Services: AI-Assisted Assembly, Edit Notes, Cut Validation.
  - Each service row takes one line: [SERVICE DESCRIPTIONS].
- **Motion:** R per section. Row H.
- **Glass:** None.

### 6. `<CtaBand>`

## About

### 1. Header `<PageHeader>`
- **Purpose:** Explain the name.
- **Layout:** h1 cols 1–9, lead cols 1–6.
- **Copy:** Headline: "Named for a camera move." Lead: "A pan to the right shows what the frame was hiding. Panright does the same for a film, before the shoot."
- **Motion:** R.
- **Glass:** None.

### 2. Belief `<Statement>`
- **Purpose:** State who it is for.
- **Layout:** Label cols 1–3, text cols 4–11.
- **Copy:** Label: `THE BELIEF`. Headline (h2): "A film should be validated before the shoot." Copy: "Not after the audience reacts. We build for the people who carry that risk: production houses first, then independent filmmakers, studios and OTT teams."
- **Motion:** R.
- **Glass:** None.

### 3. Principles `<PrincipleGrid>`
- **Purpose:** Three working rules.
- **Layout:** `--color-surface`. Three raised cards, four columns each.
- **Copy:** "Filmmakers decide." "Panright informs the call. It never makes it." / "The page comes first." "Problems are cheapest where they are written." / "Tools stay quiet." "AI assists the edit. It takes no credit."
- **Motion:** R, staggered. Card H.
- **Glass:** None.

### 4. Company `<CompanyNote>`
- **Purpose:** Honest status and people.
- **Layout:** Text cols 1–6; mono fact rows cols 8–12.
- **Copy:** "Panright Studios is pre-launch." [FOUNDING STORY] Rows: [TEAM], [LOCATION], [FOUNDED].
- **Motion:** R.
- **Glass:** None.

### 5. `<CtaBand>`

## Contact

### 1. Enquiry `<ContactIntro>` + `<ContactForm>`
- **Purpose:** One short enquiry from a production house.
- **Layout:** Intro cols 1–5; form on a raised card cols 7–12, `--space-5` padding, fields `--space-4` apart, labels above in `--font-body`, `--text-small`, `--weight-strong`, `--color-text-muted`.
- **Copy:** Headline (h1): "Start with one conversation." Lead: "Tell us what is on your slate. We reply by email within [RESPONSE TIME]." Below: [CONTACT EMAIL].
  - Name (required).
  - Production house (required).
  - Work email (required). "We reply here. Nothing else is sent."
  - Your role (select): Producer, Head of production, Director, Editor, Other.
  - Where is the film now (select): Script, Pre-production, Shooting, Post-production.
  - Message (optional, 600 characters). Placeholder: "What do you want to know before the shoot?"
  - Note: "Please do not send a script yet."
  - Consent (required): "I agree to be contacted about this enquiry." Link: [PRIVACY POLICY].
  - Button (accent): "Send enquiry". Success: "Received. We will reply by email." Error: "Not sent. Check the marked fields and try again."
- **Motion:** R. Field focus: border to `--color-border-strong`, `--duration-instant`, plus `--focus-ring`.
- **Glass:** None.

## Placeholders to replace before launch

- [METHOD FACTS]: the confirmed 3–4 lines describing the method.
- [SERVICE DESCRIPTIONS] and all twelve service names.
- [CONTACT EMAIL], [RESPONSE TIME], form endpoint (S3 cannot process forms).
- [LEGAL ENTITY], [YEAR], [PRIVACY POLICY] page.
- [FOUNDING STORY], [TEAM], [LOCATION], [FOUNDED].
- Logo outlined in Figma (A-c lockup, C-1 favicon) and social share image.
- Domain and canonical URLs.
