# Architecture

How THE STACK is put together, and how to extend it. For the file-by-file map,
see the "Layout" section of the [README](./README.md).

## The one idea: a data-driven engine, reused everywhere

There is a single page engine — `src/layouts/Base.astro` — and every page is that
engine fed different data. Base takes:

- **`layers`** (default: the main stack from `src/data/layers.js`) — an array of
  `{ id, num, navLabel, zone, title, sub }`. Base renders the spine nav from it;
  the page renders its sections from the *same* array, so nav and content can't
  drift.
- a named **`hero`** slot — each page supplies its own hero; the default is the
  home hero.
- **`chrome`** (default `true`) — utility pages (`/404`, `/learn`) set
  `chrome={false}` to drop the spine, reader guide, tour CTA, and j/k hint;
  `.stage--bare` then gives them full width.

Base also owns the cross-cutting chrome: SEO + Open Graph/Twitter + JSON-LD, the
no-FOUC theme script + toggle, the guided tour, `j`/`k` keyboard nav, the
scroll-spy, and the `StackNav` footer.

The main stack (`src/pages/index.astro`) and all 18 deep dives (`/silicon`,
`/cpu`, …) are the same `<Base>` with a different `layers` array and hero.

## Single sources of truth (`src/data/`)

Nothing about the stack list is written twice. Each file below is the *only*
place its facts live:

| File | Owns | Consumed by |
|---|---|---|
| `layers.js` | the main stack's 23 layers (+ `layerById`) | the spine nav + `index.astro` sections + JSON-LD topics |
| `<x>Layers.js` | one per deep dive (`cpuLayers`, `memLayers`, …) | that page's nav + sections |
| `stacks.js` | the 18 deep dives: `slug, name, kind, layer, accent, blurb` | `StackNav` footer, `GoDeeper`, `SeeAlso`, per-stack OG cards, `curriculum` |
| `curriculum.js` | the guided-path order (overview + 18), derived from `stacks.js`; `key` = localStorage progress id | `/learn`, `PrevNext` |
| `quizzes.js` | one question per stack, keyed by slug | `Quiz.svelte` |

So adding a stack to `stacks.js` automatically gives it a footer card, an OG
card, a `GoDeeper` helper, a slot in the guided path, and a `PrevNext` link.

## Widgets: pure logic + a thin Svelte shell

The interactive diagrams keep their logic out of the UI:

- **Pure builders** live in `src/lib/widgets.js` (plus `sim.js`, `traces.js`).
  A `build*()` returns an array of snapshot objects — no DOM, no Svelte. They're
  unit-tested in `src/lib/widgets.test.js` (every answer, termination, and shape).
- **Svelte components** wrap a builder for display. Step-through widgets use
  `useStepper` (`src/lib/stepper.svelte.js`), which wraps the pure `createStepper`,
  auto-registers `onDestroy`, and exposes a `version` store so `$derived` views
  refresh on rebuild-at-step-0. Toggle widgets (Doping, ALU, Isolation, …) rebuild
  via `stepper.rebuild(fn)` and read `$version`.
- Shared presentational components: `LayerSection` (section wrapper + heading),
  `Stepper` (STEP/AUTO/RESET controls), `Why`, `Takeaway`, `GoDeeper`, `SeeAlso`,
  `PrevNext`, `Quiz`, `StackNav`.

Client state lives in two localStorage keys: `theme` and `stack:progress` (the
set of completed lesson keys; a correct quiz answer adds its slug).

## Quality gates

| Command | What it checks |
|---|---|
| `npm test` | vitest over the pure builders — the logic is correct |
| `npm run audit` | builds, then `scripts/audit.mjs` (regex source/HTML gate: no static `style=`, every `<button>` typed, no removed focus outlines, no placeholder copy) + `scripts/a11y.mjs` (axe-core over **every** built page; `color-contrast` is off because jsdom can't render — verify contrast separately) |
| `npm run test:e2e` | Playwright — islands actually hydrate and respond; nav, quizzes, the path, reduced motion |
| `npm run gen:og` | regenerate the social cards from `stacks.js` (committed PNGs; build/CI never run this) |

**Search** is [Pagefind](https://pagefind.app) via the `astro-pagefind`
integration: it indexes the built HTML into `dist/pagefind/` (not committed) on
every `astro build`, **and** serves `/pagefind/` in dev/preview (plain `astro
preview` only serves files Astro itself built, so it 404s a post-build index).
`<main>` is marked `data-pagefind-body` so only content is indexed (the repeated
footer/spine are excluded); `/search` hosts the Pagefind UI, themed via its CSS
vars. The index is fresh after any build; `astro dev` reuses the last build's.

CI (`.github/workflows/ci.yml`) runs them. Accessibility beyond axe (real
Lighthouse, a computed contrast sweep of the palette, label-in-name, reduced
motion) has been verified by hand; the reduced-motion reset lives in `base.css`
and is regression-tested in e2e.

## Recipe: add a new deep-dive stack `/foo`

1. **Layers** — `src/data/fooLayers.js`: `[{ id:'FO0', num:'00', navLabel, zone, title, sub }, …]`.
2. **Widgets** — add any new `build*()` to `src/lib/widgets.js` **with tests** in
   `widgets.test.js`; create Svelte components (use `useStepper` for steppers), or
   reuse existing ones.
3. **Page** — `src/pages/foo.astro`: `import Base, LayerSection, widgets, Why,
   Takeaway, GoDeeper/SeeAlso, Quiz, PrevNext`; `<Base {title} {description}
   layers={fooLayers}>` with a `slot="hero"` and one `<LayerSection {...L.FO0}>`
   per layer. End with `<Quiz slug="foo" client:visible />` then `<PrevNext slug="foo" />`.
4. **Register** — add the entry to `src/data/stacks.js` (footer/OG/curriculum/PrevNext all follow).
5. **Link in** — a `<GoDeeper slug="foo" />` under the relevant layer in
   `index.astro`, plus any `<SeeAlso slug="foo" />` cross-references.
6. **Quiz** — add a `foo` entry to `src/data/quizzes.js` (one correct option, a `why` on each).
7. **a11y gate** — append `'dist/foo/index.html'` to `PAGES` in `scripts/a11y.mjs`.
8. **OG card** — `npm run gen:og`, then commit `public/og/foo.png`.
9. **e2e** — add a test in `e2e/widgets.spec.js`; bump the footer-count assertions.
10. **Verify** — `npm test && npm run audit && npm run test:e2e`, all green.

## The deployed origin

`site` in `astro.config.mjs` (`https://cs-stack.monsoud-zanaty.workers.dev`) is the
only place the deployed origin lives; it drives canonical URLs, the sitemap,
`robots.txt`, and the absolute OG-image URLs. Change it there in one line if the
site moves (e.g. onto a custom domain).
