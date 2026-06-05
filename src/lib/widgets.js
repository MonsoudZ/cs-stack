// Pure step-builders for the system widgets. Extracted verbatim from the
// components so the logic can be unit-tested — the components import these and
// only render the current step.

// --- 06 CPU: a tiny fetch/decode/execute loop ---
export function buildCpu() {
  const PROG = [
    {op:'LOADA',arg:5,t:'LOAD A, 5'},
    {op:'LOADB',arg:3,t:'LOAD B, 3'},
    {op:'ADD',t:'ADD       ; A = A + B'},
    {op:'LOADB',arg:2,t:'LOAD B, 2'},
    {op:'SUB',t:'SUB       ; A = A - B'},
    {op:'OUT',t:'OUT       ; print A'},
    {op:'HALT',t:'HALT'},
  ];
  const txt = PROG.map((p) => p.t);
  let PC = 0, A = 0, B = 0, out = '';
  const steps = [];
  const snap = (note, cur) => steps.push({ PC, A, B, out, note, prog: txt, cur });
  snap('ready — PC = 0, registers cleared', -1);
  while (PC < PROG.length) {
    const here = PC, ins = PROG[here]; let note;
    if (ins.op === 'LOADA') { A = ins.arg; note = 'fetch→decode→execute · LOAD A, ' + ins.arg + ' → A = ' + A; }
    else if (ins.op === 'LOADB') { B = ins.arg; note = 'fetch→decode→execute · LOAD B, ' + ins.arg + ' → B = ' + B; }
    else if (ins.op === 'ADD') { A = A + B; note = 'ADD → A = A + B = ' + A; }
    else if (ins.op === 'SUB') { A = A - B; note = 'SUB → A = A − B = ' + A; }
    else if (ins.op === 'OUT') { out = String(A); note = 'OUT → output ' + out; }
    else { note = 'HALT — program done'; PC = PROG.length; snap(note, here); break; }
    PC++; snap(note, here);
  }
  return steps;
}

// --- 09 Network: encapsulation down the stack and back up ---
export function buildEnc() {
  const PAYLOAD = {cls:'payload',sl:'HTTP payload',sd:'GET /cases/42 HTTP/1.1',bytes:22};
  const TCP = {cls:'tcp',sl:'TCP header',sd:'sport 54321 → dport 443 · seq#',bytes:20};
  const IP = {cls:'ip',sl:'IP header',sd:'src 10.0.0.5 → dst 93.184.x.x',bytes:20};
  const ETH = {cls:'eth',sl:'Ethernet',sd:'src MAC → dst MAC',bytes:14};
  const FCS = {cls:'fcs',sl:'FCS',sd:'checksum',bytes:4};
  const S = [];
  const st = (segs, side, layer, note) => S.push({ segs, side, layer, note, bytes: segs.reduce((a, s) => a + s.bytes, 0) });
  st([PAYLOAD],'sender ↓','Application','your code hands the HTTP request to the OS — just text, the bytes from layer 03');
  st([TCP,PAYLOAD],'sender ↓','Transport','TCP wraps it: adds ports (which program?) and a sequence number (for reliability)');
  st([IP,TCP,PAYLOAD],'sender ↓','Network','IP wraps that: adds source + destination addresses so routers can forward it');
  st([ETH,IP,TCP,PAYLOAD,FCS],'sender ↓','Link','the link layer adds MAC addresses + a checksum — now a frame, ready for the wire');
  st([ETH,IP,TCP,PAYLOAD,FCS],'⇄ the wire','Physical','sent as voltage / light / radio — layer 00 — across switches and routers');
  st([IP,TCP,PAYLOAD],'receiver ↑','Link','server strips the frame, verifies the checksum — link layer done');
  st([TCP,PAYLOAD],'receiver ↑','Network','strips the IP header — "yes, this packet is addressed to me"');
  st([PAYLOAD],'receiver ↑','Transport','strips the TCP header, re-orders & acknowledges — hands the payload up');
  st([PAYLOAD],'receiver ↑','Application','the server receives the exact same bytes you sent: GET /cases/42');
  return S;
}

// --- 09 Network: packets dropped on a lossy link, then retransmitted ---
export const PACKET_FRAGMENTS = ['GET ','/cas','es/','42 ','HTTP','/1.1'];

export function buildPkt() {
  const FRAG = PACKET_FRAGMENTS;
  const N = FRAG.length, dropFirst = new Set([2,5]), slots = Array(N).fill(null), out = [];
  const snap = (flight, note, delivered) => out.push({ flight, slots: slots.slice(), note, delivered: !!delivered });
  snap(null, '6 packets queued — each carries a sequence number so the receiver can reorder them later', false);
  for (let s = 1; s <= N; s++) {
    if (dropFirst.has(s)) snap({ seq: s, status: 'drop' }, 'packet ' + s + ' sent → LOST in transit (a congested router dropped it)', false);
    else { slots[s-1] = FRAG[s-1]; snap({ seq: s, status: 'arrive' }, 'packet ' + s + ' arrives → placed in slot ' + s + ' by its sequence number', false); }
  }
  snap(null, 'receiver has 1,3,4,6 but slots 2 & 5 are empty — TCP spots the gaps and asks the sender to resend', false);
  [2,5].forEach((s) => { slots[s-1] = FRAG[s-1]; snap({ seq: s, status: 'arrive' }, 'packet ' + s + ' retransmitted → arrives, fills slot ' + s, false); });
  snap(null, 'every slot full → TCP reassembles in order and hands the complete request up the stack', true);
  return out;
}

