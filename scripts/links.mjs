// Internal link checker: every internal href in the built site must resolve to
// a real file in dist/, and every #fragment must point at an element that
// actually exists on the target page. Catches the class of bug the structural
// audit can't see — a renamed page or a typo'd slug that leaves a dead link in
// a SeeAlso, a CrossLinks strip, the /map ladder, the curriculum, or PrevNext.
//
// Runs over the built output (dist/), so it sees exactly what ships. External
// links (http(s):, mailto:, tel:, protocol-relative) are out of scope.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, posix } from 'node:path';

const DIST = 'dist';
const failures = [];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

// Cache of each HTML file's set of anchor targets (id=… / name=…).
const anchorCache = new Map();
function anchorsOf(file) {
  if (anchorCache.has(file)) return anchorCache.get(file);
  const html = readFileSync(file, 'utf8');
  const ids = new Set();
  for (const m of html.matchAll(/\b(?:id|name)=["']([^"']+)["']/g)) ids.add(m[1]);
  anchorCache.set(file, ids);
  return ids;
}

// Map a URL pathname to the file dist/ would serve for it. Returns the resolved
// path (an .html file for routes, the asset itself otherwise), or null.
function resolvePath(pathname) {
  if (pathname === '' || pathname === '/') return join(DIST, 'index.html');
  const clean = pathname.replace(/\/$/, ''); // tolerate trailing slash
  const candidates = [
    join(DIST, clean, 'index.html'), // /foo            → dist/foo/index.html
    join(DIST, clean + '.html'), //     /foo            → dist/foo.html
    join(DIST, clean), //               /og/x.png, etc. → dist/og/x.png
  ];
  return candidates.find((c) => existsSync(c)) ?? null;
}

const isExternal = (href) => /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href);

const htmlFiles = walk(DIST).filter((f) => f.endsWith('.html'));
let checked = 0;

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(/href=["']([^"']+)["']/g)) {
    const raw = m[1];
    if (!raw || isExternal(raw)) continue; // external / non-navigational schemes

    const hashAt = raw.indexOf('#');
    const frag = hashAt >= 0 ? raw.slice(hashAt + 1) : '';
    let path = hashAt >= 0 ? raw.slice(0, hashAt) : raw;
    path = path.split('?')[0];

    // Resolve the target file (a same-page #frag link has no path).
    let target;
    if (path === '') {
      target = file; // fragment on the current page
    } else if (path.startsWith('/')) {
      target = resolvePath(path);
    } else {
      // relative to the current page's directory
      target = resolvePath('/' + posix.normalize(posix.join(dirname(file).slice(DIST.length), path)));
    }

    checked += 1;
    if (!target) {
      failures.push(`${file}: dead link → ${raw} (no file in ${DIST} for "${path}")`);
      continue;
    }
    // Verify the fragment exists on the (HTML) target.
    if (frag && target.endsWith('.html') && !anchorsOf(target).has(frag)) {
      failures.push(`${file}: dead anchor → ${raw} (no #${frag} on ${target.slice(DIST.length + 1)})`);
    }
  }
}

if (failures.length) {
  console.error(`\nLink check failed — ${failures.length} broken internal link(s):\n`);
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log(`Link check passed — ${checked} internal links across ${htmlFiles.length} pages all resolve.`);
