// Layers for the /render deep-dive — same shape as the main stack so the
// shared engine (Base nav, LayerSection, scroll-spy) powers it unchanged.
export const renderLayers = [
  { id: 'R0', num: '00', navLabel: 'DOM', zone: 'meaning', title: 'The DOM: HTML becomes a tree', sub: 'render · parsing · the node tree' },
  { id: 'R1', num: '01', navLabel: 'Style', zone: 'meaning', title: 'Style: the cascade computes', sub: 'render · CSS · specificity · the CSSOM' },
  { id: 'R2', num: '02', navLabel: 'Layout', zone: 'number', title: 'Layout: every box gets a place', sub: 'render · the box model · reflow' },
  { id: 'R3', num: '03', navLabel: 'Paint', zone: 'number', title: 'Paint & composite: boxes become pixels', sub: 'render · rasterize · layers · the GPU' },
  { id: 'R4', num: '04', navLabel: 'What re-runs', zone: 'system', title: 'What re-runs: why transform is cheap', sub: 'render · invalidation · layout vs paint vs composite' },
  { id: 'R5', num: '05', navLabel: 'The frame', zone: 'all', title: 'One frame, the DOM to pixels', sub: 'the whole trip · ~60 times a second' },
];