// --- 10 Cloud: a Rails request lifecycle. `server` is the round-robin app
// index (0-2); `cacheHit` chooses the Redis hit (skip DB) vs miss path. Pure:
// the component owns the server-rotation state and passes it in. ---
export function buildCloudHops({ cacheHit = false, server = 0 } = {}) {
  const sv = server, h = [], add = (loc, ms, note, async) => h.push({ loc, ms, note, async: !!async });
  add('browser', 0, 'a user clicks — the browser fires GET /cases/42');
  add('lb', 2, 'across the internet to the load balancer — the one public door');
  add('app', 1, 'load balancer forwards to app server #' + (sv + 1) + ' of 3 (spreading the load)');
  add('app', 3, 'Rails routes it → CasesController#show — your code starts running');
  add('redis', 1, 'check Redis: is case 42 already cached?');
  if (cacheHit) { add('redis', 0, 'cache HIT ✓ — answer is in memory, skip the database entirely'); }
  else {
    add('redis', 0, 'cache MISS ✗ — Redis does not have it, must ask the database');
    add('pg', 20, 'Postgres runs the SQL and returns the row — the slow part (~20ms)');
    add('redis', 1, 'write the result into Redis so the next request is a hit (cache now warm)');
  }
  add('sidekiq', 1, 'enqueue an audit-log job to Sidekiq — fire-and-forget, returns instantly');
  add('app', 4, 'render the response — JSON for the case');
  add('lb', 2, 'response travels back up through the load balancer');
  add('browser', 2, 'the browser receives the response and paints the screen ✓');
  add('sidekiq', 0, 'meanwhile, async: a Sidekiq worker pulls the job off the queue and runs it — the user already has their answer', true);
  return h;
}

// --- 04.5 Floating point: a toy 8-bit IEEE-754 (1 sign · 4 exponent, bias 7 ·
// 3 mantissa). bits is [s, e3,e2,e1,e0, m2,m1,m0]. Returns the real value it
// stands for plus the pieces, so the widget can show the decode (and the gaps
// between representable values — the "lie" of decimals). ---
export const FLOAT_BIAS = 7;
export function decodeMiniFloat(bits) {
  const s = bits[0];
  const e = (bits[1] << 3) | (bits[2] << 2) | (bits[3] << 1) | bits[4];
  const m = (bits[5] << 2) | (bits[6] << 1) | bits[7];
  const sign = s ? -1 : 1;
  if (e === 15) {
    if (m === 0) return { value: sign * Infinity, kind: 'inf', sign: s, e, m };
    return { value: NaN, kind: 'nan', sign: s, e, m };
  }
  if (e === 0) {
    // subnormal: no implicit leading 1, exponent fixed at 1 - bias
    return { value: sign * (m / 8) * 2 ** (1 - FLOAT_BIAS), kind: 'subnormal', sign: s, e, m, exp: 1 - FLOAT_BIAS, frac: m / 8 };
  }
  return { value: sign * (1 + m / 8) * 2 ** (e - FLOAT_BIAS), kind: 'normal', sign: s, e, m, exp: e - FLOAT_BIAS, frac: 1 + m / 8 };
}

// --- 08.2 Concurrency: two threads each run `counter += 1` (read · add · write)
// on shared memory. Without a lock, a bad interleaving loses an update (final 1
// instead of 2); a lock serializes the critical section (final 2). Pure: the
// component owns the `locked` toggle and steps through the returned snapshots. ---
export function buildRace({ locked = false } = {}) {
  const out = [];
  let counter = 0, tmpA = '–', tmpB = '–', held = null;
  const snap = (note, o = {}) => out.push({ thread: o.thread ?? null, op: o.op ?? null, tmpA, tmpB, counter, held, lost: !!o.lost, note });
  if (locked) {
    snap('Each thread must grab the lock before touching counter — only one inside the critical section at a time.');
    held = 'A'; snap('Thread A acquires the lock', { thread: 'A', op: 'lock' });
    tmpA = counter; snap('A reads counter = ' + counter + ' into its tmp', { thread: 'A', op: 'read' });
    tmpA = tmpA + 1; snap('A computes tmp + 1 = ' + tmpA, { thread: 'A', op: 'add' });
    counter = tmpA; snap('A writes ' + counter + ' back to counter', { thread: 'A', op: 'write' });
    held = null; snap('A releases the lock', { thread: 'A', op: 'unlock' });
    held = 'B'; snap('Only now can Thread B take the lock', { thread: 'B', op: 'lock' });
    tmpB = counter; snap('B reads counter = ' + counter, { thread: 'B', op: 'read' });
    tmpB = tmpB + 1; snap('B computes tmp + 1 = ' + tmpB, { thread: 'B', op: 'add' });
    counter = tmpB; snap('B writes ' + counter, { thread: 'B', op: 'write' });
    held = null; snap('B releases the lock', { thread: 'B', op: 'unlock' });
    snap('counter = ' + counter + ' ✓ — the lock made each read-modify-write atomic, so both increments counted');
  } else {
    snap('Both threads run counter += 1 with no lock — and that is really three steps: read, add, write.');
    tmpA = counter; snap('A reads counter = ' + counter, { thread: 'A', op: 'read' });
    tmpB = counter; snap('B reads counter = ' + counter + ' — before A has written anything back', { thread: 'B', op: 'read' });
    tmpA = tmpA + 1; snap('A computes tmp + 1 = ' + tmpA, { thread: 'A', op: 'add' });
    counter = tmpA; snap('A writes counter = ' + counter, { thread: 'A', op: 'write' });
    tmpB = tmpB + 1; snap('B computes tmp + 1 = ' + tmpB + ' — from its stale read', { thread: 'B', op: 'add' });
    counter = tmpB; snap('B writes counter = ' + counter + ' — it never saw A’s update', { thread: 'B', op: 'write', lost: true });
    snap('counter = ' + counter + ', but += 1 ran twice. One increment was lost — that is a race condition.', { lost: true });
  }
  return out;
}

