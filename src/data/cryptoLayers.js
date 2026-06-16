// Layers for the /crypto deep-dive — same shape as the main stack so the
// shared engine (Base nav, LayerSection, scroll-spy) powers it unchanged.
export const cryptoLayers = [
  { id: 'X0', num: '00', navLabel: 'Hashing', zone: 'number', title: 'Hashing: a one-way fingerprint', sub: 'crypto · digests · the avalanche effect' },
  { id: 'X1', num: '01', navLabel: 'Symmetric', zone: 'system', title: 'Symmetric: one shared key', sub: 'crypto · fast · the key-distribution problem' },
  { id: 'X2', num: '02', navLabel: 'Asymmetric', zone: 'system', title: 'Asymmetric: a public and a private key', sub: 'crypto · public-key · encrypt vs sign' },
  { id: 'X3', num: '03', navLabel: 'Key exchange', zone: 'system', title: 'Key exchange: a secret over a public wire', sub: 'crypto · Diffie–Hellman · modular arithmetic' },
  { id: 'X4', num: '04', navLabel: 'Certificates', zone: 'system', title: 'Certificates: who vouches for a key', sub: 'crypto · trust · the CA chain' },
  { id: 'X5', num: '05', navLabel: 'TLS', zone: 'all', title: 'TLS: the whole handshake', sub: 'the whole trip · verify, agree, encrypt' },
  { id: 'X6', num: '06', navLabel: 'Signatures', zone: 'system', title: 'Signatures & Merkle trees: proving who, and what', sub: 'crypto · sign / verify · hashing up to a root' },
];
