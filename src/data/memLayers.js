// Layers for the /memory deep-dive — same shape as the main stack so the
// shared engine (Base nav, LayerSection, scroll-spy) powers it unchanged.
export const memLayers = [
  { id: 'M0', num: '00', navLabel: 'Addresses', zone: 'system', title: 'Addresses: RAM is one big array', sub: 'memory · bytes · addresses' },
  { id: 'M1', num: '01', navLabel: 'Cache', zone: 'system', title: 'Cache: keep the hot data close', sub: 'memory · cache lines · locality' },
  { id: 'M2', num: '02', navLabel: 'Hierarchy', zone: 'system', title: 'The hierarchy: speed bought with distance', sub: 'memory · registers · L1 · L2 · RAM · disk' },
  { id: 'M3', num: '03', navLabel: 'Virtual memory', zone: 'system', title: 'Virtual memory: everyone gets their own', sub: 'memory · pages · the page table' },
  { id: 'M4', num: '04', navLabel: 'The TLB', zone: 'system', title: 'The TLB: cache the translation itself', sub: 'memory · address-translation cache' },
  { id: 'M5', num: '05', navLabel: 'One load', zone: 'all', title: 'One load, all the way down', sub: 'the whole trip · address → TLB → cache → RAM' },
];
