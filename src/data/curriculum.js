// The guided learning path: a full-stack overview, then every deep dive in
// stack order (silicon → render). Derived from stacks.js so the curriculum and
// the deep-dive list can never drift. `key` is the localStorage progress id.
import { stacks } from './stacks.js';

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
