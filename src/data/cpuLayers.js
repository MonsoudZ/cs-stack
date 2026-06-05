// Layers for the /cpu deep-dive — same shape as the main stack so the shared
// engine (Base nav, LayerSection, scroll-spy) powers it unchanged.
export const cpuLayers = [
  { id: 'CP0', num: '00', navLabel: 'Registers', zone: 'system', title: 'Registers: the CPU’s instant scratchpad', sub: 'cpu · the fastest, tiniest storage' },
  { id: 'CP1', num: '01', navLabel: 'The cycle', zone: 'system', title: 'Fetch, decode, execute — forever', sub: 'cpu · the instruction cycle · the program counter' },
  { id: 'CP2', num: '02', navLabel: 'The ALU', zone: 'system', title: 'The ALU: the calculator at the core', sub: 'cpu · add · subtract · logic · the flags' },
  { id: 'CP3', num: '03', navLabel: 'Pipelining', zone: 'system', title: 'Pipelining: an assembly line for instructions', sub: 'cpu · overlapping stages · throughput' },
  { id: 'CP4', num: '04', navLabel: 'Hazards', zone: 'system', title: 'Hazards: when the assembly line stalls', sub: 'cpu · data hazards · stalls · forwarding' },
  { id: 'CP5', num: '05', navLabel: 'The clock', zone: 'all', title: 'The clock, and the wall it hit', sub: 'cpu · GHz · why speed gave way to cores' },
];