// --- NETWORK STACK (/network) ---

// IP routing: a packet hops node to node toward its destination, its TTL (a hop
// budget) decreasing each hop until it's delivered. Returns {nodes, steps}.
export function buildRouting() {
  const nodes = ['your laptop', 'home router', 'ISP', 'backbone', 'datacenter', 'server'];
  const out = [];
  let ttl = 6;
  const snap = (at, note, delivered = false) => out.push({ at, ttl, note, delivered });
  snap(0, 'the packet leaves carrying a destination IP and TTL = ' + ttl + ' — a hop budget so it can never loop forever');
  for (let i = 1; i < nodes.length; i++) {
    ttl -= 1;
    const last = i === nodes.length - 1;
    snap(i,
      last
        ? 'reached ' + nodes[i] + ' — the destination IP matches, so deliver it (TTL ' + ttl + ' to spare)'
        : nodes[i] + ' reads the destination IP, checks its routing table, and forwards to the next hop · TTL → ' + ttl,
      last);
  }
  return { nodes, steps: out };
}

// DNS resolution: a recursive resolver walks root → TLD → authoritative to turn
// a name into an IP, then caches it. Returns the step list (last step = answer).
export function buildDns({ name = 'thestack.dev', ip = '93.184.216.34' } = {}) {
  const out = [];
  const snap = (server, kind, note, answer = null) => out.push({ server, kind, note, answer });
  snap('your app', 'ask', 'your app needs the IP for ' + name + ', so it asks the resolver');
  snap('root (.)', 'referral', 'the resolver asks a root server. root: “I don’t host ' + name + ', but the .dev servers do.”');
  snap('.dev TLD', 'referral', 'the resolver asks the .dev TLD server. it: “ask the authoritative server for ' + name + '.”');
  snap('authoritative', 'answer', 'the authoritative server for ' + name + ' replies with the address', ip);
  snap('resolver', 'cache', 'the resolver caches the answer (until its TTL expires) and hands the IP back to your app', ip);
  return out;
}

// --- COMPILER STACK (/compiler) ---

// Lexing: scan source text left to right, grouping characters into tokens.
export function buildLex({ source = '3 + 4 * 2' } = {}) {
  const out = [];
  const tokens = [];
  const typeOf = (c) => (/[0-9]/.test(c) ? 'num' : c === '+' ? 'plus' : c === '*' ? 'star' : 'op');
  const snap = (pos, note) => out.push({ pos, source, tokens: tokens.map((t) => ({ ...t })), note });
  snap(-1, 'the scanner reads "' + source + '" left to right, grouping characters into tokens');
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === ' ') { snap(i, 'skip the space — whitespace separates tokens but isn’t one'); continue; }
    const type = typeOf(c);
    tokens.push({ type, text: c });
    snap(i, 'emit a ' + type.toUpperCase() + ' token "' + c + '"');
  }
  snap(-1, tokens.length + ' tokens — the raw text is now a clean stream the parser can read');
  return out;
}

// Bytecode VM: run `3 + 4 * 2` as stack-machine ops (postfix 3 4 2 * +). Operands
// push; operators pop two and push the result. Returns steps; last carries the value.
export function buildVm() {
  const PROG = [
    { op: 'PUSH', arg: 3 }, { op: 'PUSH', arg: 4 }, { op: 'PUSH', arg: 2 }, { op: 'MUL' }, { op: 'ADD' },
  ];
  const prog = PROG.map((p) => (p.arg !== undefined ? p.op + ' ' + p.arg : p.op));
  const out = [];
  const stack = [];
  const snap = (cur, note, result = null) => out.push({ cur, prog, stack: stack.slice(), note, result });
  snap(-1, 'the expression 3 + 4 * 2 compiled to stack-machine bytecode — operands push, operators pop two and push the result');
  PROG.forEach((ins, i) => {
    if (ins.op === 'PUSH') { stack.push(ins.arg); snap(i, 'PUSH ' + ins.arg + ' → stack [' + stack.join(', ') + ']'); }
    else {
      const b = stack.pop(), a = stack.pop(), r = ins.op === 'MUL' ? a * b : a + b;
      stack.push(r);
      snap(i, ins.op + ' → pop ' + a + ' and ' + b + ', push ' + a + (ins.op === 'MUL' ? ' × ' : ' + ') + b + ' = ' + r);
    }
  });
  snap(-1, 'one value left on the stack: 3 + 4 × 2 = ' + stack[0] + ' — × bound tighter, so it ran first', stack[0]);
  return out;
}

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

// --- DATABASE STACK (/database) ---

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

