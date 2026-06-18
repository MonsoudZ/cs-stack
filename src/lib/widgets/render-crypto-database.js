// Part of the widgets builder set, split by area. The barrel at
// src/lib/widgets.js re-exports every module so existing imports keep working.

// --- RENDER PIPELINE (/render) ---

// Which pipeline stages a style change forces to re-run. A geometry change
// invalidates from Layout; a paint-only change from Paint; transform/opacity
// only re-composite (the cheap, GPU path). kind: 'layout' | 'paint' | 'composite'.
export const RENDER_STAGES = ['Layout', 'Paint', 'Composite'];
export function invalidatedStages(kind) {
  const startAt = { layout: 0, paint: 1, composite: 2 }[kind];
  if (startAt === undefined) throw new Error('unknown change kind: ' + kind);
  return RENDER_STAGES.map((name, i) => ({ name, rerun: i >= startAt }));
}

// The critical rendering path: what gates the FIRST paint on page load. The
// browser needs both the DOM (from HTML) and the CSSOM (from CSS) before it can
// render — so CSS is render-blocking. A plain <script> also blocks the HTML
// parser; a deferred one doesn't, so first paint can land earlier. `defer`
// toggles the two and shows first paint move.
export function buildCrp({ defer = false } = {}) {
  const out = [];
  const snap = (note, o = {}) => out.push({ defer, note, parsing: !!o.parsing, cssBlocking: !!o.cssBlocking, scriptBlocking: !!o.scriptBlocking, scriptRan: !!o.scriptRan, painted: !!o.painted });
  snap('to paint, the browser needs the DOM (from HTML) and the CSSOM (from CSS). Watch what gates that first pixel');
  snap('parse the HTML top to bottom, building the DOM node by node', { parsing: true });
  snap('hit a <link rel="stylesheet"> → CSS is RENDER-BLOCKING: no paint until the CSSOM is built', { parsing: true, cssBlocking: true });
  if (!defer) {
    snap('hit a plain <script src> → parsing STOPS: it must download and run first (and it even waits for the CSS above)', { cssBlocking: true, scriptBlocking: true });
    snap('CSS arrives → CSSOM built; the blocking script runs; only now does parsing resume', { parsing: true, scriptRan: true });
    snap('DOM done + CSSOM ready → render tree → 🎨 first paint — but late: the blocking script held everything up', { painted: true, scriptRan: true });
  } else {
    snap('hit <script defer> → it downloads in parallel and runs after parsing; it does NOT block the parser', { parsing: true, cssBlocking: true });
    snap('the HTML finishes parsing → DOM complete, with the script kept out of the way', { parsing: true });
    snap('CSS arrives → CSSOM ready → render tree → 🎨 first paint, as soon as both are ready — much earlier', { painted: true });
    snap('the deferred script runs now, after first paint', { painted: true, scriptRan: true });
  }
  snap('CSS blocks the first paint either way; a plain script also blocks the parser — defer/async keep scripts off the critical path', { painted: true, scriptRan: true });
  return out;
}

// The event loop: one turn. Run a task to completion, then drain ALL microtasks
// (Promises), then — if a frame is due — run requestAnimationFrame callbacks and
// render (style → layout → paint). A setTimeout queued during the task waits for
// a later turn. Returns the phase-by-phase trace, with each queue's contents.
export function buildEventLoop() {
  const out = [];
  let stack = [], micro = [], tasks = ['click handler'], raf = [], rendered = false;
  const snap = (phase, note) => out.push({ phase, stack: stack.slice(), micro: micro.slice(), tasks: tasks.slice(), raf: raf.slice(), rendered, note });
  snap('idle', 'one turn of the loop: run a task, drain microtasks, then (if a frame is due) run rAF callbacks and render');
  stack = ['click handler']; tasks = [];
  snap('task', 'take the next task — the click handler — and run it to completion on the call stack');
  micro = ['Promise .then']; tasks = ['setTimeout cb']; raf = ['rAF cb'];
  snap('task', 'while running it schedules a microtask (Promise), a macrotask (setTimeout), and a frame callback (requestAnimationFrame)');
  stack = [];
  snap('task-done', 'the handler returns; the call stack is empty');
  stack = ['Promise .then'];
  snap('micro', 'before anything else, ALL microtasks drain — the Promise callback runs now, this same turn, not next');
  micro = []; stack = [];
  snap('micro', 'the microtask queue is empty; a frame is due (~16ms have passed at 60Hz — less on a faster display), so the loop heads into rendering');
  stack = ['rAF cb']; raf = [];
  snap('raf', 'requestAnimationFrame callbacks run first — the right place to make visual changes, just before layout');
  stack = [];
  snap('render', 'now the browser renders the frame: style → layout → paint → composite, once for everything that changed');
  rendered = true;
  snap('render', 'the frame is on screen. The setTimeout task still waits in the queue — it runs on a later turn (and if any step ran long, the frame would have janked)');
  return out;
}

