// Part of the widgets builder set, split by area. The barrel at
// src/lib/widgets.js re-exports every module so existing imports keep working.

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
