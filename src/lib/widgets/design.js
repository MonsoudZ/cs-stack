// Part of the widgets builder set — system-design case studies. The barrel at
// src/lib/widgets.js re-exports this module so existing imports keep working.

// The components a URL-shortener request flows through. Reused by the request-
// flow widget; ordered for the diagram (client → edge → app → stores).
export const URL_NODES = [
  { id: 'client', label: 'Client' },
  { id: 'lb', label: 'Load balancer' },
  { id: 'app', label: 'App server' },
  { id: 'cache', label: 'Cache' },
  { id: 'db', label: 'Database' },
];

// Trace a request through a URL shortener: first a WRITE (shorten a long URL),
// then a READ that misses the cache (falls to the DB and populates it), then a
// second READ that hits the cache — showing why a read-heavy system caches the
// hot keys and rarely touches the database. Emits the generic RequestFlow step
// contract ({ active, phase, note, meta, warn?, response }) so the shared widget
// renders it; the cacheState/cacheKeys/dbKeys fields are kept for the unit test.
export function buildUrlShortener() {
  const KEY = 'a7Xk2', LONG = 'example.com/very/long/article/path';
  const out = [];
  let cache = {}, db = {};
  const snap = (active, phase, note, o = {}) => {
    const ck = Object.keys(cache).length, dk = Object.keys(db).length;
    const cacheMeta = ck + ' key' + (ck === 1 ? '' : 's') + (o.cacheState ? ' · ' + o.cacheState.toUpperCase() : '');
    out.push({
      active, phase, note,
      meta: { cache: cacheMeta, db: dk + ' row' + (dk === 1 ? '' : 's') },
      warn: o.cacheState === 'miss' ? 'cache' : undefined, // a miss = the slow path
      response: o.response ?? null,
      cacheKeys: ck, dbKeys: dk, cacheState: o.cacheState ?? null,
    });
  };
  // WRITE — shorten a long URL
  snap('client', 'WRITE · shorten', 'WRITE — a user submits a long URL to shorten (POST /shorten). Writes are rare; reads will dominate.');
  snap('lb', 'WRITE · shorten', 'The load balancer spreads requests across identical, stateless app servers (round-robin).');
  snap('app', 'WRITE · shorten', 'An app server mints a short key — “' + KEY + '” — from a unique counter encoded in base-62: short, and collision-free by construction.');
  db = { [KEY]: LONG }; snap('db', 'WRITE · shorten', 'Store the mapping ' + KEY + ' → ' + LONG + ' in the database — the durable source of truth.');
  snap('client', 'WRITE · shorten', 'Return the short URL: short.ly/' + KEY + '.', { response: 'short.ly/' + KEY });
  // READ #1 — cache miss
  snap('client', 'READ · redirect', 'READ — someone clicks short.ly/' + KEY + ' (GET /' + KEY + '). This is the hot path — 100s of reads per write.');
  snap('lb', 'READ · redirect', 'Load balancer → an app server.');
  snap('cache', 'READ · redirect', 'Check the cache for ' + KEY + ' → MISS (no one has resolved it yet).', { cacheState: 'miss' });
  snap('db', 'READ · redirect', 'Fall back to the database → found ' + LONG + '.');
  cache = { [KEY]: LONG }; snap('cache', 'READ · redirect', 'Populate the cache (' + KEY + ' → …) so the next read skips the database entirely.', { cacheState: 'fill' });
  snap('client', 'READ · redirect', 'Respond 301 → ' + LONG + '.', { response: '301 → ' + LONG });
  // READ #2 — cache hit
  snap('client', 'READ · redirect', 'READ again — another click on the same link.');
  snap('cache', 'READ · redirect', 'Check the cache → HIT. No database touch — this is the common case once a link is warm.', { cacheState: 'hit' });
  snap('client', 'READ · redirect', 'Respond 301 → ' + LONG + ', fast. Caching the hot keys is what lets a tiny DB serve a firehose of redirects.', { response: '301 → ' + LONG });
  return out;
}
