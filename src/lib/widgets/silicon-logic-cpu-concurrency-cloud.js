// Part of the widgets builder set, split by area. The barrel at
// src/lib/widgets.js re-exports every module so existing imports keep working.

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
// inputs; the result wraps at 8 bits and sets condition flags that branches
// later read: Z = zero result, C = unsigned carry/borrow out, V = signed
// overflow (the two's-complement result's sign came out wrong — distinct from
// the unsigned carry). Pure — drives the widget.
export const ALU_OPS = ['ADD', 'SUB', 'AND', 'OR', 'XOR'];
export function computeAlu(op, a, b) {
  a &= 0xff; b &= 0xff;
  let raw, carry = 0, overflow = 0;
  const sign = (n) => (n & 0x80) ? 1 : 0; // the 8-bit sign bit
  switch (op) {
    case 'ADD': raw = a + b; carry = raw > 0xff ? 1 : 0; overflow = (sign(a) === sign(b) && sign(raw & 0xff) !== sign(a)) ? 1 : 0; break;
    case 'SUB': raw = a - b; carry = a < b ? 1 : 0; overflow = (sign(a) !== sign(b) && sign(raw & 0xff) !== sign(a)) ? 1 : 0; break; // carry = borrow
    case 'AND': raw = a & b; break;
    case 'OR': raw = a | b; break;
    case 'XOR': raw = a ^ b; break;
    default: raw = 0;
  }
  const result = raw & 0xff;
  return { op, a, b, result, carry, overflow, zero: result === 0 ? 1 : 0 };
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
