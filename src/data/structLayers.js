// Layers for the /structures deep-dive — same shape as the main stack so the
// shared engine (Base nav, LayerSection, scroll-spy) powers it unchanged.
export const structLayers = [
  { id: 'S0', num: '00', navLabel: 'Arrays', zone: 'system', title: 'Arrays: neighbours in a row', sub: 'structures · contiguous memory · O(1) index' },
  { id: 'S1', num: '01', navLabel: 'Dynamic arrays', zone: 'system', title: 'Dynamic arrays: growing without knowing the size', sub: 'structures · doubling · amortized append' },
  { id: 'S2', num: '02', navLabel: 'Hash maps', zone: 'system', title: 'Hash maps: a key becomes an address', sub: 'structures · hashing · collisions · chaining' },
  { id: 'S3', num: '03', navLabel: 'Trees', zone: 'system', title: 'Trees: keep it ordered, search by halving', sub: 'structures · nodes · branches · O(log n)' },
  { id: 'S4', num: '04', navLabel: 'Big-O', zone: 'all', title: 'Big-O: every structure picks its poison', sub: 'the trade-off · what each shape makes cheap' },
];
