/**
 * Panright Studios — shared site constants.
 */

/**
 * Hero background video (H.264 MP4, no audio track), hosted on GitHub Pages.
 * The ONLY place this URL appears. Set to "" to run the hero without video.
 * Source file: vantis/public/panright-hero.mp4 → published by the vantis repo's Pages workflow.
 */
export const heroVideoUrl = "https://yashwanth-vantis.github.io/vantis/panright-hero.mp4";

/* ------------------------------------------------------------------
 * Site copy for the remaining sections and pages (page-spec.md).
 * Anything in [SQUARE BRACKETS] is an unresolved placeholder and renders visibly.
 * ------------------------------------------------------------------ */

export const site = {
  name: "Panright Studios",
  origin: "https://[DOMAIN]",
  tagline: "Know the film before the shoot.",
  contactEmail: "[CONTACT EMAIL]",
  responseTime: "[RESPONSE TIME]",
  legalEntity: "[LEGAL ENTITY]",
  year: "[YEAR]",
  /** S3 cannot process forms. Set to an HTTPS endpoint that accepts POST. */
  formEndpoint: "[FORM ENDPOINT]",
  themeColor: "#06090D",
} as const;

export const nav = [
  { href: "/services/", label: "Services" },
  { href: "/about/", label: "About" },
  { href: "/contact/", label: "Contact" },
] as const;

export const footer = {
  tagline: "Know the film before the shoot.",
  privacyLabel: "Privacy",
  endLabel: "END OF REEL",
} as const;

export const seo = {
  home: {
    title: "Panright Studios: Know the film before the shoot",
    description:
      "A filmmaking suite for production houses. Validate your film on the page, then carry it through prep, shoot and edit.",
  },
  services: {
    title: "Services: Panright Studios",
    description:
      "Four phases for one film: validate, prepare, capture, finish. From script selection to the edit.",
  },
  about: {
    title: "About: Panright Studios",
    description:
      "Named for the camera move. Built for filmmakers, not replacing them. Validation before the shoot, not after the audience reacts.",
  },
  contact: {
    title: "Contact: Panright Studios",
    description:
      "Production houses: tell us what is on your slate and start a conversation before your next shoot.",
  },
  privacy: {
    title: "Privacy: Panright Studios",
    description: "Privacy policy for Panright Studios.",
  },
  notFound: {
    title: "Page not found: Panright Studios",
    description: "This page is not part of the Panright Studios site.",
  },
} as const;

export const cta = {
  primary: { label: "Start a conversation", href: "/contact/" },
} as const;

/* ------------------------------------------------------------------ HOME */
export const home = {
  hero: {
    headline: "Know the film before the shoot.",
    lead: "Validate your film on the page, not after the audience reacts.",
    primary: { label: "Start a conversation", href: "/contact/" },
    secondary: { label: "See the four phases", href: "/services/" },
    slate: { scene: "SC 01 / TK 01", ratio: "2.39 : 1", timecode: "00:00:00:00", studio: "PANRIGHT STUDIOS" },
    card: { label: "BEFORE DAY ONE", text: "The script is tested. Then the money moves." },
  },
  premise: {
    label: "THE PREMISE",
    headline: "A hard note on the script costs less than a hard verdict on opening night.",
    copy: "A film usually meets its hardest questions in front of an audience. By then the budget is spent and the cut is locked. Panright moves that moment to the page.",
  },
  method: {
    headline: "How the film is tested.",
    rows: [
      "Scripts are selected and filtered.",
      "The idea is validated before money reaches the shoot.",
      "Support continues through prep, shoot and post.",
      "The edit is AI-assisted. Your editor keeps final cut.",
    ],
    note: "[METHOD FACTS]",
  },
  phases: {
    headline: "Four phases. One film.",
    link: { label: "All services", href: "/services/" },
  },
  principle: {
    headline: "Built for filmmakers, not replacing them.",
    copy: "Panright does the reading, the checking and the paperwork. The people who make films make every decision that matters.",
  },
  ctaBand: { headline: "Bring the script before the schedule.", button: "Start a conversation" },
} as const;

