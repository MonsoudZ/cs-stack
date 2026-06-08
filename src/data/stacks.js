// Single source of truth for the deep-dive sibling explorables. Ordered by
// their position in the main stack (bottom → top), so the footer nav reads in
// the same direction you climb. `layer` is the main-stack layer each expands;
// `slug` is its route; `kind` lets the title read "the render PIPELINE";
// `accent` is the stack's signature hue (from the site palette) — used to tint
// its per-stack social-share card in scripts/gen-og.mjs.
export const stacks = [
  { slug: 'silicon', name: 'Silicon', kind: 'stack', layer: '−01', accent: '#2ee6c0', blurb: 'doping, the diode, the MOSFET, and the CMOS logic gate' },
  { slug: 'numbers', name: 'Numbers', kind: 'stack', layer: '06', accent: '#ffb454', blurb: 'two’s complement, IEEE-754, and why 0.1 + 0.2 ≠ 0.3' },
  { slug: 'compiler', name: 'Compiler', kind: 'stack', layer: '08', accent: '#a78bfa', blurb: 'lexing, parsing, type checking, bytecode, and a tiny VM' },
  { slug: 'cpu', name: 'CPU', kind: 'stack', layer: '09', accent: '#5b9dff', blurb: 'registers, fetch-decode-execute, the ALU, pipelining, and the clock' },
  { slug: 'memory', name: 'Memory', kind: 'stack', layer: '10', accent: '#5b9dff', blurb: 'the stack & heap, allocation, GC, caches, virtual memory, and the TLB' },
  { slug: 'structures', name: 'Structures', kind: 'stack', layer: '12', accent: '#2ee6c0', blurb: 'linked lists, stacks & queues, hash maps, trees, and graphs' },
  { slug: 'os', name: 'OS', kind: 'stack', layer: '13', accent: '#5b9dff', blurb: 'the scheduler, context switches, syscalls, and interrupts' },
  { slug: 'concurrency', name: 'Concurrency', kind: 'stack', layer: '14', accent: '#a78bfa', blurb: 'threads, race conditions, deadlock, and lock-free atomics' },
  { slug: 'crypto', name: 'Crypto', kind: 'stack', layer: '15', accent: '#ff6b6b', blurb: 'hashing, keys, key exchange, certificates, and TLS' },
  { slug: 'network', name: 'Network', kind: 'stack', layer: '16', accent: '#5b9dff', blurb: 'encapsulation, routing, DNS, and a packet’s journey' },
  { slug: 'cloud', name: 'Cloud', kind: 'stack', layer: '17', accent: '#2ee6c0', blurb: 'scaling out, load balancing, replicas, and the CAP tradeoff' },
  { slug: 'database', name: 'Database', kind: 'stack', layer: '18', accent: '#ffb454', blurb: 'B-trees, transactions, isolation levels, durability, and replication' },
  { slug: 'render', name: 'Render', kind: 'pipeline', layer: '19', accent: '#a78bfa', blurb: 'DOM, style, layout, paint, compositing, and the event loop' },
];