// --- MEMORY STACK (/memory) ---

// A fully-associative cache, LRU eviction. A miss loads a whole line of
// `lineSize` consecutive addresses (spatial locality), so neighbours then hit;
// an evicted line misses again (a capacity miss). Returns the access trace.
export function buildCache({ accesses = [0, 1, 2, 3, 8, 12, 16, 20, 0], lineSize = 4, ways = 4 } = {}) {
  const out = [];
  let cache = []; // block ids, least-recently-used first
  let hits = 0, misses = 0;
  const snap = (addr, block, hit, evicted, note) => out.push({ addr, block, hit, evicted, cache: cache.slice(), hits, misses, note });
  snap(null, null, null, null, 'a cache holds a few ' + lineSize + '-address lines; a miss loads a whole line, betting you will want its neighbours next');
  for (const addr of accesses) {
    const block = Math.floor(addr / lineSize);
    const idx = cache.indexOf(block);
    if (idx >= 0) {
      hits++; cache.splice(idx, 1); cache.push(block);
      snap(addr, block, true, null, 'read address ' + addr + ' → line ' + block + ' is cached → HIT');
    } else {
      misses++;
      let evicted = null;
      if (cache.length >= ways) evicted = cache.shift();
      cache.push(block);
      snap(addr, block, false, evicted,
        'read address ' + addr + ' → line ' + block + ' not cached → MISS, load it' + (evicted != null ? ' (evict line ' + evicted + ', least-recently-used)' : ''));
    }
  }
  snap(null, null, null, null, hits + ' hits, ' + misses + ' misses — one miss covers a whole line, but a line you evict has to be fetched again');
  return out;
}

// Virtual → physical address translation. A virtual address splits into a page
// number + offset; the MMU finds the physical frame via the TLB (fast) or a
// page-table walk (slow), then combines frame × pageSize + offset.
export function buildAddressTranslation({ pageBits = 4 } = {}) {
  const pageSize = 1 << pageBits;
  const table = { 0: 5, 1: 2, 2: 7, 3: 1 }; // virtual page → physical frame
  const out = [];
  const tlb = {};
  const snap = (note, o = {}) => out.push({ pageSize, table, tlb: { ...tlb }, note, ...o });
  const translate = (vaddr) => {
    const page = vaddr >> pageBits, offset = vaddr & (pageSize - 1);
    snap('virtual address ' + vaddr + ' splits into page ' + page + ' and offset ' + offset, { vaddr, page, offset });
    if (tlb[page] !== undefined) {
      const frame = tlb[page], phys = frame * pageSize + offset;
      snap('TLB hit: page ' + page + ' → frame ' + frame + ' — no page-table walk needed', { vaddr, page, offset, frame, tlbHit: true });
      snap('physical = frame ' + frame + ' × ' + pageSize + ' + offset ' + offset + ' = ' + phys, { vaddr, page, offset, frame, phys });
      return;
    }
    snap('TLB miss → walk the page table for page ' + page, { vaddr, page, offset, tlbHit: false });
    const frame = table[page];
    tlb[page] = frame;
    snap('page table: page ' + page + ' → frame ' + frame + ', and cache it in the TLB', { vaddr, page, offset, frame });
    const phys = frame * pageSize + offset;
    snap('physical = frame ' + frame + ' × ' + pageSize + ' + offset ' + offset + ' = ' + phys, { vaddr, page, offset, frame, phys });
  };
  snap('programs use virtual addresses; the MMU translates each one to a physical address');
  translate(42); // page 2, offset 10 → TLB miss, walk
  translate(40); // page 2, offset 8 → TLB hit
  return out;
}

// --- OS STACK (/os) ---

// A system call: the user/kernel boundary. User code can't touch hardware
// directly, so read() is really a TRAP that switches the CPU into kernel mode,
// runs the privileged handler, then returns. Snapshots track the mode (ring),
// so the widget can show control crossing the line and coming back.
export function buildSyscall() {
  const out = [];
  const snap = (mode, loc, note, o = {}) => out.push({ mode, loc, note, ...o });
  snap('user', 'program', 'your program runs in user mode — it cannot touch the disk directly');
  snap('user', 'program', 'it calls read(fd) — which is really a TRAP instruction, a deliberate request to the kernel');
  snap('kernel', 'trap', 'the CPU switches to kernel mode and saves the user program’s registers', { switched: true });
  snap('kernel', 'handler', 'the kernel’s syscall handler validates the arguments (is fd really open? is the buffer yours?)');
  snap('kernel', 'io', 'the kernel asks the disk for the data and blocks this process until it arrives', { blocked: true });
  snap('kernel', 'handler', 'the bytes arrive; the kernel copies them into your buffer and sets the return value');
  snap('user', 'program', 'return-from-trap: restore the saved registers, switch back to user mode', { switched: true });
  snap('user', 'program', 'your program resumes with the bytes — never having seen the disk itself');
  return out;
}

// --- DATA STRUCTURES STACK (/structures) ---

