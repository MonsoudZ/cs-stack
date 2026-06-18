// Part of the widgets builder set, split by area. The barrel at
// src/lib/widgets.js re-exports every module so existing imports keep working.

// --- CONSENSUS STACK (/raft) ---

// Raft leader election. Five servers start as followers in term 0. When one
// stops hearing from a leader its election timeout fires: it becomes a
// candidate, bumps the term, votes for itself, and asks the others. A candidate
// that collects a majority of votes becomes leader and sends heartbeats. The
// trace runs a clean election, then crashes the leader and shows the cluster
// heal itself with a fresh election in a higher term. Majority of 5 is 3.
export function buildRaftElection() {
  const MAJORITY = 3;
  const ids = ['N0', 'N1', 'N2', 'N3', 'N4'];
  const node = {};
  ids.forEach((id) => (node[id] = { id, role: 'follower', term: 0, votedFor: null }));
  const out = [];
  const snap = (note, o = {}) => out.push({
    nodes: ids.map((id) => ({ ...node[id], granted: (o.granted || []).includes(id) })),
    leader: o.leader ?? null, candidate: o.candidate ?? null, votes: o.votes ?? null,
    majority: MAJORITY, event: o.event ?? null, note,
  });
  snap('Five servers, all followers in term 0 — no leader yet. Each one waits a random election timeout for a heartbeat that never comes.');
  // --- election of N0 for term 1 ---
  node.N0 = { id: 'N0', role: 'candidate', term: 1, votedFor: 'N0' };
  snap('N0’s timeout fires first → it becomes a CANDIDATE, bumps to term 1, and votes for itself (1 vote).', { candidate: 'N0', votes: 1, granted: ['N0'], event: 'timeout' });
  snap('N0 sends RequestVote(term 1) to the other four and waits for replies.', { candidate: 'N0', votes: 1, granted: ['N0'], event: 'request' });
  node.N1.votedFor = 'N0'; node.N1.term = 1;
  snap('N1 hasn’t voted this term → it grants its vote and advances to term 1 (2 votes).', { candidate: 'N0', votes: 2, granted: ['N0', 'N1'], event: 'grant' });
  node.N2.votedFor = 'N0'; node.N2.term = 1;
  snap('N2 grants too → that’s 3 of 5, a MAJORITY. One vote per server per term is what stops two leaders.', { candidate: 'N0', votes: 3, granted: ['N0', 'N1', 'N2'], event: 'grant' });
  node.N0.role = 'leader';
  snap('N0 has a majority → it becomes LEADER for term 1.', { leader: 'N0', candidate: 'N0', votes: 3, granted: ['N0', 'N1', 'N2'], event: 'win' });
  ids.forEach((id) => { if (id !== 'N0') { node[id].role = 'follower'; node[id].term = 1; } });
  snap('N0 sends heartbeats (empty AppendEntries) to all → everyone resets their timeout and stays a follower. The cluster is stable.', { leader: 'N0', event: 'heartbeat' });
  // --- the leader crashes; the cluster re-elects ---
  node.N0.role = 'down';
  snap('Now N0 CRASHES. Its heartbeats stop, so the followers’ election timeouts start counting down again.', { event: 'crash' });
  node.N2 = { id: 'N2', role: 'candidate', term: 2, votedFor: 'N2' };
  snap('N2 times out first → CANDIDATE for term 2 (a higher term always wins), voting for itself.', { candidate: 'N2', votes: 1, granted: ['N2'], event: 'timeout' });
  node.N1.votedFor = 'N2'; node.N1.term = 2;
  node.N3.votedFor = 'N2'; node.N3.term = 2;
  snap('N1 and N3 grant votes for term 2 → 3 of 5 again (N0 is down and can’t reply).', { candidate: 'N2', votes: 3, granted: ['N1', 'N2', 'N3'], event: 'grant' });
  node.N2.role = 'leader'; node.N4.term = 2;
  snap('N2 wins → new LEADER for term 2. A crash cost one timeout, and Raft healed itself with no human in the loop. (Not shown here: voters also refuse any candidate whose log is behind theirs, so a re-election can never drop a committed entry.)', { leader: 'N2', candidate: 'N2', votes: 3, granted: ['N1', 'N2', 'N3'], event: 'win' });
  return out;
}

