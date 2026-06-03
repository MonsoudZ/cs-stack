# THE STACK — Astro + Svelte islands + MDX

An "explorable explanation" of the computing stack, from silicon to the cloud.
Restructured from a single 111KB HTML file into a real component project.

## Why this architecture
- **Astro** ships the prose as static HTML with **zero JavaScript**. Only the
  interactive widgets become hydrated "islands" (`client:visible`), so they load
  lazily as you scroll. The page is fast and the JS is tiny and per-widget.
- **Svelte** for the widgets: the step-clock + animation logic is far cleaner as
  reactive components than as hand-rolled DOM updates.
- The **validated algorithm logic is untouched** — it lives as pure JS in
  `src/lib/` (the exact functions tested in the original build). Components are
  thin: they call a builder, then render the current step.

## Run it
```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static site -> dist/ (deploy anywhere, incl. Railway)
```

## Layout
```
src/
  styles/global.css      design system (tokens + every widget class) — reused as-is
  lib/
    stepper.svelte.js     shared STEP/AUTO/RESET store — every step widget uses it
    traces.js             capstone: 4 algorithms (twosum/bsearch/bfs/recursion) + struct renderers
    sim.js                scheduler simulation + factorial call-stack builder
  components/
    Stepper.svelte        shared controls (props: a stepper)
    Voltage / Mosfet      toggle + slider widgets
    LogicGate / Bits      gate truth-table + 8-bit register
    CallStack / Scheduler step-through system widgets
    Tracer.svelte         the multi-method capstone
  layouts/Base.astro      hero, spine nav, background, scroll script
  pages/index.astro       composes the 14 layer sections, hydrates each island
```

## Status
**All 13 interactive widgets are ported and building** as Svelte islands:
−01 silicon, 00 voltage, 01 transistor, 02 logic gates, 03 bits, 04 adder,
05 numbers→things, 06 CPU, 07 memory (call stack), 08 OS (scheduler),
09 network (encapsulation + packets), 10 cloud, and the ★ tracer (now 9 algorithms).

Each step-through widget shares `createStepper` (`src/lib/stepper.svelte.js`);
the validated algorithm logic lives as pure JS in `src/lib/` and inside each
component's builder, untouched from the tested single-file original.

## Optional: move prose to MDX
`@astrojs/mdx` is installed. To author content in Markdown with inline components,
rename a page to `.mdx` and `import` the components at the top — the prose then
lives as Markdown instead of inside `index.astro`.