// A dynamic array (vector / ArrayList). It owns a fixed block of memory; when
// it fills, it allocates a block twice as big and copies everything over. Most
// appends are O(1); the rare doubling is O(n) but, spread out, it amortizes to
// O(1). Returns the append trace with capacity, length, and total copies made.
export function buildDynamicArray({ n = 8 } = {}) {
  const out = [];
  let cap = 1, len = 0, copies = 0;
  const snap = (note, o = {}) => out.push({ cap, len, copies, note, ...o });
  snap('a dynamic array starts with room for ' + cap + '; appending is cheap until it fills up');
  for (let i = 0; i < n; i++) {
    if (len === cap) {
      const old = cap;
      cap *= 2;
      copies += len;
      snap('append ' + i + ': full at capacity ' + old + ' → allocate ' + cap + ' and copy ' + len + ' items over', { grew: true, copiedNow: len });
    }
    len++;
    snap('append ' + i + ': room to spare → just place it (length ' + len + ' / capacity ' + cap + ')', { placed: i });
  }
  snap(n + ' appends, ' + copies + ' total copies — the doublings get rarer as it grows, so each append averages O(1)');
  return out;
}

// A hash map with separate chaining. A key is hashed to a bucket index; keys
// that collide share a bucket as a short list. Lookup hashes, then scans that
// one short chain. Returns insert + lookup snapshots with the bucket array.
export function buildHashMap({ keys = ['cat', 'dog', 'bird', 'fish', 'ant', 'bee'], buckets = 5, lookup = 'bird' } = {}) {
  const out = [];
  const table = Array.from({ length: buckets }, () => []);
  const hash = (k) => { let h = 0; for (let i = 0; i < k.length; i++) h += k.charCodeAt(i); return h % buckets; };
  const snap = (note, o = {}) => out.push({ table: table.map((b) => b.slice()), buckets, note, ...o });
  snap('a hash map turns a key into a bucket index, so lookups skip straight there instead of scanning everything');
  for (const k of keys) {
    const b = hash(k);
    const collision = table[b].length > 0;
    table[b].push(k);
    snap('insert "' + k + '": hash → bucket ' + b + (collision ? ' — already occupied, so chain it onto the bucket' : ''), { key: k, bucket: b, op: 'insert', collision });
  }
  const lb = hash(lookup);
  snap('look up "' + lookup + '": hash → bucket ' + lb + ', then scan just that chain', { key: lookup, bucket: lb, op: 'lookup' });
  const found = table[lb].includes(lookup);
  snap('bucket ' + lb + ' holds [' + table[lb].join(', ') + '] → ' + (found ? 'found "' + lookup + '" after a tiny scan, not a full sweep' : 'not present'), { key: lookup, bucket: lb, op: 'lookup', found });
  return out;
}

// --- NUMBERS STACK (/numbers) ---

// Read a fixed-width bit array as a two's-complement signed integer: the top
// bit carries a NEGATIVE place value, every other bit is positive as usual.
export function twosValue(bits) {
  const n = bits.length;
  let v = bits[0] ? -(2 ** (n - 1)) : 0;
  for (let i = 1; i < n; i++) v += bits[i] * 2 ** (n - 1 - i);
  return v;
}

// Two's complement: how a fixed width stores negatives with no minus sign.
// Negating is "flip every bit, then add 1"; the top bit ends up worth −2^(n−1),
// so +x and −x add to zero (the overflow bit falls off). Returns the trace for
// negating +5 in 4 bits, then shows the wraparound at the top of the range.
export function buildTwosComplement({ value = 5, width = 4 } = {}) {
  const out = [];
  const toBits = (v) => { const b = []; for (let i = width - 1; i >= 0; i--) b.push((v >> i) & 1); return b; };
  const snap = (bits, note, o = {}) => out.push({ bits: bits.slice(), value: twosValue(bits), note, ...o });
  snap(toBits(0), 'in ' + width + ' bits there is no minus sign — negatives are just a different reading of the same wires; the top bit is worth −' + 2 ** (width - 1));
  const pos = toBits(value);
  snap(pos, '+' + value + ' is the familiar binary ' + pos.join('') + ' (top bit 0, so it reads positive)');
  const inv = pos.map((b) => b ^ 1);
  snap(inv, 'to negate: flip every bit → ' + inv.join('') + ' (this is the ones’-complement, reading as ' + twosValue(inv) + ')');
  // add 1
  let carry = 1; const plus1 = inv.slice();
  for (let i = width - 1; i >= 0 && carry; i--) { const s = plus1[i] + carry; plus1[i] = s & 1; carry = s >> 1; }
  snap(plus1, 'then add 1 → ' + plus1.join('') + ', which reads as ' + twosValue(plus1) + ' — that is −' + value, { signBit: true });
  snap(plus1, 'check: ' + pos.join('') + ' + ' + plus1.join('') + ' overflows to 1·0000, the carry falls off the ' + width + '-bit word → 0. So +' + value + ' and −' + value + ' really cancel.');
  const maxBits = toBits((2 ** (width - 1)) - 1);
  snap(maxBits, 'the catch: the range is −' + 2 ** (width - 1) + '…' + ((2 ** (width - 1)) - 1) + '. Here is the largest, +' + twosValue(maxBits) + ' = ' + maxBits.join(''));
  let c = 1; const wrap = maxBits.slice();
  for (let i = width - 1; i >= 0 && c; i--) { const s = wrap[i] + c; wrap[i] = s & 1; c = s >> 1; }
  snap(wrap, 'add 1 and it wraps to ' + wrap.join('') + ' = ' + twosValue(wrap) + ' — overflow silently flips the biggest positive to the most negative', { signBit: true, overflow: true });
  return out;
}

