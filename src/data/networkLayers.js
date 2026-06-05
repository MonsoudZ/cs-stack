// Layers for the /network deep-dive — same shape as the main stack so the
// shared engine (Base nav, LayerSection, scroll-spy) powers it unchanged.
export const networkLayers = [
  { id: 'N0', num: '00', navLabel: 'Signals', zone: 'physical', title: 'Signals: bits leave the building', sub: 'physical · copper · fiber · radio' },
  { id: 'N1', num: '01', navLabel: 'Encapsulation', zone: 'system', title: 'Encapsulation: a parcel inside a parcel', sub: 'link · each layer adds its own header' },
  { id: 'N2', num: '02', navLabel: 'Routing', zone: 'system', title: 'Routing: hopping across the internet', sub: 'network · IP addresses · hops · TTL' },
  { id: 'N3', num: '03', navLabel: 'Reliability', zone: 'system', title: 'Reliability: lost packets, retransmitted', sub: 'transport · TCP · acknowledgements · reassembly' },
  { id: 'N4', num: '04', navLabel: 'DNS', zone: 'meaning', title: 'DNS: a name becomes a number', sub: 'names · resolver · root · TLD · authoritative' },
  { id: 'N5', num: '05', navLabel: 'The request', zone: 'all', title: 'One request, all the way out and back', sub: 'the whole trip · DNS → TCP → TLS → HTTP' },
];
