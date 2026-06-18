// Barrel: the widget builders are split by area into ./widgets/*.js; this file
// re-exports them so every `import { buildX } from '../lib/widgets.js'` keeps working.
export * from './widgets/core.js';
export * from './widgets/network-compiler.js';
export * from './widgets/render-crypto-database.js';
export * from './widgets/memory-os-structures-numbers.js';
export * from './widgets/silicon-logic-cpu-concurrency-cloud.js';
export * from './widgets/consensus-languages-devops.js';
export * from './widgets/ai.js';