// The float "grid": with a fixed mantissa, the gap between representable values
// DOUBLES every octave (it scales with the exponent). So floats are dense near
// zero and sparse far from it. Uses the toy 8-bit float; returns the list of
// representable positive values plus per-octave snapshots showing the gap grow.
export function buildFloatGrid() {
  const values = [];
  for (let e = 0; e < 15; e++) for (let m = 0; m < 8; m++) {
    const { value } = decodeMiniFloat([0, (e >> 3) & 1, (e >> 2) & 1, (e >> 1) & 1, e & 1, (m >> 2) & 1, (m >> 1) & 1, m & 1]);
    if (Number.isFinite(value) && value > 0 && value <= 8) values.push(value);
  }
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  const out = [];
  const snap = (lo, hi, gap, note) => out.push({ values: sorted, lo, hi, gap, note });
  snap(0, 8, null, 'every dot is a value this float can represent exactly. Notice they bunch up near 0 and thin out toward 8 — the grid is not evenly spaced');
  for (const [lo, hi] of [[0.5, 1], [1, 2], [2, 4], [4, 8]]) {
    const inOct = sorted.filter((v) => v >= lo && v < hi);
    const gap = inOct.length > 1 ? +(inOct[1] - inOct[0]).toFixed(6) : null;
    snap(lo, hi, gap, 'between ' + lo + ' and ' + hi + ' the step is ' + gap + ' — each octave the gap doubles, because the exponent scales the whole number');
  }
  snap(0, 8, null, 'so most real numbers fall between the dots and get rounded to the nearest one — the further from zero, the coarser the rounding');
  return out;
}

// Why 0.1 + 0.2 ≠ 0.3. Tenths don't divide a power of two, so 0.1 and 0.2 each
// round to the nearest double (a hair too big); their sum rounds again, landing
// on a double just past 0.3 — which is itself a *different* double. Values are
// taken live from JS doubles so the trace is exactly what the hardware does.
export function buildFloatSum() {
  const p = (x) => Number(x).toPrecision(17);
  const out = [];
  const snap = (note, o = {}) => out.push({ note, ...o });
  snap('we type 0.1, but base-2 can’t write a tenth exactly — like 1/3 in decimal, it repeats forever, so it must be rounded to fit');
  snap('the nearest double to 0.1 is actually a touch too big', { label: '0.1', stored: p(0.1) });
  snap('the nearest double to 0.2 is too big as well', { label: '0.2', stored: p(0.2) });
  snap('add them and the result rounds again, landing just past three-tenths', { label: '0.1 + 0.2', stored: p(0.1 + 0.2), highlight: true });
  snap('but writing 0.3 directly rounds to a *different* double, just under', { label: '0.3', stored: p(0.3), highlight: true });
  snap('so 0.1 + 0.2 === 0.3 is ' + (0.1 + 0.2 === 0.3) + ' — not a bug, just two roundings that don’t meet', { equal: 0.1 + 0.2 === 0.3 });
  return out;
}

// --- SILICON STACK (/silicon) ---

// Doping: pure silicon shares all four of its outer electrons in bonds, so it
// has almost no free charge to carry current. Mixing in a trace of another
// element changes that: a donor (n-type) brings a spare electron; an acceptor
// (p-type) leaves a "hole" — a missing electron that drifts like a + charge.
export const DOPING = {
  pure: { label: 'pure silicon', dopant: 'none', carrier: 'almost none', charge: 0, conductive: false, note: 'every silicon atom shares its 4 outer electrons in bonds — there’s little free charge, so a pure crystal barely conducts' },
  n: { label: 'n-type', dopant: 'phosphorus (5 outer electrons)', carrier: 'free electrons', charge: -1, conductive: true, note: 'phosphorus has 5 outer electrons; 4 fill the bonds and the 5th is left free to roam — negative carriers, hence n-type' },
  p: { label: 'p-type', dopant: 'boron (3 outer electrons)', carrier: 'holes', charge: 1, conductive: true, note: 'boron has only 3 outer electrons, so each leaves a missing bond — a "hole" that drifts like a positive carrier, hence p-type' },
};

// A PN-junction diode: bond a p-type region to an n-type one. At the boundary,
// free electrons fill nearby holes, leaving a carrier-free "depletion region"
// that blocks current. A forward bias (push from the p side) collapses it and
// current flows; a reverse bias widens it and blocks — a one-way valve.
export function buildDiode() {
  const out = [];
  const snap = (bias, conducts, depletion, note) => out.push({ bias, conducts, depletion, note });
  snap('none', false, 'normal', 'a diode joins a p-type region (holes) to an n-type region (free electrons) — watch what happens at the boundary');
  snap('none', false, 'normal', 'at rest, electrons near the junction fall into nearby holes, leaving a carrier-free depletion region that blocks current');
  snap('forward', true, 'narrow', 'forward bias: + to the p side pushes carriers toward the junction, the depletion region collapses → current flows');
  snap('reverse', false, 'wide', 'reverse bias: flip the battery and carriers are pulled away, the depletion region widens → current is blocked');
  snap('none', false, 'normal', 'so a PN junction passes current one way and blocks the other — that is a diode; add a third terminal to control the channel and you get a transistor');
  return out;
}

