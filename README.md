# THE STACK — Astro + Svelte islands

An "explorable explanation" of the computing stack, from silicon to the cloud.
Restructured from a single large HTML file into a real component project: ~20
layers you can poke, climbing from electrons to the cloud, capped by a tracer
that runs a real algorithm through every layer at once.

## Why this architecture
- **Astro** ships the prose as static HTML with **zero JavaScript**. Only the
  interactive widgets become hydrated "islands" (`client:visible`), so they load
  lazily as you scroll. The page is fast and the JS is tiny and per-widget.
- **Svelte** for the step-through widgets: the clock + animation logic is far
  cleaner as reactive components than as hand-rolled DOM updates.
- Two layers are **plain `.astro` + a CSS checkbox trick** (Voltage, Transistor)
  so they're interactive with zero JS; the static explainer sections are `.astro`
  too. The spine nav and guided tour are progressive enhancement — they work
  (navigation) or degrade gracefully without JS.
- The **algorithm logic is pure, framework-agnostic JS** in `src/lib/` and is
  unit-tested; components are thin (call a builder, render the current step).

## Run it
```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static site -> dist/ (deploy anywhere)
npm test         # vitest — unit tests for the trace/sim/stepper/widget logic
npm run audit    # build + regex quality gate + axe-core a11y checks on the HTML
npm run test:e2e # playwright — drives chromium to confirm the islands hydrate & respond
npm run gen:og   # regenerate the social cards (og.png + og/<slug>.png per stack)
```
CI (`.github/workflows/ci.yml`) runs `test` + `audit` on one job and `test:e2e`
on another for every push and PR.

## Layout
```
src/
  data/layers.js          single source of truth for the main stack's layers
                          (id, num, label, zone, title, sub) — nav + sections read it
  data/networkLayers.js   the same shape for the /network deep-dive (sibling explorable)
  data/*Layers.js         one per deep-dive (memLayers, osLayers, structLayers, …)
  data/stacks.js          single source of truth for the deep-dive list — drives StackNav
  styles/                 global.css just @imports base.css + widgets.css + mobile.css
  lib/
    stepper.svelte.js     shared STEP / AUTO / RESET store — every step widget uses it
    traces.js             the capstone: 12 traced algorithms + the layer-touch maps
    sim.js                scheduler simulation + factorial call-stack builder
    widgets.js            pure build*() functions for the CPU/network/cloud widgets
    *.test.js             unit tests (answers, termination, shape, stepper lifecycle)
  components/
    LayerSection.astro    section wrapper + standard head (metadata via props)
    Stepper.svelte        shared STEP/AUTO/RESET controls (props: a stepper)
    Voltage / Transistor  .astro, CSS-only interactive (no JS)
    Mosfet / LogicGate / Bits / Adder / NumbersThings   Svelte island widgets
    Cpu / CallStack / Scheduler / Encapsulation / Packets / Cloud   step-through islands
    MemoryHierarchy / DataStructures / SecurityBoundaries /
      RuntimePipeline / DatabaseSystem / BrowserUi   static .astro explainers
    Why / Takeaway        small presentational components used per layer
    StackNav.astro        cross-stack footer (the deep-dive map) — on every page via Base
    Tracer.svelte         the multi-method capstone
    Struct.svelte         renders a trace step's data structure (hash/window/array/graph/stack)
  layouts/Base.astro      hero, SEO + JSON-LD, spine nav, guided tour, scroll script
  pages/
    index.astro           the main stack — composes the layer sections, hydrates each island
    network.astro         a /network deep-dive reusing the same engine (Base takes a `layers` prop)
    compiler.astro        a /compiler deep-dive (lex → parse → bytecode → run)
    render.astro          a /render deep-dive (DOM → style → layout → paint → composite)
    crypto.astro          a /crypto deep-dive (hashing → keys → exchange → certs → TLS)
    database.astro        a /database deep-dive (tables → indexes → queries → txns → replication)
    memory.astro          a /memory deep-dive (addresses → cache → hierarchy → virtual memory → TLB)
    os.astro              an /os deep-dive (processes → scheduler → context switch → syscalls → interrupts)
    structures.astro      a /structures deep-dive (arrays → dynamic arrays → hash maps → trees → big-O)
    numbers.astro         a /numbers deep-dive (place value → two's complement → IEEE-754 → precision → 0.1+0.2)
    cpu.astro             a /cpu deep-dive (registers → cycle → ALU → pipelining → hazards → the clock)
    silicon.astro         a /silicon deep-dive (crystal → doping → PN junction → MOSFET → CMOS inverter)
    robots.txt.js         robots.txt generated from `site`
scripts/
  audit.mjs               regex source/HTML quality gate (used by `npm run audit`)
  a11y.mjs                axe-core accessibility gate over the built HTML
  gen-og.mjs              renders the 1200x630 social cards (site + one per stack, from stacks.js)
e2e/                      playwright interaction tests
```

## The tracer
The `★ Trace` capstone runs one of **12 algorithms** step-by-step through every
layer at once — source line, VM ops, the data structure mutating in memory, and
the CPU arithmetic: two-sum (hashing), binary search, BFS, DFS, recursion,
two-pointer, sliding window, DP/memo, insertion + bubble sort, linear search,
and Kadane's max subarray. The trace + step are deep-linkable (`?trace=bfs&step=4`).

## Deploying
Set `site` in `astro.config.mjs` to your real origin before launch — it's the
only place the domain lives and it drives the canonical/OG URLs, sitemap,
robots.txt, and JSON-LD. Then `npm run build` and serve `dist/`.
