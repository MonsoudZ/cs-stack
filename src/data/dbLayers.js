// Layers for the /database deep-dive — same shape as the main stack so the
// shared engine (Base nav, LayerSection, scroll-spy) powers it unchanged.
export const dbLayers = [
  { id: 'D0', num: '00', navLabel: 'Tables', zone: 'system', title: 'Tables: rows in a heap', sub: 'database · rows · columns · pages' },
  { id: 'D1', num: '01', navLabel: 'Indexes', zone: 'system', title: 'Indexes: find without scanning', sub: 'database · the B-tree · O(log n)' },
  { id: 'D2', num: '02', navLabel: 'Queries', zone: 'system', title: 'Queries: ask for a slice', sub: 'database · SELECT · the planner' },
  { id: 'D3', num: '03', navLabel: 'Joins', zone: 'system', title: 'Joins: stitching tables together', sub: 'database · matching on a key · nested loop vs hash' },
  { id: 'D4', num: '04', navLabel: 'Transactions', zone: 'system', title: 'Transactions: all or nothing', sub: 'database · ACID · atomicity' },
  { id: 'D5', num: '05', navLabel: 'Isolation', zone: 'system', title: 'Isolation: transactions that don’t collide', sub: 'database · dirty & non-repeatable reads · MVCC' },
  { id: 'D6', num: '06', navLabel: 'Durability', zone: 'system', title: 'Durability: surviving a crash', sub: 'database · the write-ahead log' },
  { id: 'D7', num: '07', navLabel: 'Replication', zone: 'all', title: 'Replication: copies that survive', sub: 'the whole trip · scale & failover' },
];
