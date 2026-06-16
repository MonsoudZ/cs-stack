// Layers for the /raft deep-dive — same shape as the main stack so the shared
// engine (Base nav, LayerSection, scroll-spy) powers it unchanged.
export const raftLayers = [
  { id: 'RF0', num: '00', navLabel: 'The problem', zone: 'system', title: 'Consensus: agreeing when machines fail', sub: 'distributed · replicated state machines · split-brain' },
  { id: 'RF1', num: '01', navLabel: 'Leader election', zone: 'system', title: 'Leader election: one server speaks for the cluster', sub: 'terms · votes · majorities · timeouts' },
  { id: 'RF2', num: '02', navLabel: 'Log replication', zone: 'system', title: 'Log replication: one log, copied everywhere', sub: 'AppendEntries · majority commit · apply' },
  { id: 'RF3', num: '03', navLabel: 'Safety', zone: 'system', title: 'Commitment & safety: what makes it correct', sub: 'majority rule · the up-to-date-log restriction' },
  { id: 'RF4', num: '04', navLabel: 'Leader crash', zone: 'system', title: 'When the leader crashes', sub: 'higher term wins · re-election · logs reconcile' },
  { id: 'RF5', num: '05', navLabel: 'The whole thing', zone: 'all', title: 'Raft, all at once', sub: 'the whole trip · election + replication + safety' },
];