/* -------------------------------------------------------------- PHASES */
export const phases = [
  {
    index: "01",
    id: "validate",
    name: "Validate",
    line: "Know what the script is before it costs anything.",
    copy: "Scripts are selected and filtered. The idea is tested on the page, before a penny goes to the shoot.",
    services: ["Script Shortlist", "Idea Validation", "Flaw Report"],
  },
  {
    index: "02",
    id: "prepare",
    name: "Prepare",
    line: "Walk onto set with the plan already questioned.",
    copy: "Pre-production support for the film that passed validation.",
    services: ["Script Breakdown", "Budget and Schedule", "Shoot Readiness Check"],
  },
  {
    index: "03",
    id: "capture",
    name: "Capture",
    line: "Keep the shoot close to the film you approved.",
    copy: "On-set support through every shoot day.",
    services: ["Daily Shoot Tracking", "Continuity Log", "Dailies Review"],
  },
  {
    index: "04",
    id: "finish",
    name: "Finish",
    line: "The edit, assisted. The cut, yours.",
    copy: "Post-production support through the edit. Final cut stays with your editor.",
    services: ["AI-Assisted Assembly", "Edit Notes", "Cut Validation"],
  },
] as const;

/** One line per service row. Replace with confirmed copy before launch. */
export const serviceDescriptionPlaceholder = "[SERVICE DESCRIPTIONS]";

/* ------------------------------------------------------------ SERVICES */
export const services = {
  header: {
    headline: "Four phases. One film.",
    lead: "Panright follows one film from the first read to the final cut. Each phase hands the next a plan that has already been questioned.",
  },
} as const;

/* --------------------------------------------------------------- ABOUT */
export const about = {
  header: {
    headline: "Named for a camera move.",
    lead: "A pan to the right shows what the frame was hiding. Panright does the same for a film, before the shoot.",
  },
  belief: {
    label: "THE BELIEF",
    headline: "A film should be validated before the shoot.",
    copy: "Not after the audience reacts. We build for the people who carry that risk: production houses first, then independent filmmakers, studios and OTT teams.",
  },
  principles: [
    { title: "Filmmakers decide.", text: "Panright informs the call. It never makes it." },
    { title: "The page comes first.", text: "Problems are cheapest where they are written." },
    { title: "Tools stay quiet.", text: "AI assists the edit. It takes no credit." },
  ],
  principlesHeading: "Working rules", // visually hidden: keeps heading order (see DECISIONS.md)
  company: {
    heading: "Company", // visually hidden
    status: "Panright Studios is pre-launch.",
    story: "[FOUNDING STORY]",
    rows: [
      { label: "TEAM", value: "[TEAM]" },
      { label: "LOCATION", value: "[LOCATION]" },
      { label: "FOUNDED", value: "[FOUNDED]" },
    ],
  },
} as const;

/* ------------------------------------------------------------- CONTACT */
export const contact = {
  headline: "Start with one conversation.",
  lead: `Tell us what is on your slate. We reply by email within ${site.responseTime}.`,
  email: site.contactEmail,
  form: {
    name: "Name",
    house: "Production house",
    email: "Work email",
    emailHint: "We reply here. Nothing else is sent.",
    role: { label: "Your role", options: ["Producer", "Head of production", "Director", "Editor", "Other"] },
    stage: { label: "Where is the film now", options: ["Script", "Pre-production", "Shooting", "Post-production"] },
    message: { label: "Message", placeholder: "What do you want to know before the shoot?", max: 600 },
    note: "Please do not send a script yet.",
    consent: "I agree to be contacted about this enquiry.",
    privacyLink: { label: "[PRIVACY POLICY]", href: "/privacy/" },
    submit: "Send enquiry",
    success: "Received. We will reply by email.",
    error: "Not sent. Check the marked fields and try again.",
    optional: "(optional)",
    choose: "Choose one",
    fieldErrors: {
      required: "Required.",
      email: "Enter an email address, like name@studio.com.",
      consent: "Tick to agree before sending.",
    },
    endpointMissing: "Not sent. [FORM ENDPOINT] is not configured yet.",
  },
} as const;

/* ------------------------------------------------------------- UTILITY */
export const privacy = {
  headline: "Privacy",
  body: "[PRIVACY POLICY: to be supplied]",
} as const;

export const notFound = {
  label: "SC 404",
  headline: "This page is not in the cut.",
  link: { label: "Back to home", href: "/" },
} as const;

/** Joins the last two words with a no-break space so headings never end on a widow. */
export function noWidow(text: string): string {
  return text.replace(/\s+(\S+)\s*$/, " $1");
}

/** Internal link for a path, honouring Astro's `base` (set BASE_PATH for a project sub-path, e.g. GitHub Pages). */
export function link(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}${path}`;
}

/** Canonical URL for a path, built on the [DOMAIN] placeholder. */
export function canonical(path: string): string {
  return `${site.origin}${path}`;
}
