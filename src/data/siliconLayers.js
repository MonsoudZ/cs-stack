// Layers for the /silicon deep-dive — same shape as the main stack so the
// shared engine (Base nav, LayerSection, scroll-spy) powers it unchanged.
export const siliconLayers = [
  { id: 'SI0', num: '00', navLabel: 'The crystal', zone: 'physical', title: 'Silicon: a crystal that almost conducts', sub: 'physical · semiconductors · why silicon' },
  { id: 'SI1', num: '01', navLabel: 'Doping', zone: 'physical', title: 'Doping: adding carriers on purpose', sub: 'physical · n-type · p-type · electrons & holes' },
  { id: 'SI2', num: '02', navLabel: 'The junction', zone: 'physical', title: 'The PN junction: a one-way valve', sub: 'physical · the diode · depletion region' },
  { id: 'SI3', num: '03', navLabel: 'The MOSFET', zone: 'physical', title: 'The MOSFET: a voltage-controlled switch', sub: 'physical · gate · channel · threshold' },
  { id: 'SI4', num: '04', navLabel: 'Switch → gate', zone: 'all', title: 'CMOS: two switches become a logic gate', sub: 'physical · the inverter · from silicon to NOT' },
];