// Raft log replication. The leader is the only writer: a client command is
// appended to the leader's log, then replicated to followers via AppendEntries.
// Once a majority have stored an entry the leader COMMITS it, applies it to its
// state machine, and tells the followers to apply it too — so every replica runs
// the same commands in the same order. Three nodes here, so a majority is 2.
export function buildRaftLog() {
  const ids = ['N0', 'N1', 'N2'];
  const log = { N0: [], N1: [], N2: [] };
  const commit = { N0: 0, N1: 0, N2: 0 };
  const out = [];
  const stateOf = () => log.N0.slice(0, commit.N0).map((e) => e.cmd).join(', ') || '∅';
  const snap = (note, o = {}) => out.push({
    nodes: ids.map((id) => ({
      id, role: id === 'N0' ? 'leader' : 'follower',
      log: log[id].map((e) => ({ ...e })), commit: commit[id],
    })),
    state: stateOf(), action: o.action ?? null, client: o.client ?? null, note,
  });
  snap('Three servers: N0 is the leader (term 1), N1 and N2 are followers. All logs empty, state machine x = ∅.');
  // command 1
  snap('A client sends the command “x=1” — to the leader, the only server allowed to append.', { client: 'x=1' });
  log.N0.push({ term: 1, cmd: 'x=1' });
  snap('The leader APPENDS x=1 to its own log at index 1 (uncommitted — not yet safe).', { action: 'append' });
  log.N1.push({ term: 1, cmd: 'x=1' });
  snap('It sends AppendEntries to the followers; N1 stores x=1 and acks. Now the leader + N1 have it — that’s 2 of 3, a MAJORITY.', { action: 'replicate' });
  commit.N0 = 1;
  snap('Majority stored → the leader COMMITS index 1 and applies it: state machine x = 1. A committed entry can never be lost.', { action: 'commit' });
  log.N2.push({ term: 1, cmd: 'x=1' });
  commit.N1 = 1; commit.N2 = 1;
  snap('N2 stores x=1 too, and the next heartbeat carries the commit index → all three apply x=1. Every replica now agrees.', { action: 'apply' });
  // command 2
  log.N0.push({ term: 1, cmd: 'y=2' });
  log.N1.push({ term: 1, cmd: 'y=2' });
  log.N2.push({ term: 1, cmd: 'y=2' });
  snap('A second command “y=2” is appended and replicated to both followers at index 2.', { client: 'y=2', action: 'replicate' });
  commit.N0 = 2; commit.N1 = 2; commit.N2 = 2;
  snap('Majority again → commit and apply index 2 everywhere. Same commands, same order, same result: one consistent replicated state machine.', { action: 'commit' });
  return out;
}

// --- LANGUAGES STACK (/languages) ---

// Where five real languages sit on the axes the rest of the site teaches:
// how source reaches the CPU (compiled / interpreted / JIT), static vs dynamic
// types, how memory is managed (manual / ownership / GC), and the concurrency
// model. The single source of truth for the widgets and the comparison table.
export const LANGS = [
  { id: 'C',      model: 'compiled',    run: 'AOT → native binary',         types: 'static',  memory: 'manual (malloc / free)',     concurrency: 'OS threads' },
  { id: 'Rust',   model: 'compiled',    run: 'AOT → native binary',         types: 'static',  memory: 'ownership + borrow check',   concurrency: 'OS threads' },
  { id: 'Go',     model: 'compiled',    run: 'AOT → native + runtime',      types: 'static',  memory: 'garbage collected',          concurrency: 'goroutines' },
  { id: 'Python', model: 'interpreted', run: 'bytecode → interpreter (VM)', types: 'dynamic', memory: 'garbage collected',          concurrency: 'threads + GIL / async' },
  { id: 'JS',     model: 'JIT',         run: 'interpret → JIT hot paths',   types: 'dynamic', memory: 'garbage collected',          concurrency: 'single-threaded event loop' },
];

// Reveal each language's path from source to running, one at a time — so the
// three execution models (AOT-native, bytecode-interpreted, JIT) line up side
// by side. Returns the step trace (the component accumulates revealed lanes).
export function buildLangRun() {
  const out = [];
  const snap = (note, o = {}) => out.push({ active: o.active ?? null, note });
  snap('The same source code — but how does it actually reach the CPU? Each language picks a different path. Step through them.');
  const why = {
    C: 'C compiles ahead of time straight to a native binary the CPU runs directly — no runtime, nothing between you and the machine.',
    Rust: 'Rust also compiles AOT to a native binary, adding compile-time safety checks that cost nothing at runtime — still no GC, no VM.',
    Go: 'Go compiles AOT to native too, but the binary bundles a small runtime (a garbage collector and the goroutine scheduler).',
    Python: 'Python compiles your source to bytecode, then the CPython VM interprets it op by op — flexible and simple, but slower.',
    JS: 'JavaScript starts by interpreting, then a JIT compiles the hot functions to native code while the program runs — slow to warm up, fast once hot.',
  };
  for (const l of LANGS) snap(why[l.id], { active: l.id });
  snap('Three strategies: compile everything up front (native), interpret bytecode in a VM, or JIT the hot paths — trading startup time, peak speed, and flexibility.');
  return out;
}

