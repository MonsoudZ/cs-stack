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
