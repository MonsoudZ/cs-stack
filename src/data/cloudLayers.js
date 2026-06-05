// Layers for the /cloud deep-dive — same shape as the main stack so the shared
// engine (Base nav, LayerSection, scroll-spy) powers it unchanged.
export const cloudLayers = [
  { id: 'CD0', num: '00', navLabel: 'Why scale out', zone: 'system', title: 'One machine isn’t enough', sub: 'cloud · vertical vs horizontal scaling' },
  { id: 'CD1', num: '01', navLabel: 'Load balancer', zone: 'system', title: 'The load balancer: one door, many servers', sub: 'cloud · distribution · health checks · failover' },
  { id: 'CD2', num: '02', navLabel: 'Stateless', zone: 'system', title: 'Stateless servers: the trick that lets you scale', sub: 'cloud · push state out · any server, any request' },
  { id: 'CD3', num: '03', navLabel: 'The request', zone: 'system', title: 'One request through the whole architecture', sub: 'cloud · balancer · app · cache · database · queue' },
  { id: 'CD4', num: '04', navLabel: 'Replication', zone: 'system', title: 'Scaling the data: replicas and their lag', sub: 'cloud · primary · read replicas · eventual consistency' },
  { id: 'CD5', num: '05', navLabel: 'The tradeoff', zone: 'all', title: 'CAP: you can’t have it all at once', sub: 'cloud · consistency vs availability under a partition' },
];
