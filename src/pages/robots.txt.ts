import type { APIRoute } from "astro";
import { site } from "../content/site";
export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${site.origin}/sitemap.xml\n`, { headers: { "Content-Type": "text/plain" } });