// --- CRYPTO STACK (/crypto) ---

// A toy 32-bit hash (FNV-1a + an xorshift-multiply finalizer for good diffusion)
// — not secure, but it shows the two properties that matter: deterministic, and
// a strong avalanche (one input bit flips ~half the output bits).
export function toyHash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d) >>> 0;
  h ^= h >>> 12; h = Math.imul(h, 0x297a2d39) >>> 0;
  h ^= h >>> 15;
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function modpow(base, exp, mod) {
  let result = 1;
  base %= mod;
  while (exp > 0) {
    if (exp & 1) result = (result * base) % mod;
    exp >>= 1;
    base = (base * base) % mod;
  }
  return result;
}

// Diffie–Hellman: Alice and Bob agree on a shared secret over a public channel,
// never sending it. Small numbers for clarity. Returns the step trace.
export function buildDiffieHellman({ p = 23, g = 5, a = 6, b = 15 } = {}) {
  const A = modpow(g, a, p), B = modpow(g, b, p);
  const sA = modpow(B, a, p), sB = modpow(A, b, p);
  const out = [];
  let alice = { secret: '?', pub: '?', shared: '?' };
  let bob = { secret: '?', pub: '?', shared: '?' };
  let wire = null;
  const snap = (note) => out.push({ alice: { ...alice }, bob: { ...bob }, wire, note });
  snap('Out in the open: a prime p = ' + p + ' and a base g = ' + g + '. Anyone (including an eavesdropper) can see these.');
  alice = { ...alice, secret: a }; snap('Alice picks a private secret a = ' + a + ' and tells no one.');
  bob = { ...bob, secret: b }; snap('Bob picks a private secret b = ' + b + ' and tells no one.');
  alice = { ...alice, pub: A }; wire = 'A = ' + A; snap('Alice sends A = g^a mod p = ' + g + '^' + a + ' mod ' + p + ' = ' + A + ' — over the public wire.');
  bob = { ...bob, pub: B }; wire = 'B = ' + B; snap('Bob sends B = g^b mod p = ' + g + '^' + b + ' mod ' + p + ' = ' + B + ' — over the public wire.');
  alice = { ...alice, shared: sA }; snap('Alice computes B^a mod p = ' + B + '^' + a + ' mod ' + p + ' = ' + sA + '.');
  bob = { ...bob, shared: sB }; snap('Bob computes A^b mod p = ' + A + '^' + b + ' mod ' + p + ' = ' + sB + '.');
  snap('Both now hold the same secret ' + sA + ' — but an eavesdropper saw only p, g, A and B, and recovering it means solving a discrete logarithm.');
  return out;
}

// Toy RSA parameters for the signature demo: p=11, q=13 → n=143, and
// e·d ≡ 1 (mod λ(143)=60) with e=7, d=103. Tiny on purpose so every number is
// legible; the round-trip m^(e·d) ≡ m (mod n) still holds for the whole range.
export const RSA = { n: 143, e: 7, d: 103 };

