import { defineConfig } from 'astro/config';

// Build-only tool (Approach A1). Astro compiles the private pages to plain
// static .html; production never runs Astro. Output lands in ./dist and is
// copied into ../private/ by scripts/emit.mjs (wired into `npm run build`).
export default defineConfig({
  // Canonical production origin. Used by the layout to derive self-referential
  // canonical / og:url values (new URL(Astro.url.pathname, Astro.site)).
  site: 'https://imari.cc',
  // One .html file per page (not pretty-url directories), to match the
  // existing private/*.html naming and the vercel.json rewrites.
  // inlineStylesheets:'always' keeps every component/page <style> inlined into
  // the page's <head> — no external _astro/*.css assets — so the committed
  // private/*.html stays fully self-contained (A1: only .html ships).
  build: { format: 'file', inlineStylesheets: 'always' },
  // No client-side framework, no integrations — these are static pages.
  compressHTML: false,
});
