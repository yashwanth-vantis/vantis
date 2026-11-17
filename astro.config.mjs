// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  // "/" by default. GitHub Pages project sites build with BASE_PATH=/<repo>/ (set by the deploy workflow).
  base: process.env.BASE_PATH || "/",
});