// Digital signatures: Alice signs a message's HASH with her PRIVATE key; anyone
// verifies with her PUBLIC key. Because verification recovers the signed hash,
// altering the message (which changes its hash) makes the check fail — so a
// forgery without the private key is caught. The hash is squashed into 0..n-1
// so the toy modulus can sign it. Returns the step trace, ending with a tamper
// attempt that is rejected.
export function buildSignature() {
  const { n, e, d } = RSA;
  const digest = (msg) => parseInt(toyHash(msg), 16) % n;
  const message = 'pay alice $100';
  const out = [];
  const snap = (note, o = {}) => out.push({
    message: o.message ?? message, hash: o.hash ?? null, sig: o.sig ?? null,
    recovered: o.recovered ?? null, side: o.side ?? null, verdict: o.verdict ?? null, note,
  });
  const hM = digest(message);
  const sig = modpow(hM, d, n);
  const rec = modpow(sig, e, n);
  snap('Alice wants to prove she sent “' + message + '” — and that no one changed it on the way.', { side: 'sign' });
  snap('first, hash the message → ' + hM + ' (a fixed-size fingerprint; the thing she actually signs, not the whole text)', { side: 'sign', hash: hM });
  snap('SIGN: raise the hash to her PRIVATE key d=' + d + ' (mod ' + n + ') → signature ' + sig + '. Only she can compute this.', { side: 'sign', hash: hM, sig });
  snap('she sends (message, signature ' + sig + '). The signature travels in the open, alongside the message.', { side: 'send', hash: hM, sig });
  snap('VERIFY: anyone raises the signature to her PUBLIC key e=' + e + ' (mod ' + n + ') → ' + rec + ', the hash she must have signed.', { side: 'verify', sig, recovered: rec });
  snap('hash the received message → ' + digest(message) + '. It matches ' + rec + ' → authentic and untampered ✓', { side: 'verify', sig, recovered: rec, hash: digest(message), verdict: digest(message) === rec ? 'valid' : 'forged' });
  const forged = 'pay alice $900';
  const hF = digest(forged);
  snap('now an attacker rewrites the message to “' + forged + '” — but without d they can’t produce a matching signature.', { side: 'tamper', message: forged, sig });
  snap('VERIFY again: the public key still recovers ' + rec + ', but the tampered text hashes to ' + hF + ' ≠ ' + rec + ' → forged, rejected ✗', { side: 'tamper', message: forged, sig, recovered: rec, hash: hF, verdict: hF === rec ? 'valid' : 'forged' });
  return out;
}

// A Merkle tree fingerprints a set of data blocks by hashing them pairwise up to
// a single root, so any change to any block changes the root — the idea behind
// content-addressing (git commits, IPFS, blockchains). Toy 4-leaf tree with
// short digests; the final steps tamper with one block and show the root break.
export function buildMerkle() {
  const blocks = ['alice→bob: 5', 'bob→cy: 2', 'cy→dan: 9', 'dan→eve: 1'];
  const h = (s) => toyHash(s).slice(0, 6);
  const out = [];
  let leaves = ['', '', '', ''], mids = ['', ''], root = '';
  const snap = (note, o = {}) => out.push({
    blocks: blocks.slice(), leaves: leaves.slice(), mids: mids.slice(), root,
    active: o.active ?? null, tampered: o.tampered ?? null, broken: !!o.broken, note,
  });
  snap('Four data blocks. A Merkle tree fingerprints them so the tiniest change is detectable from one short root hash.');
  for (let i = 0; i < 4; i++) { leaves[i] = h(blocks[i]); snap('hash block ' + i + ' on its own → leaf ' + leaves[i], { active: 'leaf' + i }); }
  mids[0] = h(leaves[0] + leaves[1]); snap('hash the first two leaves together → ' + mids[0], { active: 'mid0' });
  mids[1] = h(leaves[2] + leaves[3]); snap('hash the second two leaves → ' + mids[1], { active: 'mid1' });
  root = h(mids[0] + mids[1]); snap('hash the two halves into the single Merkle root → ' + root + '. Publish just this.', { active: 'root' });
  const goodRoot = root;
  const tIdx = 2;
  blocks[tIdx] = 'cy→dan: 90'; leaves[tIdx] = h(blocks[tIdx]);
  snap('now an attacker edits block ' + tIdx + ' (9 → 90). Its leaf hash changes immediately…', { active: 'leaf' + tIdx, tampered: tIdx });
  mids[1] = h(leaves[2] + leaves[3]); snap('…so the half-hash above it changes…', { active: 'mid1', tampered: tIdx });
  root = h(mids[0] + mids[1]); snap('…so the root changes: ' + root + ' ≠ the published ' + goodRoot + ' → the tampering is caught with one comparison.', { active: 'root', tampered: tIdx, broken: true });
  return out;
}

