// Copies the built static .html out of ./dist into ../private/ (the served
// location, exposed at a clean URL via vercel.json). Keeps Astro's build
// artifacts out of the committed tree — only the final .html is committed.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

// page-source -> served file. Add a line here per new templated page.
const PAGES = [
  { from: 'dist/july4v2.html', to: '../private/july4v2.html' },
];

for (const { from, to } of PAGES) {
  const src = resolve(root, from);
  const dest = resolve(root, to);
  if (!existsSync(src)) {
    console.error(`emit: missing build output ${src}`);
    process.exit(1);
  }
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  console.log(`emit: ${from} -> ${to}`);
}
