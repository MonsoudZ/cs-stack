// Layers for the /numbers deep-dive — same shape as the main stack so the
// shared engine (Base nav, LayerSection, scroll-spy) powers it unchanged.
export const numLayers = [
  { id: 'NB0', num: '00', navLabel: 'Place value', zone: 'number', title: 'Place value: bits become a number', sub: 'numbers · binary · unsigned integers' },
  { id: 'NB1', num: '01', navLabel: "Two's complement", zone: 'number', title: "Two's complement: negatives without a minus sign", sub: 'numbers · signed integers · overflow' },
  { id: 'NB2', num: '02', navLabel: 'Floating point', zone: 'number', title: 'Floating point: scientific notation in binary', sub: 'numbers · IEEE-754 · sign · exponent · mantissa' },
  { id: 'NB3', num: '03', navLabel: 'The grid', zone: 'number', title: 'Precision: the values you can actually hit', sub: 'numbers · the uneven grid · rounding' },
  { id: 'NB4', num: '04', navLabel: '0.1 + 0.2', zone: 'all', title: 'Why 0.1 + 0.2 ≠ 0.3', sub: 'the famous bug that isn’t a bug' },
];