// --- DATABASE STACK (/database) ---

// A join combines rows from two tables wherever a key matches. This traces an
// inner join (users ⋈ orders ON users.id = orders.user_id) by the simplest
// algorithm — a nested loop: for every left row, scan every right row. It emits
// matched pairs, drops unmatched left rows, and counts comparisons (the n×m cost
// an index or hash join exists to avoid).
export const JOIN_USERS = [{ id: 1, name: 'Ana' }, { id: 2, name: 'Bo' }, { id: 3, name: 'Cy' }];
export const JOIN_ORDERS = [{ id: 91, user_id: 1, item: 'book' }, { id: 92, user_id: 1, item: 'pen' }, { id: 93, user_id: 3, item: 'lamp' }];
export function buildJoin() {
  const out = [];
  const result = [];
  let comparisons = 0;
  const snap = (note, o = {}) => out.push({ left: o.left ?? null, right: o.right ?? null, match: o.match ?? null, result: result.map((r) => ({ ...r })), comparisons, note, done: !!o.done });
  snap('an inner join stitches two tables together where a key lines up — here users ⋈ orders on users.id = orders.user_id');
  for (const u of JOIN_USERS) {
    let matched = 0;
    for (const o of JOIN_ORDERS) {
      comparisons++;
      const hit = u.id === o.user_id;
      if (hit) { matched++; result.push({ name: u.name, item: o.item }); }
      snap('compare ' + u.name + ' (id ' + u.id + ') with order ' + o.id + ' (user_id ' + o.user_id + ') → ' + (hit ? 'match → emit (' + u.name + ', ' + o.item + ')' : 'no match'), { left: u.id, right: o.id, match: hit });
    }
    if (!matched) snap(u.name + ' had no matching orders → an inner join drops them entirely', { left: u.id });
  }
  snap(result.length + ' rows out, after ' + comparisons + ' comparisons — every user against every order (n×m). An index on orders.user_id, or a hash join, turns that scan into a lookup', { done: true });
  return out;
}

// A tiny B-tree over keys 1..15: a root of separator keys and four leaves.
export const BTREE = {
  root: { keys: [4, 8, 12], children: ['n0', 'n1', 'n2', 'n3'] },
  n0: { keys: [1, 2, 3] }, n1: { keys: [5, 6, 7] }, n2: { keys: [9, 10, 11] }, n3: { keys: [13, 14, 15] },
};
// Index lookup: descend the tree by comparing to separator keys, then scan one
// leaf — O(log n) node reads instead of scanning every row. Returns the trace.
export function buildBTreeSearch({ target = 10 } = {}) {
  const out = [];
  const snap = (path, current, found, note, foundKey = null) => out.push({ path: path.slice(), current, found, note, foundKey });
  snap([], null, false, 'find the row with key ' + target + ' — an index turns a scan of all 15 rows into a short walk down a tree');
  const root = BTREE.root;
  let ci = root.keys.findIndex((k) => target < k);
  if (ci === -1) ci = root.keys.length;
  const cmp = ci < root.keys.length ? target + ' < ' + root.keys[ci] : target + ' > ' + root.keys[root.keys.length - 1];
  snap(['root'], 'root', false, 'at the root [' + root.keys.join(', ') + ']: ' + cmp + ' → follow child ' + ci);
  const leafId = root.children[ci];
  const leaf = BTREE[leafId];
  const hit = leaf.keys.includes(target);
  snap(['root', leafId], leafId, hit,
    hit ? 'scan the leaf [' + leaf.keys.join(', ') + '] → found ' + target + ' in 2 node reads, not 15 row reads'
        : 'leaf [' + leaf.keys.join(', ') + '] does not contain ' + target,
    hit ? target : null);
  return out;
}

