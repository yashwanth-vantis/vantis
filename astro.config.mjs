import { defineConfig } from "astro/config";

// Static output for S3 + CloudFront. Canonicals use the [DOMAIN] placeholder from
// src/content/site.ts, so `site` is left unset on purpose (see DECISIONS.md).
export default defineConfig({
  output: "static",
  // "/" for a root domain (production). For a project sub-path such as GitHub Pages
  // (https://<user>.github.io/<repo>/) build with BASE_PATH=/<repo>/.
  base: process.env.BASE_PATH || "/",
  trailingSlash: "always",
  build: {
    format: "directory",
    assets: "_astro",
    inlineStylesheets: "always",
  },
  compressHTML: true,
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  devToolbar: { enabled: false },
  vite: {
    build: { assetsInlineLimit: 0, cssMinify: true },
  },
});
