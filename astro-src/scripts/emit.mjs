// Copies the built static .html out of ./dist into ../private/ (the served
// location, exposed at a clean URL via vercel.json). Keeps Astro's build
// artifacts out of the committed tree — only the final .html is committed.
//
// Generalized (§7a): emits EVERY page Astro built, not a hardcoded list.
// Astro builds every file in src/pages/*.astro to dist/<name>.html (build
// format 'file'); this walks dist/ and copies each .html to the matching
// private/<name>.html, preserving any subpath. Non-migrated original pages
// are never touched — they aren't Astro pages, so they're not in dist/.
//
// Optional fast path: `npm run build:one -- <slug>` rebuilds all (Astro always
// compiles every page) but emits only dist/<slug>.html, leaving other
// private/*.html untouched so the working tree stays quiet during iteration.
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const distDir = resolve(root, 'dist');
const privateDir = resolve(root, '..', 'private');

// Optional slug filter from `npm run build:one -- <slug>` (or `--only=<slug>`).
const args = process.argv.slice(2);
const onlyArg = args.find((a) => a.startsWith('--only='))?.slice('--only='.length)
  ?? args.find((a) => !a.startsWith('-'));
const only = onlyArg ? onlyArg.replace(/\.html$/, '') : null;

// Recursively collect every .html under dist/.
function findHtml(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findHtml(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

if (!existsSync(distDir)) {
  console.error(`emit: no dist/ directory — run \`astro build\` first`);
  process.exit(1);
}

const built = findHtml(distDir);
if (built.length === 0) {
  console.error('emit: no .html files found in dist/');
  process.exit(1);
}

let emitted = 0;
for (const src of built) {
  const rel = relative(distDir, src); // e.g. "july4v2.html"
  const slug = rel.replace(/\.html$/, '');
  if (only && slug !== only) continue;
  const dest = join(privateDir, rel);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  console.log(`emit: dist/${rel} -> private/${rel}`);
  emitted++;
}

if (only && emitted === 0) {
  console.error(`emit: --only "${only}" matched no built page (have: ${built.map((p) => relative(distDir, p)).join(', ')})`);
  process.exit(1);
}
console.log(`emit: ${emitted} page(s) copied to private/`);