// A CMOS inverter (a NOT gate from two transistors): a p-type FET pulls the
// output up to HIGH, an n-type FET pulls it down to LOW, and their gates are
// tied to the same input. Exactly one conducts, so output is always the
// opposite of input — and almost no current flows straight through while idle.
export function cmosInverter(input) {
  const pmos = input === 0; // pMOS conducts when its gate is LOW
  const nmos = input === 1; // nMOS conducts when its gate is HIGH
  return { input, pmos, nmos, output: pmos && !nmos ? 1 : 0, path: pmos ? 'pull-up to HIGH' : 'pull-down to LOW' };
}

// --- CPU STACK (/cpu) ---

// The ALU: the CPU's calculator. An opcode selects one operation over two 8-bit
// inputs; the result wraps at 8 bits and sets condition flags (Z = zero result,
// C = carry/borrow out) that branches later read. Pure — drives the widget.
export const ALU_OPS = ['ADD', 'SUB', 'AND', 'OR', 'XOR'];
export function computeAlu(op, a, b) {
  a &= 0xff; b &= 0xff;
  let raw, carry = 0;
  switch (op) {
    case 'ADD': raw = a + b; carry = raw > 0xff ? 1 : 0; break;
    case 'SUB': raw = a - b; carry = a < b ? 1 : 0; break; // carry = borrow
    case 'AND': raw = a & b; break;
    case 'OR': raw = a | b; break;
    case 'XOR': raw = a ^ b; break;
    default: raw = 0;
  }
  const result = raw & 0xff;
  return { op, a, b, result, carry, zero: result === 0 ? 1 : 0 };
}

// Pipelining: a classic 5-stage pipeline (IF·ID·EX·MEM·WB). Unpipelined, each
// instruction runs all five stages before the next begins (5 cycles each).
// Pipelined, a new instruction enters every cycle, so the stages overlap like
// a production line. Returns one snapshot per clock cycle, each carrying every
// instruction's current stage, so the widget can fill the diagram diagonally.
export const PIPE_STAGES = ['IF', 'ID', 'EX', 'MEM', 'WB'];
export function buildPipeline({ instructions = ['lw', 'add', 'sub', 'and', 'or'], pipelined = true } = {}) {
  const n = instructions.length, S = PIPE_STAGES.length;
  const start = (i) => (pipelined ? i : i * S); // cycle an instruction enters IF
  const total = pipelined ? n + S - 1 : n * S; // total cycles to drain
  const out = [];
  const stageAt = (i, c) => { const s = c - start(i); return s >= 0 && s < S ? s : null; };
  const snap = (cycle, note) => {
    const lanes = instructions.map((ins, i) => ({ ins, stage: stageAt(i, cycle) }));
    const done = instructions.filter((_, i) => cycle - start(i) >= S).length;
    out.push({ cycle, lanes, done, total, pipelined, stages: PIPE_STAGES, note });
  };
  snap(-1, pipelined
    ? 'pipelined: a new instruction enters the pipe every cycle, so all five stages stay busy at once'
    : 'unpipelined: each instruction finishes all five stages before the next one starts');
  for (let c = 0; c < total; c++) {
    const entering = instructions.findIndex((_, i) => start(i) === c);
    const finishing = instructions.findIndex((_, i) => c - start(i) === S - 1);
    let note = 'cycle ' + (c + 1);
    if (entering >= 0) note = 'cycle ' + (c + 1) + ': "' + instructions[entering] + '" enters the pipeline (IF)';
    if (finishing >= 0) note = 'cycle ' + (c + 1) + ': "' + instructions[finishing] + '" reaches WB and retires';
    snap(c, note);
  }
  snap(total, n + ' instructions in ' + total + ' cycles' + (pipelined ? ' — vs ' + n * S + ' unpipelined: same work, far less idle silicon' : ' — every stage sat idle 4 of every 5 cycles'));
  return out;
}

// --- CONCURRENCY STACK (/concurrency) ---

// Deadlock: two threads, two locks, taken in OPPOSITE orders. A holds L1 and
// waits for L2; B holds L2 and waits for L1 — a circular wait neither can break.
// The fix is a lock ordering: if everyone takes L1 before L2, the cycle can't
// form. Returns the trace; `ordered` switches between the bug and the fix.
export function buildDeadlock({ ordered = false } = {}) {
  const out = [];
  let l1 = null, l2 = null, aWait = null, bWait = null, deadlocked = false, done = false;
  const holds = (t) => [l1 === t && 'L1', l2 === t && 'L2'].filter(Boolean);
  const snap = (note) => out.push({ l1, l2, aHolds: holds('A'), bHolds: holds('B'), aWait, bWait, deadlocked, done, ordered, note });
  if (!ordered) {
    snap('two threads, two locks. Thread A needs L1 then L2; Thread B needs them in the OPPOSITE order, L2 then L1');
    l1 = 'A'; snap('A takes L1');
    l2 = 'B'; snap('B takes L2');
    aWait = 'L2'; snap('A now wants L2 — but B holds it, so A blocks');
    bWait = 'L1'; snap('B now wants L1 — but A holds it, so B blocks');
    deadlocked = true; snap('deadlock: A waits on L2, B waits on L1, and neither will let go — a circular wait, frozen forever');
  } else {
    snap('the fix is a lock ordering: EVERY thread must take L1 before L2, no exceptions');
    l1 = 'A'; snap('A takes L1 first');
    bWait = 'L1'; snap('B also wants L1 first, but A holds it → B just waits its turn (no cycle)');
    l2 = 'A'; snap('A takes L2 — it holds both and can finish its work');
    l1 = null; l2 = null; snap('A releases both locks');
    bWait = null; l1 = 'B'; snap('now B takes L1…');
    l2 = 'B'; snap('…then L2, and finishes too');
    l1 = null; l2 = null; done = true; snap('no cycle can ever form when everyone locks in the same order — the deadlock is impossible');
  }
  return out;
}

