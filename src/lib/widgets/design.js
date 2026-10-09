// Part of the widgets builder set — system-design case studies. The barrel at
// src/lib/widgets.js re-exports this module so existing imports keep working.

// The components a URL-shortener request flows through. Reused by the request-
// flow widget; ordered for the diagram (client → edge → app → stores).
export const URL_NODES = [
  { id: 'client', label: 'Client', x: 0, y: 1 },
  { id: 'lb', label: 'Load balancer', x: 1, y: 1 },
  { id: 'app', label: 'App server', x: 2, y: 1 },
  { id: 'cache', label: 'Cache', x: 3, y: 0 },
  { id: 'db', label: 'Database', x: 3, y: 2 },
];
// The links between them: the app server talks to BOTH stores — the cache
// first, the database only on a miss or a write.
export const URL_EDGES = [['client', 'lb'], ['lb', 'app'], ['app', 'cache'], ['app', 'db']];

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
      detail: o.detail ?? null,
      cacheKeys: ck, dbKeys: dk, cacheState: o.cacheState ?? null,
    });
  };
  // WRITE — shorten a long URL
  snap('client', 'WRITE · shorten', 'WRITE — a user submits a long URL to shorten (POST /shorten). Writes are rare; reads will dominate.',
    { detail: 'POST /shorten is the write path: ~1,200/s from the estimate. It may be slower than a redirect, so it is allowed to touch the database directly.' });
  snap('lb', 'WRITE · shorten', 'The load balancer spreads requests across identical, stateless app servers (round-robin).',
    { detail: 'The balancer terminates TLS and picks a server by round-robin or least-connections. Because the app servers hold no session state, any of them can take any request — and adding capacity is just adding boxes.' });
  snap('app', 'WRITE · shorten', 'An app server mints a short key — “' + KEY + '” — from a unique counter encoded in base-62: short, and collision-free by construction.',
    { detail: 'One global counter would be a hot spot, so each server leases a block of IDs (say 1,000) from a coordinator and mints locally. Base-62 of a 64-bit counter is at most 11 characters; the first trillion links fit in 7.' });
  db = { [KEY]: LONG }; snap('db', 'WRITE · shorten', 'Store the mapping ' + KEY + ' → ' + LONG + ' in the database — the durable source of truth.',
    { detail: 'One row: key, long URL, created, expiry. The key is the primary key, so the redirect lookup later is a single point query. The write is replicated to a standby before it is acknowledged.' });
  snap('client', 'WRITE · shorten', 'Return the short URL: short.ly/' + KEY + '.', { response: 'short.ly/' + KEY,
    detail: 'Round trip: a few milliseconds of database latency plus the hops. Perfectly fine for something that happens once per link.' });
  // READ #1 — cache miss
  snap('client', 'READ · redirect', 'READ — someone clicks short.ly/' + KEY + ' (GET /' + KEY + '). This is the hot path — 100s of reads per write.',
    { detail: 'GET /' + KEY + ' is the path that matters: ~120,000/s at peak. Every design decision from here on exists to keep it under a few milliseconds.' });
  snap('lb', 'READ · redirect', 'Load balancer → an app server.',
    { detail: 'Same balancer. A redirect is a tiny request, so the balancer’s per-request overhead is a larger share of the latency here than on writes — one reason big shorteners push redirects to the edge.' });
  snap('cache', 'READ · redirect', 'Check the cache for ' + KEY + ' → MISS (no one has resolved it yet).', { cacheState: 'miss',
    detail: 'Cache-aside: the app asks the cache first. A miss is the slow path and costs a database read. Misses happen on a link’s first click and again after its entry expires or is evicted.' });
  snap('db', 'READ · redirect', 'Fall back to the database → found ' + LONG + '.',
    { detail: 'A point lookup by primary key: one B-tree descent, a few page reads from the buffer pool, on the order of a millisecond.' });
  cache = { [KEY]: LONG }; snap('cache', 'READ · redirect', 'Populate the cache (' + KEY + ' → …) so the next read skips the database entirely.', { cacheState: 'fill',
    detail: 'Stored with a TTL (say 24 hours). Because clicks follow a Zipf curve, a cache holding only the hottest fraction of keys absorbs the vast majority of redirects.' });
  snap('client', 'READ · redirect', 'Respond 301 → ' + LONG + '.', { response: '301 → ' + LONG,
    detail: 'A 301 is cached by the browser permanently, so repeat visits never reach the service — great for load, bad for analytics. Use a 302 when every click must be counted.' });
  // READ #2 — cache hit
  snap('client', 'READ · redirect', 'READ again — another click on the same link.',
    { detail: 'Another click, possibly from another user on another continent. Same key, same hot path.' });
  snap('cache', 'READ · redirect', 'Check the cache → HIT. No database touch — this is the common case once a link is warm.', { cacheState: 'hit',
    detail: 'A hit is a memory read in the cache tier: well under a millisecond, and zero database load. At 120K reads/s and a 90% hit rate the database sees only 12K/s.' });
  snap('client', 'READ · redirect', 'Respond 301 → ' + LONG + ', fast. Caching the hot keys is what lets a tiny DB serve a firehose of redirects.', { response: '301 → ' + LONG,
    detail: 'That ratio is the whole design. Everything else — replicas, sharding, the edge — exists to serve the misses and the writes.' });
  return out;
}