// The same heap allocation under three memory regimes: manual (you free it —
// forget and it leaks), ownership (freed automatically when the owner leaves
// scope, proven at compile time), and a garbage collector (freed later, when
// the collector notices it's unreachable). Returns the step trace.
export function buildLangMemory() {
  const out = [];
  const snap = (regime, langs, note, o = {}) => out.push({
    regime, langs, block: o.block ?? null, note,
    freed: !!o.freed, leaked: !!o.leaked,
  });
  snap(null, '', 'One job — allocate a buffer on the heap, use it, then the function returns. Watch who cleans it up under three regimes.');
  // manual (C)
  snap('manual', 'C', 'C: malloc() hands you a block on the heap. It is yours.', { block: 'used' });
  snap('manual', 'C', 'You use it… then the function returns. Nothing frees it automatically.', { block: 'used' });
  snap('manual', 'C', 'You must call free() yourself. Forget, and the block leaks — still allocated, but nothing can reach it. (Free it twice, and you corrupt the heap.)', { block: 'leaked', leaked: true });
  // ownership (Rust)
  snap('ownership', 'Rust', 'Rust: the block has a single owner — the variable it was bound to.', { block: 'used' });
  snap('ownership', 'Rust', 'When the owner goes out of scope at the end of the function, Rust frees the block automatically.', { block: 'used' });
  snap('ownership', 'Rust', 'No GC, no manual free — the compiler proved exactly when it was safe to drop. Forgetting to free is impossible.', { block: 'freed', freed: true });
  // gc (Go / Python / JS)
  snap('gc', 'Go · Python · JS', 'Garbage-collected languages: you allocate and simply stop referencing it. You never free anything.', { block: 'used' });
  snap('gc', 'Go · Python · JS', 'Later, the collector scans for blocks nothing can reach…', { block: 'used' });
  snap('gc', 'Go · Python · JS', '…and frees them. Convenient and leak-resistant — at the cost of a collection pause you don’t control.', { block: 'freed', freed: true });
  snap(null, '', 'Same allocation, three answers: you free it (fast, error-prone), the compiler frees it (safe, strict), or a collector frees it (easy, unpredictable).');
  return out;
}

// --- DEVOPS STACK (/devops) ---

// Continuous integration: every pushed commit runs the same gates automatically,
// so breakage is caught in minutes rather than in production. The trace shows a
// commit that fails its tests (pipeline halts — nothing ships), then a fix that
// passes every gate and becomes a deployable artifact.
export const CI_STAGES = ['checkout', 'install', 'build', 'unit tests', 'audit', 'e2e'];
export function buildCiPipeline() {
  const out = [];
  let commit = 'a1b2c3', verdict = null;
  let stages = CI_STAGES.map((name) => ({ name, status: 'idle' }));
  const snap = (note, o = {}) => out.push({ commit, stages: stages.map((s) => ({ ...s })), verdict, note, failed: !!o.failed });
  snap('A commit is pushed → CI triggers automatically. Every commit runs the same gates, so a regression is caught in minutes, not by a user.');
  // run 1 — breaks at the unit tests
  for (const name of CI_STAGES) {
    const st = stages.find((s) => s.name === name);
    if (name === 'unit tests') {
      st.status = 'fail'; verdict = 'blocked';
      snap('“unit tests” FAILED — a regression slipped in. The pipeline stops here: this commit cannot ship.', { failed: true });
      break;
    }
    st.status = 'pass';
    snap(name + ' passed ✓ — on to the next gate.');
  }
  // run 2 — fix, all gates green
  commit = 'd4e5f6'; verdict = null; stages = CI_STAGES.map((name) => ({ name, status: 'idle' }));
  snap('The developer pushes a fix (' + commit + ') → CI re-runs from a clean checkout.');
  for (const name of CI_STAGES) { stages.find((s) => s.name === name).status = 'pass'; snap(name + ' passed ✓'); }
  verdict = 'deployable';
  snap('Every gate green → the build is a trustworthy, deployable artifact. That green check is the entire point of CI.');
  return out;
}

// Continuous delivery with a canary rollout: instead of flipping all traffic to
// a new version at once, shift a small slice first and watch its error rate —
// catch a bad release on 5–25% of users and auto-roll-back, then ramp a fixed
// version to 100%. Returns the step trace (traffic split + health per step).
export function buildDeploy() {
  const out = [];
  let v1 = 100, v2 = 0, health = 'ok', phase = 'steady', rolledBack = false;
  const snap = (note) => out.push({ v1, v2, health, phase, rolledBack, note });
  snap('v1 is live, serving 100% of traffic. v2 is built and ready — but flipping everyone to it at once would expose every user to any bug.');
  phase = 'canary'; v1 = 95; v2 = 5; snap('Canary: route just 5% of traffic to v2 and watch its error rate.');
  snap('v2 is healthy at 5% — error rate normal. Ramp it up.');
  v1 = 75; v2 = 25; snap('25% of traffic on v2…');
  health = 'bad'; phase = 'alert'; snap('v2’s error rate SPIKES — it has a bug, but only 25% of users were ever exposed.');
  v1 = 100; v2 = 0; rolledBack = true; phase = 'rollback'; health = 'ok'; snap('Auto-rollback: shift 100% straight back to v1. Most users never noticed — this is exactly why you roll out gradually.');
  rolledBack = false; phase = 'canary'; v1 = 95; v2 = 5; snap('v2 is fixed and redeployed. Canary again at 5% — healthy.');
  v1 = 50; v2 = 50; snap('Healthy at 50%…');
  v1 = 0; v2 = 100; phase = 'live'; snap('…and now 100%. v2 is fully live — proven safe one slice of traffic at a time.');
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
