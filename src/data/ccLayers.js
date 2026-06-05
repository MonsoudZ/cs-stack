// Layers for the /concurrency deep-dive — same shape as the main stack so the
// shared engine (Base nav, LayerSection, scroll-spy) powers it unchanged.
export const ccLayers = [
  { id: 'CC0', num: '00', navLabel: 'Threads', zone: 'system', title: 'Threads: many runners, one memory', sub: 'concurrency · shared address space · own stack' },
  { id: 'CC1', num: '01', navLabel: 'The race', zone: 'system', title: 'Race conditions: when timing corrupts state', sub: 'concurrency · interleaving · the lost update · the lock' },
  { id: 'CC2', num: '02', navLabel: 'Deadlock', zone: 'system', title: 'Deadlock: everyone waiting on everyone', sub: 'concurrency · circular wait · lock ordering' },
  { id: 'CC3', num: '03', navLabel: 'Atomics', zone: 'system', title: 'Atomics: getting it right without a lock', sub: 'concurrency · compare-and-swap · lock-free' },
  { id: 'CC4', num: '04', navLabel: 'Why it’s hard', zone: 'all', title: 'Why concurrency is famously hard', sub: 'concurrency · nondeterminism · the bugs you can’t reproduce' },
];
