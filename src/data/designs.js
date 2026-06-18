// System-design case studies — composing the stacks into real systems, ordered
// small → very big. Mirrors stacks.js: this registry drives the /design index.
// Each design is a Base page whose "layers" are its design steps.
export const TIERS = [
  { id: 'small', label: 'Small' },
  { id: 'medium', label: 'Medium' },
  { id: 'big', label: 'Very big' },
];
export const designs = [
  { slug: 'url-shortener', name: 'URL shortener', tier: 'small', ready: true, blurb: 'shorten a link, redirect fast — the canonical small system design' },
  // all on the same template (sections-as-layers + a RequestFlow widget)
  { slug: 'rate-limiter', name: 'Rate limiter', tier: 'small', ready: true, blurb: 'cap requests per client without a central bottleneck' },
  { slug: 'news-feed', name: 'News feed', tier: 'medium', ready: true, blurb: 'fan-out on write vs read, and ranking the timeline' },
  { slug: 'chat', name: 'Chat / messaging', tier: 'medium', ready: true, blurb: 'real-time delivery, presence, and message ordering' },
  { slug: 'twitter', name: 'Twitter timeline', tier: 'big', ready: true, blurb: 'the celebrity fan-out problem, at hundreds of millions of users' },
  { slug: 'video', name: 'Video streaming', tier: 'big', ready: true, blurb: 'CDNs, adaptive bitrate, and moving petabytes' },
  { slug: 'key-value-store', name: 'Distributed KV store', tier: 'big', ready: true, blurb: 'partition, replicate, and reach quorum — Dynamo/Raft, end to end' },
];

// Sections for /design/url-shortener — same shape as a stack's layers, so the
// Base engine (spine nav, scroll-spy) powers it unchanged.
export const urlShortenerSections = [
  { id: 'US0', num: '00', navLabel: 'Requirements', zone: 'meaning', title: 'Requirements: what are we actually building?', sub: 'functional + non-functional · pin the scope first' },
  { id: 'US1', num: '01', navLabel: 'Scale', zone: 'number', title: 'Scale estimate: a back-of-the-envelope', sub: 'reads vs writes · storage · the read-heavy shape' },
  { id: 'US2', num: '02', navLabel: 'Architecture', zone: 'system', title: 'The architecture: trace a request', sub: 'client · load balancer · app · cache · database' },
  { id: 'US3', num: '03', navLabel: 'Keys & data', zone: 'system', title: 'The short key, and the data model', sub: 'counter + base-62 vs hash · a key-value store' },
  { id: 'US4', num: '04', navLabel: 'Scaling', zone: 'system', title: 'Scaling & the bottlenecks', sub: 'cache hot keys · read replicas · shard · a CDN' },
  { id: 'US5', num: '05', navLabel: 'Tradeoffs', zone: 'all', title: 'Tradeoffs & the whole picture', sub: '301 vs 302 · consistency · key length' },
];
