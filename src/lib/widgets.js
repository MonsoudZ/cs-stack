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
