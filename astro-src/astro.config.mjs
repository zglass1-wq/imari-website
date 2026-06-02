import { defineConfig } from 'astro/config';

// Build-only tool (Approach A1). Astro compiles the private pages to plain
// static .html; production never runs Astro. Output lands in ./dist and is
// copied into ../private/ by scripts/emit.mjs (wired into `npm run build`).
export default defineConfig({
  // One .html file per page (not pretty-url directories), to match the
  // existing private/*.html naming and the vercel.json rewrites.
  build: { format: 'file' },
  // No client-side framework, no integrations — these are static pages.
  compressHTML: false,
});
