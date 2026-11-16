import type { APIRoute } from "astro";
import { canonical } from "../content/site";
const paths = ["/", "/services/", "/about/", "/contact/", "/privacy/"];
export const GET: APIRoute = () =>
  new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
      .map((p) => `  <url><loc>${canonical(p)}</loc></url>`)
      .join("\n")}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml" } },
  );