// Lock-free increment via compare-and-swap. CAS(expected → new) is one atomic
// instruction: it writes only if the value still equals `expected`, else fails.
// Two threads race; the loser's CAS fails (nothing is corrupted) and it simply
// retries from a fresh read. Both increments land, with no lock ever held.
export function buildCas() {
  const out = [];
  let counter = 0;
  const snap = (note, o = {}) => out.push({ counter, actor: o.actor ?? null, old: o.old ?? null, expected: o.expected ?? null, newval: o.newval ?? null, cas: o.cas ?? null, note });
  snap('a lock-free increment: read the value, then atomically compare-and-swap — write only if it still matches, otherwise retry');
  snap('A reads counter = 0', { actor: 'A', old: 0 });
  snap('B reads counter = 0 too — the same stale read that caused the race', { actor: 'B', old: 0 });
  counter = 1; snap('A: CAS(expected 0 → 1). counter is 0, matches → swap succeeds, counter = 1', { actor: 'A', expected: 0, newval: 1, cas: 'ok' });
  snap('B: CAS(expected 0 → 1). counter is 1, ≠ 0 → the swap FAILS — B lost the race, but nothing is corrupted', { actor: 'B', expected: 0, newval: 1, cas: 'fail' });
  snap('B retries: it re-reads counter = 1', { actor: 'B', old: 1 });
  counter = 2; snap('B: CAS(expected 1 → 2). counter is 1, matches → swap succeeds, counter = 2', { actor: 'B', expected: 1, newval: 2, cas: 'ok' });
  snap('counter = 2 ✓ — both increments counted and no lock was ever held; the loser just tried again');
  return out;
}

// --- CLOUD STACK (/cloud) ---

// A load balancer: one public address spreading requests across a pool of app
// servers (round-robin), skipping any that fail a health check and picking
// them back up when they recover. Returns the trace; each request snapshot
// carries the target and every server's running load, so no request is lost.
export function buildLoadBalancer() {
  const servers = [{ id: 'S1', healthy: true, load: 0 }, { id: 'S2', healthy: true, load: 0 }, { id: 'S3', healthy: true, load: 0 }];
  let rr = 0, served = 0;
  const out = [];
  const snap = (target, event, note) => out.push({ servers: servers.map((s) => ({ ...s })), target, event, served, note });
  const route = (label) => {
    for (let k = 0; k < servers.length; k++) {
      const i = (rr + k) % servers.length;
      if (servers[i].healthy) { rr = (i + 1) % servers.length; servers[i].load++; served++; snap(servers[i].id, null, label + ' → ' + servers[i].id); return; }
    }
    snap(null, null, label + ' → no healthy server!');
  };
  const setHealth = (id, healthy, note) => { servers.find((s) => s.id === id).healthy = healthy; snap(null, healthy ? 'recover' : 'crash', note); };
  snap(null, null, 'one public address, three identical app servers behind it — the balancer spreads requests round-robin so no server is overwhelmed');
  route('request 1'); route('request 2'); route('request 3');
  setHealth('S2', false, 'S2 stops answering health checks → the balancer marks it DOWN and routes around it');
  route('request 4'); route('request 5'); route('request 6');
  setHealth('S2', true, 'S2 passes health checks again → the balancer adds it back to the pool');
  route('request 7');
  snap(null, null, served + ' requests served, spread across the healthy servers — and not one was dropped when S2 went down');
  return out;
}

// Read replicas: writes go to the primary; reads can be served by replicas to
// share load — but replication has lag, so a read during the gap sees STALE
// data. The replicas converge afterwards. This is eventual consistency, and the
// reason "read your own write" isn't guaranteed unless you read the primary.
export function buildReplication() {
  const out = [];
  let primary = 0;
  const replicas = [{ id: 'R1', v: 0 }, { id: 'R2', v: 0 }];
  const snap = (action, note, o = {}) => out.push({ primary, replicas: replicas.map((r) => ({ ...r })), action, note, readFrom: o.readFrom ?? null, readValue: o.readValue ?? null, stale: !!o.stale });
  snap('idle', 'one primary takes all writes; two replicas serve reads to spread the load. Everyone starts at x = 0');
  primary = 1; snap('write', 'WRITE x = 1 lands on the primary → primary is now 1, but the replicas haven’t heard yet');
  snap('read', 'a READ routed to replica R1 right now returns x = 0 — STALE, because replication hasn’t caught up', { readFrom: 'R1', readValue: 0, stale: true });
  replicas.forEach((r) => { r.v = primary; }); snap('replicate', 'the primary streams the change; R1 and R2 catch up to x = 1 (this lag is usually milliseconds)');
  snap('read', 'the same READ from R1 now returns x = 1 — fresh, once the replica converged', { readFrom: 'R1', readValue: 1, stale: false });
  snap('idle', 'this is eventual consistency: replicas converge, but a read in the gap sees stale data — strong consistency means reading the primary, giving up some of the scaling');
  return out;
}
