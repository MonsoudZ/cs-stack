// Layers for the /compiler deep-dive — same shape as the main stack so the
// shared engine (Base nav, LayerSection, scroll-spy) powers it unchanged.
export const compilerLayers = [
  { id: 'K0', num: '00', navLabel: 'Source', zone: 'meaning', title: 'Source: code written for humans', sub: 'meaning · the gap to the machine' },
  { id: 'K1', num: '01', navLabel: 'Lexing', zone: 'number', title: 'Lexing: text becomes tokens', sub: 'compiler · the scanner · tokens' },
  { id: 'K2', num: '02', navLabel: 'Parsing', zone: 'number', title: 'Parsing: tokens become a tree', sub: 'compiler · grammar · precedence · the AST' },
  { id: 'K3', num: '03', navLabel: 'Bytecode', zone: 'system', title: 'Bytecode: the tree becomes operations', sub: 'compiler · lowering · a stack machine' },
  { id: 'K4', num: '04', navLabel: 'Optimization', zone: 'system', title: 'Optimization: do less, get the same answer', sub: 'compiler · constant folding · dead code' },
  { id: 'K5', num: '05', navLabel: 'Run', zone: 'system', title: 'Run: interpret, compile, or JIT', sub: 'runtime · VM · AOT · just-in-time' },
  { id: 'K6', num: '06', navLabel: 'The pipeline', zone: 'all', title: 'One pipeline, text to execution', sub: 'the whole trip · source → tokens → tree → ops' },
];
