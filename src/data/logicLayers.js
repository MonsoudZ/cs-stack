// Layers for the /logic deep-dive — same shape as the main stack so the shared
// engine (Base nav, LayerSection, scroll-spy) powers it unchanged.
export const logicLayers = [
  { id: 'LG0', num: '00', navLabel: 'Boolean', zone: 'number', title: 'Boolean algebra: math with only true and false', sub: 'logic · AND · OR · NOT' },
  { id: 'LG1', num: '01', navLabel: 'Gates', zone: 'number', title: 'Gates: a truth table made of switches', sub: 'logic · AND/OR/XOR/NOT in hardware' },
  { id: 'LG2', num: '02', navLabel: 'NAND is universal', zone: 'number', title: 'One gate to build them all', sub: 'logic · functional completeness · NAND' },
  { id: 'LG3', num: '03', navLabel: 'The multiplexer', zone: 'system', title: 'The multiplexer: choosing in hardware', sub: 'logic · combinational logic · select' },
  { id: 'LG4', num: '04', navLabel: 'The adder', zone: 'system', title: 'The adder: arithmetic falls out of logic', sub: 'logic · full adder · the ripple carry' },
  { id: 'LG5', num: '05', navLabel: 'Toward the ALU', zone: 'all', title: 'From gates to a machine that computes', sub: 'the whole trip · gates → adder → ALU' },
];