// A transfer (Alice → Bob, 100) that crashes mid-way. With a transaction the
// crash rolls back (atomic, total preserved); without one, the debit sticks and
// $100 vanishes. Returns the trace; last step carries the final balances.
export function buildTransaction({ atomic = true } = {}) {
  const out = [];
  let A = 300, B = 50;
  const snap = (note, o = {}) => out.push({ A, B, total: A + B, note, crashed: !!o.crashed, lost: !!o.lost });
  snap(atomic ? 'BEGIN — wrap the whole transfer in a transaction: all of it commits, or none of it' : 'no transaction — each write commits on its own (autocommit)');
  A = A - 100;
  snap('debit Alice: A = 300 − 100 = ' + A + (atomic ? ' (staged inside the transaction, not yet durable)' : ' — already committed'));
  snap('CRASH — the power dies right here, before Bob is credited', { crashed: true });
  if (atomic) {
    A = 300;
    snap('on restart the transaction never committed → ROLLBACK restores Alice to ' + A);
    snap('A = ' + A + ', B = ' + B + ', total = ' + (A + B) + ' — atomicity held: the transfer happened fully or not at all');
  } else {
    snap('Bob was never credited, but Alice’s debit already stuck → A = ' + A + ', B = ' + B + ', total = ' + (A + B) + '. $100 just vanished.', { lost: true });
  }
  return out;
}

// Isolation levels: with concurrent transactions, what T1 is allowed to see of
// T2's changes depends on the level. The same interleaving (T2 writes x, T1
// reads it three times around T2's commit) yields different reads — exposing a
// dirty read, a non-repeatable read, or neither. Returns the trace per level.
export const ISOLATION_LEVELS = ['READ UNCOMMITTED', 'READ COMMITTED', 'REPEATABLE READ'];
export function buildIsolation({ level = 'READ COMMITTED' } = {}) {
  let committed = 100, pending = null;
  const snapshot = 100; // T1's view as of its start (for REPEATABLE READ)
  const t1reads = [];
  const out = [];
  const read = () => level === 'READ UNCOMMITTED' ? (pending != null ? pending : committed)
    : level === 'READ COMMITTED' ? committed : snapshot;
  const snap = (note, o = {}) => out.push({ committed, pending, t1reads: t1reads.slice(), actor: o.actor ?? null, anomaly: o.anomaly ?? null, level, note });
  snap('row x = 100. T1 and T2 run at once; the isolation level decides how much of T2’s change T1 may see');
  snap('T1 BEGIN', { actor: 'T1' });
  { const v = read(); t1reads.push(v); snap('T1 reads x = ' + v + ' — its first look', { actor: 'T1' }); }
  pending = 120; snap('T2 BEGIN, writes x = 120 — but has NOT committed yet', { actor: 'T2' });
  { const v = read(); t1reads.push(v); const dirty = v === 120;
    snap('T1 reads x → ' + v + (dirty ? ' — a DIRTY READ: it sees T2’s uncommitted write (which could still roll back)' : ' — it refuses to read uncommitted data'), { actor: 'T1', anomaly: dirty ? 'dirty' : null }); }
  committed = 120; pending = null; snap('T2 COMMIT — x is now officially 120', { actor: 'T2' });
  { const v = read(); t1reads.push(v); const changed = v !== t1reads[0];
    snap('T1 reads x once more → ' + v + (changed ? ' — a NON-REPEATABLE READ: the value shifted under T1 mid-transaction' : ' — still T1’s original snapshot, perfectly consistent'), { actor: 'T1', anomaly: changed ? 'nonrepeatable' : null }); }
  snap('T1 COMMIT', { actor: 'T1' });
  const verdict = level === 'READ UNCOMMITTED'
    ? 'READ UNCOMMITTED allows both a dirty read and a non-repeatable read — fastest, least safe'
    : level === 'READ COMMITTED'
      ? 'READ COMMITTED blocks the dirty read, but the value still changed between T1’s reads — a non-repeatable read'
      : 'REPEATABLE READ hands T1 a stable snapshot: every read returns 100, no dirty or non-repeatable read — this is what MVCC buys (the ANSI level still allows phantoms; SERIALIZABLE blocks those too), at the cost of keeping old row versions around';
  snap(verdict);
  return out;
}
