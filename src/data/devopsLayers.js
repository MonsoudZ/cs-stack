// Layers for the /devops deep-dive — same shape as the main stack so the shared
// engine (Base nav, LayerSection, scroll-spy) powers it unchanged.
export const devopsLayers = [
  { id: 'DV0', num: '00', navLabel: 'The gap', zone: 'meaning', title: 'DevOps: closing the gap from commit to production', sub: 'the dev → prod gap · ship safely, often' },
  { id: 'DV1', num: '01', navLabel: 'Integration', zone: 'system', title: 'Continuous integration: every commit, gated', sub: 'build + test on push · catch breakage in minutes' },
  { id: 'DV2', num: '02', navLabel: 'Delivery', zone: 'system', title: 'Continuous delivery: shipping without holding your breath', sub: 'automated deploys · canary · rollback' },
  { id: 'DV3', num: '03', navLabel: 'Infra as code', zone: 'system', title: 'Infrastructure as code: the environment is a file', sub: 'declarative · reproducible · version-controlled' },
  { id: 'DV4', num: '04', navLabel: 'Observability', zone: 'system', title: 'Observability: you can’t operate what you can’t see', sub: 'logs · metrics · traces · SLOs & alerts' },
  { id: 'DV5', num: '05', navLabel: 'The loop & AI', zone: 'all', title: 'The feedback loop — and what AI changes', sub: 'deploy → observe → iterate · MLOps / LLMOps' },
];
