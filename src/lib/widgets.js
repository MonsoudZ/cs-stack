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

// Sockets: a connection endpoint is an IP + a port. A server listens on one
// port (443), yet serves thousands of clients at once — the OS tells the
// connections apart by the full 4-tuple (client ip:port ↔ server ip:port) and
// demultiplexes each arriving packet to the right socket. Returns the trace.
export function buildSockets() {
  const SERVER = '203.0.113.5:443';
  const conns = [
    { id: 'A', client: '198.51.100.7:51000' },
    { id: 'B', client: '198.51.100.9:48210' },
    { id: 'C', client: '203.0.113.8:55343' },
  ];
  const out = [];
  const snap = (note, o = {}) => out.push({ server: SERVER, conns, packet: o.packet ?? null, routedTo: o.routedTo ?? null, note });
  snap('a socket is one endpoint: an IP and a port. The server listens on ' + SERVER + ' — but every client gets its own connection');
  snap('the OS keeps a table of open connections, each identified by the full 4-tuple (client ip:port ↔ server ip:port)');
  for (const [from, id] of [['198.51.100.7:51000', 'A'], ['198.51.100.9:48210', 'B'], ['198.51.100.7:51000', 'A'], ['203.0.113.8:55343', 'C']]) {
    snap('a packet arrives for :443 from ' + from + ' → match the 4-tuple → deliver to connection ' + id, { packet: from, routedTo: id });
  }
  snap('same server port for all of them — the port doesn’t identify the connection, the 4-tuple does. That’s how one :443 handles thousands at once');
  return out;
}

// HTTP: the application protocol the two ends speak once connected — plain text,
// request then response. The client sends a method + path + headers; the server
// replies with a status code + headers + body. Stateless: one exchange stands
// alone. Returns the line-by-line trace of a GET that returns 200.
export function buildHttp() {
  const out = [];
  const snap = (side, line, note, o = {}) => out.push({ side, line, note, status: o.status ?? null, done: !!o.done });
  snap(null, null, 'connected, the two ends speak HTTP: the client sends a request, the server sends a response — just text over the socket');
  snap('client', 'GET /cases/42 HTTP/1.1', 'the request line: a method (GET), a path, and the protocol version');
  snap('client', 'Host: api.thestack.dev', 'headers describe the request — Host says which site (one IP can serve many)');
  snap('client', 'Accept: application/json', 'and what the client wants back. A blank line ends the request');
  snap('server', '200 OK', 'the server processes it and replies with a status code — 200 means success (404 not found, 500 server error)', { status: 200 });
  snap('server', 'Content-Type: application/json', 'response headers describe the body that follows');
  snap('server', '{ "id": 42, "title": "…" }', 'then the body — the actual data the client asked for', { done: true });
  snap(null, null, 'method + path + headers in, status + headers + body out — one stateless exchange, the protocol the whole web runs on');
  return out;
}

