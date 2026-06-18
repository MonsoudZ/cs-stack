// The climb through the stack: a full-stack overview, then every deep dive in
// stack order (silicon → render). Derived from stacks.js so it can't drift.
// `key` is the localStorage progress id (the same slug the quizzes write to
// `stack:progress`). PrevNext.astro walks this for the linear stack climb.
import { stacks } from './stacks.js';
import { designs } from './designs.js';

export const curriculum = [
  { key: 'home', href: '/', name: 'The full stack', layer: 'overview', blurb: 'the whole climb in one page — get the shape of it, then go deep.' },
  ...stacks.map((s) => ({
    key: s.slug,
    href: `/${s.slug}`,
    name: `The ${s.name} ${s.kind}`,
    layer: s.layer === 'app' ? 'the app on top' : `layer ${s.layer}`,
    blurb: s.blurb,
  })),
];

// The full guided path the /learn dashboard tracks: the stack climb above, then
// the system designs that put the stacks to work (small → big). Kept separate
// from `curriculum` so the linear prev/next chain stays the stack climb while
// the dashboard still counts every completable lesson.
export const guidedPath = [
  ...curriculum,
  ...designs
    .filter((d) => d.ready)
    .map((d) => ({
      key: d.slug,
      href: `/design/${d.slug}`,
      name: d.name,
      layer: `system design · ${d.tier}`,
      blurb: d.blurb,
    })),
];
