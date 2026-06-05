// Single source of truth for the stack's layers. Both the spine nav
// (Base.astro) and the page sections (index.astro via LayerSection) derive
// from this array, so adding or reordering a layer can't drift between them.
//   id       section anchor (#id) — also the scroll target for the nav rung
//   num      the layer index badge ("−01", "06.5", "★")
//   navLabel short label shown on the spine rung
//   zone     accent zone → class `zone-${zone}` (physical|number|meaning|system|all)
//   title    the section <h2>
//   sub      the eyebrow line under the title
export const layers = [
  { id: 'Lsi', num: '−01', navLabel: 'Silicon', zone: 'physical', title: 'Before the switch: a rock we taught to decide', sub: 'physical · semiconductors · the MOSFET' },
  { id: 'L0', num: '00', navLabel: 'Voltage', zone: 'physical', title: 'A wire that is either pushed or not', sub: 'physical · electricity' },
  { id: 'L1', num: '01', navLabel: 'Transistor', zone: 'physical', title: 'The transistor: a wire that controls another wire', sub: 'physical · the switch' },
  { id: 'L2', num: '02', navLabel: 'Logic gates', zone: 'physical', title: 'Gates: transistors that compute true & false', sub: 'logic · boolean algebra' },
  { id: 'L3', num: '03', navLabel: 'Bits → numbers', zone: 'number', title: 'Eight wires become a number', sub: 'numbers · binary place value' },
  { id: 'L4', num: '04', navLabel: 'Arithmetic', zone: 'number', title: 'Gates that add — arithmetic from logic', sub: 'numbers · the ripple-carry adder' },
  { id: 'L4b', num: '04.5', navLabel: 'Floating point', zone: 'number', title: 'Floating point: the convenient lie of decimals', sub: 'numbers · IEEE-754 · sign · exponent · mantissa' },
  { id: 'L5', num: '05', navLabel: 'Numbers → things', zone: 'meaning', title: 'The same number, pretending to be many things', sub: 'meaning · encoding' },
  { id: 'L5b', num: '05.5', navLabel: 'Runtime', zone: 'meaning', title: 'Runtime: how code stops being text', sub: 'meaning · parsing · bytecode · machine code' },
  { id: 'L6', num: '06', navLabel: 'The CPU', zone: 'system', title: 'The CPU: a loop that obeys numbers', sub: 'systems · fetch · decode · execute' },
  { id: 'L6b', num: '06.5', navLabel: 'Cache/RAM', zone: 'system', title: 'Memory hierarchy: the CPU hates waiting', sub: 'systems · registers · cache · RAM · disk' },
  { id: 'L7', num: '07', navLabel: 'Memory', zone: 'system', title: 'Memory: numbers with addresses', sub: 'systems · arrays · the call stack' },
  { id: 'L7b', num: '07.5', navLabel: 'Structures', zone: 'system', title: 'Data structures: shapes made of addresses', sub: 'systems · arrays · hash maps · trees' },
  { id: 'L8', num: '08', navLabel: 'OS', zone: 'system', title: 'The operating system: the referee', sub: 'systems · the scheduler · syscalls' },
  { id: 'L8b', num: '08.5', navLabel: 'Security', zone: 'system', title: 'Security: boundaries that make sharing safe', sub: 'systems · permissions · isolation · trust' },
  { id: 'L9', num: '09', navLabel: 'Network', zone: 'system', title: 'The network: numbers that leave the building', sub: 'systems · encapsulation · packets · TCP/IP' },
  { id: 'L10', num: '10', navLabel: 'Cloud', zone: 'system', title: "The cloud: someone else's machines, at scale", sub: 'systems · load balancers · app servers · datastores' },
  { id: 'L10b', num: '10.5', navLabel: 'Database', zone: 'system', title: 'Databases: memory that survives questions', sub: 'systems · indexes · transactions · durability' },
  { id: 'L10c', num: '10.8', navLabel: 'UI', zone: 'meaning', title: 'Browser/UI: the stack becomes pixels', sub: 'meaning · DOM · CSS · events · paint' },
  { id: 'L11', num: '11', navLabel: 'The whole thing', zone: 'physical', title: 'The lie, all the way down', sub: 'the whole picture' },
  { id: 'L12', num: '★', navLabel: 'Trace', zone: 'all', title: 'Watch it happen: one method, every layer', sub: 'the capstone · real algorithms, traced top to bottom' },
];

// id → layer, for pulling a single layer's metadata by anchor.
export const layerById = Object.fromEntries(layers.map((l) => [l.id, l]));