// TCP connection setup & congestion control. First the 3-way handshake
// (SYN / SYN-ACK / ACK) opens the connection in one round-trip. Then the sender
// probes for bandwidth: the congestion window cwnd doubles each round-trip in
// SLOW START until it hits ssthresh, then grows by one per RTT in CONGESTION
// AVOIDANCE. A loss halves ssthresh and drops cwnd to it (AIMD's multiplicative
// decrease) — the classic TCP sawtooth. Returns the step trace.
export function buildTcp() {
  const out = [];
  let cwnd = 0, ssthresh = 8, rtt = 0, phase = 'handshake';
  const snap = (note, o = {}) => out.push({
    phase, cwnd, ssthresh, rtt,
    established: o.established ?? (phase !== 'handshake'),
    event: o.event ?? null, lost: !!o.lost, note,
  });
  snap('SYN →  the client asks to open a connection, proposing a starting sequence number.', { established: false, event: 'SYN' });
  snap('←  SYN-ACK   the server agrees, acknowledges, and sends its own sequence number.', { established: false, event: 'SYN-ACK' });
  snap('ACK →  the client acknowledges back. Three messages, one round-trip — the connection is open.', { established: false, event: 'ACK' });
  phase = 'slow start'; cwnd = 1; rtt = 1;
  snap('start cautiously: congestion window cwnd = 1 segment. Send it, wait for the ack.');
  while (cwnd < ssthresh) {
    rtt++; cwnd *= 2;
    snap('SLOW START: each round-trip of acks doubles cwnd → ' + cwnd + ' (exponential — find the ceiling fast). ssthresh = ' + ssthresh + '.');
  }
  phase = 'congestion avoidance';
  for (let k = 0; k < 2; k++) { rtt++; cwnd += 1;
    snap('cwnd hit ssthresh → CONGESTION AVOIDANCE: now grow by only +1 per round-trip → cwnd = ' + cwnd + ' (careful, linear).');
  }
  rtt++; const before = cwnd; ssthresh = Math.floor(cwnd / 2); cwnd = ssthresh; phase = 'loss';
  snap('a packet is LOST (a missing ack) → back off hard: ssthresh = ' + before + '/2 = ' + ssthresh + ', cwnd drops to ' + cwnd + '. That is AIMD’s multiplicative decrease.', { event: 'loss', lost: true });
  phase = 'congestion avoidance';
  for (let k = 0; k < 2; k++) { rtt++; cwnd += 1;
    snap('climb again, +1 per RTT → cwnd = ' + cwnd + '. Up slowly, down sharply: that repeating sawtooth is TCP sharing the link.');
  }
  snap('additive increase, multiplicative decrease — TCP keeps nudging cwnd up until loss, then halves, finding a fair rate without ever being told the link’s capacity.');
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

// Parsing → AST: the same tokens `3 + 4 * 2` parse into two different trees.
// With precedence, × binds tighter, so it sits deeper and reduces first → 11.
// A naive left-to-right parse nests + deeper, reducing it first → 14. Stepping
// either tree reduces it bottom-up (deepest operator first), showing that depth
// on the tree *is* the order of evaluation. `leftToRight` switches the parse.
export function buildAst({ leftToRight = false } = {}) {
  let nid = 0;
  const num = (v) => ({ id: nid++, kind: 'num', text: String(v), value: v });
  const op = (o, l, r) => ({ id: nid++, kind: 'op', text: o, op: o, l, r });
  // 3 + 4 * 2 — precedence puts × deeper; left-to-right puts + deeper.
  const tree = leftToRight
    ? op('×', op('+', num(3), num(4)), num(2))
    : op('+', num(3), op('×', num(4), num(2)));
  const out = [];
  const clone = (n) => (n.kind === 'num' ? { ...n } : { ...n, l: clone(n.l), r: clone(n.r) });
  const tagged = (root, activeId) => {
    const c = clone(root);
    const mark = (x) => { x.active = x.id === activeId; if (x.kind === 'op') { mark(x.l); mark(x.r); } };
    mark(c);
    return c;
  };
  const snap = (root, note, activeId = null) => out.push({ leftToRight, tree: tagged(root, activeId), note });
  // deepest reducible operator (both children already numbers), leftmost first
  const reducible = (n) => {
    if (n.kind !== 'op') return null;
    return reducible(n.l) || reducible(n.r) || (n.l.kind === 'num' && n.r.kind === 'num' ? n : null);
  };
  const replace = (n, targetId, repl) => {
    if (n.id === targetId) return repl;
    if (n.kind === 'op') return { ...n, l: replace(n.l, targetId, repl), r: replace(n.r, targetId, repl) };
    return n;
  };
  const summary = leftToRight
    ? 'parsed strictly left to right, 3 + 4 * 2 comes out as (3 + 4) × 2 = 14 — the “wrong” answer arithmetic conventions avoid. this is exactly why grammars bake in precedence, so × always sits deeper than +.'
    : '3 + 4 * 2 = 11. because × binds tighter it sat deeper and reduced first; a left-to-right parse would give (3 + 4) × 2 = 14 instead. the shape of the tree is the precedence.';
  snap(tree, leftToRight
    ? 'the same tokens, but parsed strictly left to right: + nests deeper than ×, so 3 + 4 will reduce first. depth on the tree is the order of evaluation.'
    : 'the parser used precedence: × binds tighter than +, so it sits deeper in the tree and reduces first. depth encodes precedence.');
  let root = tree;
  while (root.kind === 'op') {
    const node = reducible(root);
    snap(root, `reduce the deepest operator: ${node.l.text} ${node.text} ${node.r.text}.`, node.id);
    const result = node.op === '×' ? node.l.value * node.r.value : node.l.value + node.r.value;
    const folded = num(result);
    root = replace(root, node.id, folded);
    const note = root.kind === 'num' ? summary : `${node.l.text} ${node.text} ${node.r.text} = ${result} — that subtree collapses to a single value.`;
    snap(root, note, folded.id);
  }
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

// Running it: interpret, AOT-compile, or JIT. Run the same hot loop body N times
// under each strategy and accumulate cost (abstract time units). The interpreter
// pays a per-iteration cost forever; AOT pays a big upfront compile then runs
// native-cheap; the JIT interprets until the loop turns "hot", compiles it once,
// then runs native. Stepping advances the iteration count through milestones so
// the crossovers show: interpreter wins cold, JIT bends down after warmup, AOT
// wins the long run. Pure: returns one snapshot per milestone.
export const RUNTIME_STRATEGIES = ['interpreter', 'AOT compiler', 'JIT'];
export function buildRuntimes() {
  const MILESTONES = [1, 5, 10, 20, 50, 100];
  const C_INTERP = 10, C_NATIVE = 1, AOT_STARTUP = 30, HOT = 10, JIT_COMPILE = 25;
  const interp = (n) => C_INTERP * n;
  const aot = (n) => AOT_STARTUP + C_NATIVE * n;
  const jit = (n) => (n <= HOT ? C_INTERP * n : C_INTERP * HOT + JIT_COMPILE + C_NATIVE * (n - HOT));
  const notes = [
    'one call: the interpreter wins outright — there’s no compiler to run first. AOT already spent 30 compiling the whole program and hasn’t broken even.',
    'a few calls in, AOT’s upfront compile is nearly amortised. the JIT is still interpreting — warming up, watching for a hot path.',
    'the loop just turned hot: the JIT compiles it to native code now (a one-time cost), while AOT is already far ahead of the interpreter.',
    'past warmup the JIT runs native too — its cost line bends flat and it overtakes the interpreter. AOT still leads on total time.',
    'the interpreter re-does the same decoding every iteration; the compiled strategies barely grow.',
    'over a long run both compiled strategies crush the interpreter. AOT wins raw total; the JIT trades a little warmup to avoid compiling ahead of time — and stays portable.',
  ];
  return MILESTONES.map((n, i) => {
    const rows = [
      { name: 'interpreter', cost: interp(n), native: false },
      { name: 'AOT compiler', cost: aot(n), native: true },
      { name: 'JIT', cost: jit(n), native: n > HOT },
    ];
    const lead = rows.reduce((a, b) => (b.cost < a.cost ? b : a)).name;
    return { iters: n, rows, lead, note: notes[i] };
  });
}

// Type checking (semantic analysis): after parsing, walk the AST bottom-up and
// infer a type for every node, checking each operator's operands. A well-typed
// expression yields a type; an ill-typed one (here, string × int) is rejected
// before any code is generated. `buggy` switches between the two programs.
export function buildTypeCheck({ buggy = false } = {}) {
  const out = [];
  const checked = [];
  const expr = buggy ? '1 + "hi" * 3' : '1 + 2 * 3';
  const snap = (note, o = {}) => out.push({ expr, checked: checked.slice(), errored: !!o.errored, ok: !!o.ok, note });
  const add = (e, type, note, o = {}) => { checked.push({ expr: e, type, error: o.error || null }); snap(note, o); };
  snap('parsing produced a tree; now infer a type for each node, leaves first, and check every operator’s operands');
  if (!buggy) {
    add('1', 'int', 'literal 1 → int');
    add('2', 'int', 'literal 2 → int');
    add('3', 'int', 'literal 3 → int');
    add('2 * 3', 'int', '2 * 3 → int × int = int ✓');
    add('1 + 2 * 3', 'int', '1 + (2 * 3) → int + int = int ✓');
    snap('the whole expression is well-typed (int) — safe to lower to bytecode', { ok: true });
  } else {
    add('1', 'int', 'literal 1 → int');
    add('"hi"', 'string', 'literal "hi" → string');
    add('3', 'int', 'literal 3 → int');
    add('"hi" * 3', '⊥', '"hi" * 3 → string × int — TYPE ERROR: * needs two numbers', { errored: true, error: '* expects numbers, got string × int' });
    snap('type checking fails, so the compiler rejects the program before generating a single instruction — the bug never reaches the CPU', { errored: true });
  }
  return out;
}

// Scope resolution (the other half of semantic analysis). A name like `x`
// doesn't carry its meaning — the resolver binds each reference to a declaration
// by looking in the current scope, then walking outward through enclosing scopes
// (lexical scoping) until it finds one. Inner declarations shadow outer ones;
// a name found nowhere is an "undefined name" error caught at compile time.
// Scopes here nest linearly: global ⊃ function f ⊃ inner block. Each snapshot
// resolves one reference and records the `path` walked, the `foundIn` scope (or
// null), and how many `hops` outward it took. Pure.
export function buildScopes() {
  const scopes = [
    { id: 'global', label: 'global', symbols: ['x', 'f'] },
    { id: 'f', label: 'function f(y)', symbols: ['y', 'z'] },
    { id: 'block', label: 'inner { }', symbols: ['x'] },
  ];
  const order = scopes.map((s) => s.id); // outermost → innermost
  // resolve `name` starting in `from`, walking outward (innermost → outermost)
  const resolve = (name, from) => {
    const path = [];
    let i = order.indexOf(from);
    for (; i >= 0; i--) {
      const sc = scopes[i];
      path.push(sc.id);
      if (sc.symbols.includes(name)) return { path, foundIn: sc.id };
    }
    return { path, foundIn: null };
  };
  const lookups = [
    { name: 'x', from: 'f', code: 'z = x + y', note: 'resolving x inside f: it isn’t declared here, so walk outward to global — found. (1 hop)' },
    { name: 'y', from: 'f', code: 'z = x + y', note: 'y is f’s parameter, declared right here — found in the current scope, no walk needed.' },
    { name: 'x', from: 'block', code: 'print(x + z)', note: 'the inner block declares its own x, so x binds to that one — it shadows the global x. the nearest declaration wins.' },
    { name: 'z', from: 'block', code: 'print(x + z)', note: 'z isn’t in the block; walk out to f, where it’s declared. inner scopes can see outer names, but not the reverse.' },
    { name: 'w', from: 'f', code: 'print(w)', note: 'w is declared nowhere on the chain — walk f → global, hit the top, and fail. that’s an “undefined name”, caught now instead of at runtime.' },
  ];
  const out = [{
    scopes, name: null, from: null, code: null, path: [], foundIn: null, hops: null,
    note: 'a name doesn’t carry its meaning — the resolver binds each reference to a declaration, searching the current scope first, then each enclosing scope outward.',
  }];
  for (const lk of lookups) {
    const { path, foundIn } = resolve(lk.name, lk.from);
    out.push({ scopes, name: lk.name, from: lk.from, code: lk.code, path, foundIn, hops: foundIn ? path.length - 1 : null, note: lk.note });
  }
  return out;
}

// Optimization: meaning-preserving rewrites that make a program do less work
// for the identical result. Walk a tiny program through the classic passes —
// constant folding, algebraic simplification, common-subexpression elimination,
// dead-code elimination, and copy/constant propagation — until five lines and a
// dead branch collapse to `return 16` (the same answer the original computed).
// Each line carries a `mark`: 'change' (rewritten this pass) or 'cut' (about to
// be removed, shown struck through, gone next pass). Two costs shrink alongside:
// `lines` (instructions left) and `ops` (arithmetic done at runtime).
export function buildOptimize() {
  const out = [];
  const L = (text, mark = '') => ({ text, mark });
  const snap = (pass, lines, note) => {
    const live = lines.filter((l) => l.mark !== 'cut');
    const ops = live.reduce((n, l) => n + (l.text.match(/[+*]/g) || []).length, 0);
    out.push({ pass, note, lines: lines.map((l) => ({ ...l })), linesLeft: live.length, ops });
  };
  snap(null,
    [L('t = 4 * 2'), L('a = t + 0'), L('b = t + 0'), L('if (false): log(99)'), L('return a + b')],
    'straightforward code generation is correct but wasteful: constants recomputed at runtime, identities left in, a branch that can never run. each pass rewrites the program to do less while computing the identical result.');
  snap('constant folding',
    [L('t = 8', 'change'), L('a = t + 0'), L('b = t + 0'), L('if (false): log(99)'), L('return a + b')],
    '4 * 2 has only constant operands, so evaluate it now, at compile time: t = 8. that multiply never has to happen while the program runs.');
  snap('algebraic simplification',
    [L('t = 8'), L('a = t', 'change'), L('b = t', 'change'), L('if (false): log(99)'), L('return a + b')],
    'x + 0 is always just x, so the two additions are pure overhead — drop them. a and b are now plain copies of t.');
  snap('common-subexpression elimination',
    [L('t = 8'), L('a = t'), L('b = t', 'cut'), L('if (false): log(99)'), L('return a + a', 'change')],
    'a and b compute the exact same value — no point doing it twice. keep a, rewrite every use of b as a, and the b = t line is now dead.');
  snap('dead-code elimination',
    [L('t = 8'), L('a = t'), L('if (false): log(99)', 'cut'), L('return a + a')],
    'the branch is guarded by a constant false, so it can never execute — the whole block is unreachable and is removed.');
  snap('copy & constant propagation',
    [L('t = 8', 'cut'), L('a = t', 'cut'), L('return 16', 'change')],
    'a = t and t = 8, so a is simply 8 everywhere — substitute it in to get return 8 + 8, then fold once more to return 16. t and a are now unused, so they go too.');
  snap('done',
    [L('return 16')],
    'five lines and a dead branch collapsed to a single constant. it prints the same answer the original did — the optimizer only ever removes work, never changes meaning.');
  return out;
}

// SSA & register allocation (the compiler back end). A program's values must
// live in the CPU's handful of registers. First the compiler rewrites into SSA:
// every assignment creates a new, single-definition value, so each value's live
// range (definition → last use) is unambiguous. Then it allocates — values live
// at the same time need different registers, and when more are live at once than
// the machine has registers, one is "spilled" to a stack slot (stored, then
// reloaded: correct but slower). Here 4 SSA values contend for 2 registers, so
// one spills. Pure: one snapshot per step. Each value carries its live interval
// [from,to], its assigned `reg`, a `spilled` flag, and a transient `nofit` flag
// for the value that just failed to get a register.
export const REG_COUNT = 2;
export function buildRegisters() {
  const cols = 5;
  const V = (name, from, to, o = {}) => ({ name, from, to, reg: o.reg ?? null, spilled: !!o.spilled, nofit: !!o.nofit });
  const original = ['a = 1', 'a = a + 4', 'b = 2', 'c = 3', 'return a + b + c'].map((t) => ({ text: t, hl: false }));
  const ssa = [
    { text: 'a₁ = 1', hl: true }, { text: 'a₂ = a₁ + 4', hl: true },
    { text: 'b = 2', hl: false }, { text: 'c = 3', hl: false }, { text: 'return a₂ + b + c', hl: true },
  ];
  const live = () => [V('a₁', 1, 2), V('a₂', 2, 5), V('b', 3, 5), V('c', 4, 5)];
  const allocated = (cReg) => [
    V('a₁', 1, 2, { reg: 'R0' }), V('a₂', 2, 5, { reg: 'R0' }), V('b', 3, 5, { reg: 'R1' }),
    V('c', 4, 5, cReg),
  ];
  const out = [];
  const snap = (o) => out.push({ cols, regCount: REG_COUNT, showPressure: false, program: ssa, ...o });
  snap({
    program: original, values: [],
    note: 'a CPU has only a handful of registers — the fast slots arithmetic actually runs on. before handing them out, the compiler rewrites into SSA: the name a is assigned twice, so split it into two single-definition values.',
  });
  snap({
    values: live(),
    note: 'in SSA every value is defined exactly once, so its live range — definition to last use — is unambiguous: a₁ lives lines 1–2, a₂ lines 2–5, b lines 3–5, c lines 4–5.',
  });
  snap({
    values: live(), showPressure: true,
    note: 'count the values live at each line. at the return, a₂, b and c are all live at once — pressure 3 — but the machine has only 2 registers. something has to give.',
  });
  snap({
    values: allocated({ nofit: true }), showPressure: true,
    note: 'allocate in definition order: a₁ takes R0; a₁ dies on line 2, so a₂ reuses R0; b takes R1. now c is defined — but R0 and R1 are both held by values still in use, so c can’t get a register.',
  });
  snap({
    values: allocated({ spilled: true }), showPressure: true,
    note: 'so c is spilled to a stack slot: stored after it’s computed, then loaded back for the add. register pressure drops to 2 and the code is correct — it just pays extra memory traffic for that one value.',
  });
  snap({
    values: allocated({ spilled: true }), showPressure: true,
    note: 'two registers served four values over time (R0 held a₁, then a₂), and only the value that couldn’t fit lives in memory. fewer registers ⇒ more spills ⇒ slower code — which is why register allocation is one of the last and trickiest compiler passes.',
  });
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
  snap('micro', 'the microtask queue is empty; a frame is due (~16ms have passed), so the loop heads into rendering');
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
      : 'REPEATABLE READ hands T1 a stable snapshot: every read returns 100, no anomaly — this is what MVCC buys, at the cost of keeping old row versions around';
  snap(verdict);
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

// Path resolution in a filesystem. A path is a chain of directory lookups: a
// directory is just a file that maps names → inode numbers; an inode holds a
// file's metadata and the list of disk blocks its bytes actually live in. To
// open /docs/notes.txt the kernel walks root → docs → notes.txt, inode by inode.
export const FS = {
  2: { type: 'dir', name: '/', entries: { docs: 7, 'readme.txt': 4 } },
  7: { type: 'dir', name: 'docs', entries: { 'notes.txt': 9, 'todo.txt': 5 } },
  9: { type: 'file', name: 'notes.txt', blocks: [12, 27, 33] },
};
export function buildPathResolve({ path = '/docs/notes.txt' } = {}) {
  const segs = path.split('/').filter(Boolean); // ['docs','notes.txt']
  const out = [];
  const snap = (note, o = {}) => out.push({ path, segs, note, inode: o.inode ?? null, entries: o.entries ?? null, want: o.want ?? null, found: o.found ?? null, blocks: o.blocks ?? null, resolved: !!o.resolved });
  snap('a path is a chain of directory lookups — each directory maps a name to an inode number, and an inode points at the data blocks', {});
  let inode = 2; // root is always a known inode number
  snap('start at the root inode (#2) — the one inode the filesystem always knows how to find', { inode });
  for (const seg of segs) {
    const node = FS[inode];
    snap('read inode ' + inode + ' (' + (node.name === '/' ? 'root' : node.name) + ') — a directory; look up "' + seg + '" in its entries', { inode, entries: node.entries, want: seg });
    const next = node.entries[seg];
    snap('found "' + seg + '" → inode ' + next, { inode, entries: node.entries, want: seg, found: next });
    inode = next;
  }
  const file = FS[inode];
  snap('inode ' + inode + ' is a file; its bytes live in blocks [' + file.blocks.join(', ') + '] — scattered on disk, gathered by the inode', { inode, blocks: file.blocks, resolved: true });
  return out;
}

// Journaling: how a filesystem survives a crash mid-update. Changing metadata
// (e.g. linking a new file into a directory) touches several structures; a crash
// between them leaves the disk inconsistent. A journal write-aheads the intent
// and a commit marker, so a crash either replays a committed change or discards
// an incomplete one — never a half-applied mess. `journaled` toggles the two.
export function buildJournal({ journaled = true } = {}) {
  const out = [];
  const snap = (note, o = {}) => out.push({ journaled, journal: o.journal ?? [], applied: !!o.applied, crashed: !!o.crashed, consistent: o.consistent, note });
  if (!journaled) {
    snap('no journal. Creating a file means two writes: add the directory entry, and write the new inode');
    snap('write 1: add directory entry "report.txt → inode 18"');
    snap('CRASH — power dies before inode 18 is written', { crashed: true });
    snap('on restart: the directory points to inode 18, but it was never written → a dangling entry, a corrupt filesystem', { crashed: true, consistent: false });
  } else {
    snap('with a journal: write the whole intended change to the journal FIRST, then apply it to the real structures');
    snap('journal: record "add entry report.txt→18, write inode 18", then write a COMMIT marker', { journal: ['add report.txt→18', 'write inode 18', 'COMMIT'] });
    snap('CRASH — power dies right after the commit', { journal: ['add report.txt→18', 'write inode 18', 'COMMIT'], crashed: true });
    snap('on restart: the journal entry is COMMITTED → replay it, finishing both writes → the filesystem is consistent', { journal: ['add report.txt→18', 'write inode 18', 'COMMIT'], applied: true, consistent: true });
    snap('(had the crash hit before COMMIT, the entry would be discarded — the change simply never happened, still consistent)', { applied: true, consistent: true });
  }
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

// --- LOGIC STACK (/logic) ---

// NAND is a universal gate: every other gate can be built from it alone.
// NOT(a) = a NAND a; AND(a,b) = NOT(a NAND b); OR(a,b) = (NOT a) NAND (NOT b).
export const nand = (a, b) => (a && b ? 0 : 1);
// For each target gate, return its NAND construction and a truth table proving
// the NAND-built version equals the real gate for every input combination.
export function buildUniversal() {
  const defs = {
    NOT: { formula: 'a NAND a', unary: true, real: (a) => (a ? 0 : 1), built: (a) => nand(a, a) },
    AND: { formula: '(a NAND b) NAND (a NAND b)', real: (a, b) => (a && b ? 1 : 0), built: (a, b) => { const t = nand(a, b); return nand(t, t); } },
    OR: { formula: '(a NAND a) NAND (b NAND b)', real: (a, b) => (a || b ? 1 : 0), built: (a, b) => nand(nand(a, a), nand(b, b)) },
  };
  return Object.entries(defs).map(([gate, g]) => {
    const inputs = g.unary ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]];
    const rows = inputs.map((inp) => {
      const real = g.real(...inp), built = g.built(...inp);
      return { inputs: inp, real, built, match: real === built };
    });
    return { gate, formula: g.formula, unary: !!g.unary, rows, allMatch: rows.every((r) => r.match) };
  });
}

// A 2-to-1 multiplexer: a select line picks which of two inputs reaches the
// output — out = sel ? b : a, i.e. (a AND NOT sel) OR (b AND sel). "Choosing"
// in hardware, from picking a register to steering control flow.
export function mux2(sel, a, b) {
  return { sel, a, b, out: sel ? b : a, formula: '(a · s̄) + (b · s)' };
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

// --- DATA STRUCTURES STACK (/structures), part 2: the linked ADTs ---

// A linked list: nodes scattered in memory, each holding a value and a pointer
// to the next. Inserting in the middle is two pointer writes — O(1) — where an
// array would shift every later element. Returns the trace of inserting 15
// between 10 and 20; `chain` is the ordered values, `staged` the new node.
export function buildLinkedList() {
  const out = [];
  const snap = (chain, note, o = {}) => out.push({ chain: chain.slice(), staged: o.staged ?? null, highlight: o.highlight ?? null, note });
  snap([10, 20, 30], 'a linked list is nodes scattered in memory; each holds a value and a pointer (→) to the next, so order comes from the links, not the layout');
  snap([10, 20, 30], 'insert 15 after 10: first allocate the new node — it isn’t linked in yet', { staged: 15 });
  snap([10, 20, 30], '15.next → 20: point the new node at whatever 10 currently points to', { staged: 15 });
  snap([10, 15, 20, 30], '10.next → 15: redirect 10 to the new node. Two pointer writes, O(1) — nothing else moved', { highlight: 15 });
  snap([10, 15, 20, 30], 'done: 10 → 15 → 20 → 30. An array would have shifted 20 and 30 to make room; the list just repointed');
  return out;
}

// Stacks and queues: the same pushes, opposite removal order. A stack is LIFO
// (pop the last in); a queue is FIFO (dequeue the first in). Runs identical
// inputs through both so the divergence is the whole point. Returns snapshots
// with both containers plus what each just removed.
export function buildStackQueue() {
  const out = [];
  let stack = [], queue = [];
  const snap = (note, o = {}) => out.push({ stack: stack.slice(), queue: queue.slice(), stackOut: o.stackOut ?? null, queueOut: o.queueOut ?? null, op: o.op ?? null, note });
  snap('a stack and a queue, fed the exact same values — watch where each one removes from');
  for (const v of [1, 2, 3]) { stack.push(v); queue.push(v); snap('push / enqueue ' + v + ' — both add to the back', { op: 'add' }); }
  let s1 = stack.pop(), q1 = queue.shift();
  snap('remove once: the stack pops ' + s1 + ' (last in, first out); the queue dequeues ' + q1 + ' (first in, first out)', { op: 'remove', stackOut: s1, queueOut: q1 });
  let s2 = stack.pop(), q2 = queue.shift();
  snap('remove again: stack pops ' + s2 + ', queue dequeues ' + q2 + ' — same inputs, mirror-image output order', { op: 'remove', stackOut: s2, queueOut: q2 });
  snap('that’s the whole difference: a stack reverses, a queue preserves — LIFO vs FIFO, each built on an array or a linked list');
  return out;
}

// A small undirected graph: nodes joined by edges, generalizing trees (which
// forbid cycles). Adjacency in insertion order so traversal is deterministic.
export const GRAPH = {
  nodes: ['A', 'B', 'C', 'D', 'E'],
  adj: { A: ['B', 'C'], B: ['A', 'D'], C: ['A', 'D', 'E'], D: ['B', 'C'], E: ['C'] },
};
// Breadth-first search from a start node: visit a node, enqueue its unseen
// neighbours, repeat — exploring level by level using a queue (the same FIFO
// from the stacks-and-queues section). Returns the visiting order trace.
export function buildGraphTraversal({ start = 'A' } = {}) {
  const out = [];
  const visited = [], queue = [start], enqueued = new Set([start]);
  const snap = (current, note) => out.push({ current, visited: visited.slice(), queue: queue.slice(), note });
  snap(null, 'breadth-first search from ' + start + ': a queue holds the frontier; we visit a node, then enqueue any neighbour we haven’t seen');
  while (queue.length) {
    const node = queue.shift();
    visited.push(node);
    const fresh = GRAPH.adj[node].filter((n) => !enqueued.has(n));
    fresh.forEach((n) => { enqueued.add(n); queue.push(n); });
    snap(node, 'visit ' + node + (fresh.length ? ' → enqueue its new neighbours: ' + fresh.join(', ') : ' → no new neighbours; its links were already seen'));
  }
  snap(null, 'visited in order ' + visited.join(' → ') + ' — BFS fans out level by level, which is why it finds the shortest path in hops');
  return out;
}

// --- MEMORY STACK (/memory), part 2: allocation ---

// Stack vs heap. A call pushes a frame onto the stack (automatic, LIFO, freed
// on return); the heap holds things that must outlive the call (manual, freed
// explicitly). Returns the trace of main() calling f(), which heap-allocates a
// block and returns — the frame vanishes, the heap block survives.
export function buildStackHeap() {
  const out = [];
  let stack = [], heap = [];
  const snap = (note, o = {}) => out.push({ stack: stack.slice(), heap: heap.slice(), note, highlight: o.highlight ?? null });
  snap('a program splits its memory in two: the stack (automatic, for calls) and the heap (manual, for data that outlives a call)');
  stack = ['main()'];
  snap('main() starts → its frame is pushed onto the stack, holding its local variables');
  stack = ['main()', 'f()'];
  snap('main() calls f() → a new frame is pushed; f’s locals live here and vanish when f returns', { highlight: 'f()' });
  heap = [{ id: 'block', owner: 'f()' }];
  snap('f runs p = malloc(…) → a block is carved from the heap; the pointer p sits in f’s frame, but the block lives on the heap', { highlight: 'block' });
  stack = ['main()'];
  snap('f() returns → its frame is popped automatically, locals gone — but the heap block is still there (that’s why you’d heap-allocate)', { highlight: 'block' });
  snap('the stack freed f’s memory for you on return; the heap block persists until something calls free(). Forget to, and it leaks');
  return out;
}

// A heap allocator and external fragmentation. malloc carves a contiguous run
// of cells; free releases one, leaving a hole. After frees, the total free
// space can exceed a request yet still not fit, because it’s split into
// non-adjacent gaps. Returns the trace; `cells` is the heap (owner or null).
export function buildAllocator({ size = 8 } = {}) {
  const out = [];
  const cells = Array(size).fill(null);
  const snap = (note, o = {}) => out.push({ cells: cells.slice(), note, failed: !!o.failed, free: cells.filter((c) => c === null).length });
  const place = (id, n) => { // first-fit: find a run of n free cells
    for (let i = 0; i + n <= size; i++) {
      if (cells.slice(i, i + n).every((c) => c === null)) { for (let k = i; k < i + n; k++) cells[k] = id; return true; }
    }
    return false;
  };
  snap('the heap is one block of memory; malloc carves a contiguous run of cells, free returns one to the pool');
  place('A', 3); snap('malloc A (3) → first-fit finds room at the front');
  place('B', 2); snap('malloc B (2) → placed right after A');
  place('C', 2); snap('malloc C (2) → placed after B; one cell left free at the end');
  for (let i = 0; i < size; i++) if (cells[i] === 'B') cells[i] = null;
  snap('free B → its 2 cells return to the pool, leaving a hole between A and C');
  const ok = place('D', 3);
  snap('malloc D (3) → there are 3 free cells, but split into a 2-gap and a 1-gap — no contiguous run of 3, so it FAILS', { failed: !ok });
  snap('that’s external fragmentation: enough free memory in total, but too scattered to use — the reason allocators compact, or hand out fixed-size slabs');
  return out;
}

// Mark-and-sweep garbage collection. Start from the roots and follow every
// reference, marking what’s reachable; then sweep away everything unmarked.
// Objects 4 and 5 are allocated but unreachable, so they’re collected — no
// manual free, at the cost of a tracing pause. Returns the trace.
export function buildGc() {
  const objs = {
    1: { refs: [2] }, 2: { refs: [3] }, 3: { refs: [] }, 4: { refs: [5] }, 5: { refs: [] },
  };
  const roots = [1];
  const marked = new Set();
  const swept = new Set();
  const out = [];
  const snap = (phase, current, note) => out.push({
    phase, current,
    objects: Object.keys(objs).map((id) => ({ id: +id, refs: objs[id].refs, marked: marked.has(+id), swept: swept.has(+id) })),
    roots, note,
  });
  snap('idle', null, 'five objects are allocated; the roots (live variables) reference object 1. The GC keeps whatever it can reach from a root');
  // BFS mark from roots
  const queue = [...roots];
  while (queue.length) {
    const id = queue.shift();
    if (marked.has(id)) continue;
    marked.add(id);
    for (const r of objs[id].refs) if (!marked.has(r)) { queue.push(r); }
    const note = id === roots[0]
      ? 'start at the root → mark object 1 reachable; follow it to ' + objs[id].refs.join(', ')
      : (objs[id].refs.length ? 'mark ' + id + ' reachable → follow it to ' + objs[id].refs.join(', ') : 'mark ' + id + ' reachable → it references nothing, this branch ends');
    snap('mark', id, note);
  }
  snap('mark', null, 'marking done: 1, 2, 3 are reachable. Objects 4 and 5 were never reached — no path from any root');
  for (const id of [4, 5]) swept.add(id);
  snap('sweep', null, 'sweep: free every unmarked object → 4 and 5 are reclaimed automatically, no free() call needed');
  snap('idle', null, 'mark-and-sweep collects exactly the unreachable objects; the price is the collector must trace the graph, sometimes pausing the program');
  return out;
}

// --- AI STACK (/ai): the application that runs on top of the whole stack ---

// A neuron (perceptron): weigh each input, sum, add a bias, then fire through an
// activation. With a step activation it's a threshold gate — e.g. weights [1,1]
// and bias −1.5 fire only when BOTH inputs are 1, an AND gate.
export function computeNeuron(inputs, weights, bias) {
  const sum = inputs.reduce((s, x, i) => s + x * weights[i], 0) + bias;
  return { sum: +sum.toFixed(2), output: sum >= 0 ? 1 : 0 };
}

// Learning by gradient descent. A model predicts ŷ = w·x; we want it to match a
// data point (x, y). The loss (ŷ − y)² is a parabola in w; its gradient points
// uphill, so stepping w against the gradient walks downhill to the best weight
// (here w → y/x = 3). Returns the trace; loss falls every step.
export function buildGradientDescent({ x = 2, y = 6, w = 0, lr = 0.05, steps = 10 } = {}) {
  const out = [];
  const pred = (w) => w * x;
  const loss = (w) => (pred(w) - y) ** 2;
  const snap = (note, o = {}) => out.push({ w: +w.toFixed(3), pred: +pred(w).toFixed(2), loss: +loss(w).toFixed(2), grad: o.grad ?? null, note });
  snap('a model with one weight w predicts ŷ = w·' + x + '; we want ŷ = ' + y + '. Right now w = ' + w + ', so it is badly wrong');
  for (let i = 0; i < steps; i++) {
    const grad = 2 * (pred(w) - y) * x; // dLoss/dw
    w = w - lr * grad;
    snap('step ' + (i + 1) + ': nudge w against the gradient → w = ' + (+w.toFixed(3)) + ', ŷ = ' + (+pred(w).toFixed(2)) + ', loss = ' + (+loss(w).toFixed(2)), { grad: +grad.toFixed(2) });
  }
  snap('after ' + steps + ' steps w ≈ ' + (+w.toFixed(2)) + ' and the loss is nearly zero — that downhill walk IS learning, scaled to billions of weights');
  return out;
}

// Embeddings: meaning becomes geometry. Each word is a vector; similar words sit
// at similar angles, so cosine similarity measures relatedness. Real models use
// hundreds of learned dimensions — this is a hand-placed 2-D toy to see the idea.
export const EMBEDDINGS = {
  king: [0.80, 0.62], queen: [0.74, 0.68],
  man: [0.55, 0.50], woman: [0.48, 0.57],
  cat: [-0.80, 0.50], dog: [-0.70, 0.60], kitten: [-0.85, 0.44], puppy: [-0.74, 0.66],
  car: [0.60, -0.72], truck: [0.66, -0.66],
};
export function cosineSim(a, b) {
  const dot = a[0] * b[0] + a[1] * b[1];
  const mag = Math.hypot(...a) * Math.hypot(...b);
  return mag === 0 ? 0 : dot / mag;
}
export function nearestWords(word, k = 3) {
  const v = EMBEDDINGS[word];
  return Object.keys(EMBEDDINGS)
    .filter((w) => w !== word)
    .map((w) => ({ word: w, sim: +cosineSim(v, EMBEDDINGS[w]).toFixed(3) }))
    .sort((a, b) => b.sim - a.sim)
    .slice(0, k);
}

export function softmax(xs) {
  const m = Math.max(...xs);
  const exps = xs.map((x) => Math.exp(x - m));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

// Attention: a token gathers context from other tokens. Its attention weights
// are softmax over the dot product of its vector with each token's — so it
// "looks at" the tokens most aligned with it. Here the pronoun "it" attends to
// "cat", which is how a transformer figures out what "it" refers to.
export const ATTN_TOKENS = ['the', 'cat', 'drank', 'milk', 'because', 'it', 'was', 'thirsty'];
// 'cat' has a slightly larger magnitude so the query 'it' lands on it (rather
// than just on itself) — a toy arrangement that makes the pronoun-resolution
// point clear. The mechanism is the real one: softmax over dot products.
const ATTN_VECS = {
  the: [0.1, 0.1], cat: [1.1, 0.12], drank: [0.2, 0.6], milk: [0.55, 0.25],
  because: [0.0, 0.2], it: [1.0, 0.05], was: [0.05, 0.15], thirsty: [0.5, 0.4],
};
export function buildAttention({ query = 'it' } = {}) {
  const q = ATTN_VECS[query];
  const scores = ATTN_TOKENS.map((t) => q[0] * ATTN_VECS[t][0] + q[1] * ATTN_VECS[t][1]);
  const w = softmax(scores);
  return {
    query,
    weights: ATTN_TOKENS.map((t, i) => ({ token: t, weight: +w[i].toFixed(3) })),
  };
}

// A language model is, underneath, a next-token predictor: given the text so
// far, it outputs a score (logit) for every possible next token. Softmax turns
// those into probabilities; temperature divides the logits first — low T sharpens
// toward the top choice, high T flattens toward randomness.
export const NEXT_TOKENS = [
  { token: 'mat', logit: 3.0 }, { token: 'floor', logit: 1.5 }, { token: 'rug', logit: 1.2 },
  { token: 'sofa', logit: 0.8 }, { token: 'roof', logit: 0.2 }, { token: 'moon', logit: -1.0 },
];
export function softmaxTemp(logits, T) {
  return softmax(logits.map((l) => l / T));
}
export function nextTokenDist(T = 1) {
  const probs = softmaxTemp(NEXT_TOKENS.map((t) => t.logit), T);
  return NEXT_TOKENS.map((t, i) => ({ token: t.token, prob: +probs[i].toFixed(4) }));
}

// --- AI STACK (/ai), part 2: tokenization, training, grounding ---

// Tokenization: models don't see words, they see tokens — subword chunks from a
// fixed vocabulary. Common words are one token; rarer ones split into pieces.
// A toy greedy longest-match over a small vocab; real tokenizers (BPE) learn the
// merges, but the idea — and why a model can miscount the letters in a word it
// only sees as "straw"+"berry" — is the same.
export const TOK_VOCAB = ['The', 'the', 'cat', 'sat', 'on', 'mat', 'token', 'iz', 'ation', 'un', 'happiness', 'straw', 'berry', 'learn', 'ing', 'model', 's', 'is', 'a', 'word'];
function tokenizeWord(w) {
  const out = [];
  let i = 0;
  while (i < w.length) {
    let best = null;
    for (const piece of TOK_VOCAB) if (piece.length > (best ? best.length : 0) && w.startsWith(piece, i)) best = piece;
    if (best) { out.push(best); i += best.length; } else { out.push(w[i]); i += 1; }
  }
  return out;
}
export const TOK_EXAMPLES = ['The cat sat on the mat', 'tokenization', 'unhappiness', 'strawberry', 'learning models'];
export function tokenize(phrase) {
  const tokens = [];
  phrase.split(' ').forEach((w, wi) => {
    tokenizeWord(w).forEach((t, ti) => tokens.push({ text: t, id: TOK_VOCAB.indexOf(t), firstInWord: ti === 0, wi }));
  });
  return tokens;
}

// Pretraining vs fine-tuning: the same model, the same prompt, three training
// phases. Pretraining on the open internet teaches language but only autocompletes;
// supervised fine-tuning on curated instruction→response pairs teaches it to
// answer; preference tuning (RLHF) teaches it what people find helpful. Returns
// the phases with how the model behaves after each.
export function buildTraining() {
  const prompt = 'Explain photosynthesis simply.';
  const out = [];
  const snap = (phase, data, behavior, reply, note) => out.push({ prompt, phase, data, behavior, reply, note });
  snap('—', 'none yet', 'untrained', '(random gibberish)', 'the same prompt — "' + prompt + '" — run through a model at three stages of training');
  snap('Pretraining', 'trillions of words of internet text', 'autocompletes', 'Explain respiration simply. Explain osmosis simply. Explain…', 'next-token prediction on raw text: it soaks up grammar and facts, but it only continues the pattern — it doesn’t answer');
  snap('Supervised fine-tuning', 'curated instruction → response pairs', 'follows instructions', 'Plants turn sunlight, water, and air into food (sugar) and give off oxygen.', 'now shown examples of good answers, it learns to respond to the instruction instead of continuing it');
  snap('Preference tuning (RLHF)', 'humans ranking which answer is better', 'helpful & aligned', 'Great question! Plants are like tiny chefs ☀️ — they mix sunlight, water, and air to make their own food, and breathe out the oxygen we need.', 'rewarded for answers people prefer, it becomes clear, friendly, and safe — the “assistant” feel');
  snap('done', '—', 'an assistant', '', 'the base model already knew language; alignment is what made it useful');
  return out;
}

// RAG and tools: a model's knowledge is frozen at training time and it will
// confidently make things up. Retrieval-augmented generation embeds the query,
// finds the most similar real documents, and pastes them into the context so the
// answer is grounded. Reuses the same cosine similarity as embeddings.
export const RAG_DOCS = [
  { text: 'Refunds are accepted within 14 days of purchase.', vec: [0.9, 0.3] },
  { text: 'Our support line is open 9am–5pm on weekdays.', vec: [-0.6, 0.7] },
  { text: 'Standard shipping takes 3–5 business days.', vec: [0.1, -0.9] },
];
export function buildRag() {
  const query = 'How long do I have to return something?';
  const qvec = [0.85, 0.4]; // closest to the refund doc
  const ranked = RAG_DOCS.map((d) => ({ text: d.text, sim: +cosineSim(qvec, d.vec).toFixed(3) }))
    .sort((a, b) => b.sim - a.sim);
  const top = ranked[0];
  const out = [];
  const snap = (note, o = {}) => out.push({ query, ranked: o.ranked ?? null, retrieved: o.retrieved ?? null, answer: o.answer ?? null, grounded: !!o.grounded, note });
  snap('the model’s knowledge is frozen at training time, so for current or private facts it tends to guess');
  snap('without retrieval, asked "' + query + '" it makes up a plausible-sounding answer', { answer: '“Usually 30 days.” — plausible, but invented, and wrong', grounded: false });
  snap('RAG instead embeds the query and searches a document store for the most similar chunks', { ranked });
  snap('the top match is retrieved and pasted into the prompt as context', { ranked, retrieved: top.text });
  snap('now the model answers FROM that context, grounded in a real source', { retrieved: top.text, answer: '“14 days from purchase,” citing the refund policy', grounded: true });
  snap('that’s RAG: retrieve relevant text, put it in the context, answer from it. Tools go further — the model can call search, a calculator, or an API and use the result', { grounded: true });
  return out;
}
