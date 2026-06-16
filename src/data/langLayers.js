// Layers for the /languages deep-dive — same shape as the main stack so the
// shared engine (Base nav, LayerSection, scroll-spy) powers it unchanged.
export const langLayers = [
  { id: 'LA0', num: '00', navLabel: 'What a language is', zone: 'meaning', title: 'A language: a human surface over one machine', sub: 'syntax · semantics · the same CPU underneath' },
  { id: 'LA1', num: '01', navLabel: 'How it runs', zone: 'system', title: 'Compiled, interpreted, or JIT', sub: 'AOT native · bytecode VM · just-in-time' },
  { id: 'LA2', num: '02', navLabel: 'Types', zone: 'meaning', title: 'Static vs dynamic types', sub: 'checked when — at compile time, or as it runs' },
  { id: 'LA3', num: '03', navLabel: 'Memory', zone: 'system', title: 'Manual, ownership, or garbage-collected', sub: 'who frees the heap — and when' },
  { id: 'LA4', num: '04', navLabel: 'Concurrency', zone: 'system', title: 'Threads, goroutines, async, the GIL', sub: 'how each language does many things at once' },
  { id: 'LA5', num: '05', navLabel: 'Side by side', zone: 'all', title: 'One program, five languages', sub: 'the whole comparison · pick your tradeoffs' },
];
