// Shared JSDoc types for the engine. This file ships no runtime code — it only
// hosts @typedefs that the pure builders, the stepper store, the diagram layout
// and the Svelte shells import with `@import` / `@type` comments, so editors and
// `npm run typecheck` (tsc over src/lib + src/data, checkJs) can catch a
// mis-shaped snapshot or a mistyped builder option without a TypeScript rewrite.

/**
 * One frame of a step-through widget. Every `build*()` returns an array of
 * these; the Svelte shell renders `all()[idx]`. Builders add their own fields
 * (registers, cache lines, …) on top of this base shape.
 * @typedef {Object} Snapshot
 * @property {string} note              one-line narration shown under the widget
 * @property {string|null} [detail]     optional deeper paragraph — the Stepper's "why this step" panel
 */

/**
 * A builder: pure, no DOM, returns the full trace up front.
 * @template {Snapshot} [S=Snapshot]
 * @typedef {() => S[]} StepBuilder
 */

/**
 * The stepper store created by `createStepper` (src/lib/stepper.svelte.js).
 * @template {Snapshot} [S=Snapshot]
 * @typedef {Object} Stepper
 * @property {import('svelte/store').Writable<number>}  idx      current step index
 * @property {import('svelte/store').Writable<boolean>} autoOn   AUTO playing?
 * @property {import('svelte/store').Writable<number>}  version  bumped whenever the steps array is replaced
 * @property {import('svelte/store').Writable<number>}  rate     AUTO rate multiplier (1, 2, 0.5)
 * @property {() => void} stepOrRestart   advance one step; on the last step, restart at 0
 * @property {() => void} reset           rebuild from the builder and go to step 0
 * @property {() => void} toggleAuto      start/stop AUTO
 * @property {(buildFn: StepBuilder<S>) => void} rebuild   swap the builder (an option changed) and go to step 0
 * @property {(delta: number) => void} move                step by ±n, clamped
 * @property {(i: number) => void} setIndex                jump to a step, clamped
 * @property {(mult: number) => void} setRate              change the AUTO cadence
 * @property {() => S} current
 * @property {() => boolean} isLast
 * @property {() => S[]} all
 * @property {() => void} destroy        clear the timer + subscription
 */

/**
 * A box in the shared SVG Diagram. Grid coords are optional: `x` is the column,
 * `y` the row; without them nodes draw as a left-to-right chain.
 * @typedef {Object} FlowNode
 * @property {string} id
 * @property {string} label
 * @property {number} [x]
 * @property {number} [y]
 */

/** A link between two nodes, by id. @typedef {[string, string]} FlowEdge */

/**
 * One step of a RequestFlow trace (the system-design case studies).
 * @typedef {Object} FlowStep
 * @property {string} active                the node the request is at
 * @property {string} note
 * @property {string} [phase]               e.g. 'WRITE · W=2' — shown top-right
 * @property {Record<string, string>} [meta] per-node one-line state
 * @property {string} [warn]                node id to flag red (a miss, a stale replica)
 * @property {string|null} [response]       what the client got back, once known
 * @property {string|null} [detail]
 */

/**
 * The whole prop a RequestFlow takes.
 * @typedef {Object} Flow
 * @property {FlowNode[]} nodes
 * @property {FlowEdge[]} [edges]   default: the chain nodes[0]→nodes[1]→…
 * @property {FlowStep[]} steps
 */

/**
 * What `layoutDiagram` returns: nodes with absolute centres, edges trimmed to
 * the box borders, and the viewBox size.
 * @typedef {Object} DiagramLayout
 * @property {(FlowNode & {cx: number, cy: number})[]} nodes
 * @property {{a: string, b: string, x1: number, y1: number, x2: number, y2: number}[]} edges
 * @property {number} width
 * @property {number} height
 * @property {boolean} vertical
 */

/**
 * @typedef {Object} QuizOption
 * @property {string} label
 * @property {boolean} [correct]   exactly one option per question
 * @property {string} why          feedback shown for this choice
 */
/**
 * @typedef {Object} QuizQuestion
 * @property {'easy'|'medium'|'hard'|'check'} level
 * @property {string} question
 * @property {QuizOption[]} options
 */

/**
 * One layer/section of a page — the spine nav, LayerSection and scroll-spy all read it.
 * @typedef {Object} Layer
 * @property {string} id         DOM id (e.g. 'CP3')
 * @property {string} num        '00', '01', … shown in the nav
 * @property {string} navLabel
 * @property {'physics'|'number'|'meaning'|'system'|'security'|'all'|string} zone  colour family
 * @property {string} title
 * @property {string} sub
 */

/**
 * A deep-dive stack, as registered in src/data/stacks.js.
 * @typedef {Object} Stack
 * @property {string} slug
 * @property {string} name
 * @property {'stack'|'pipeline'} kind
 * @property {string} layer     the main-stack layer it expands ('09', 'app', …)
 * @property {string} accent    hex colour for its social card
 * @property {string} blurb
 */

export {};
