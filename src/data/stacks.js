// Single source of truth for the deep-dive sibling explorables. Ordered by
// their position in the main stack (bottom → top), so the footer nav reads in
// the same direction you climb. `layer` is the main-stack layer each expands;
// `slug` is its route; `kind` lets the title read "the render PIPELINE".
export const stacks = [
  { slug: 'silicon', name: 'Silicon', kind: 'stack', layer: '−01', blurb: 'doping, the diode, the MOSFET, and the CMOS logic gate' },
  { slug: 'numbers', name: 'Numbers', kind: 'stack', layer: '04.5', blurb: 'two’s complement, IEEE-754, and why 0.1 + 0.2 ≠ 0.3' },
  { slug: 'compiler', name: 'Compiler', kind: 'stack', layer: '05.5', blurb: 'lexing, parsing, bytecode, and a tiny VM' },
  { slug: 'memory', name: 'Memory', kind: 'stack', layer: '06.5', blurb: 'caches, the hierarchy, virtual memory, and the TLB' },
  { slug: 'structures', name: 'Structures', kind: 'stack', layer: '07.5', blurb: 'dynamic arrays, hash maps, trees, and Big-O' },
  { slug: 'os', name: 'OS', kind: 'stack', layer: '08', blurb: 'the scheduler, context switches, syscalls, and interrupts' },
  { slug: 'crypto', name: 'Crypto', kind: 'stack', layer: '08.5', blurb: 'hashing, keys, key exchange, certificates, and TLS' },
  { slug: 'network', name: 'Network', kind: 'stack', layer: '09', blurb: 'encapsulation, routing, DNS, and a packet’s journey' },
  { slug: 'database', name: 'Database', kind: 'stack', layer: '10.5', blurb: 'indexes, B-trees, transactions, and durability' },
  { slug: 'render', name: 'Render', kind: 'pipeline', layer: '10.8', blurb: 'DOM, style, layout, paint, and compositing' },
];
