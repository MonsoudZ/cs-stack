// Real accessibility gate: runs axe-core against the built HTML, catching the
// structural / ARIA / semantic issues the regex pass in audit.mjs cannot see
// (roles, name computation, label associations, heading order, landmarks,
// duplicate ids, list structure, etc.).
//
// Runs in jsdom — no headless browser, so it is fast and deterministic in CI.
// The cost is that layout-dependent rules can't be evaluated: `color-contrast`
// needs real rendering and is disabled here (contrast is reviewed separately).
// This checks the server-rendered HTML (the initial frame of each island).
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import axe from 'axe-core';

const HTML = 'dist/index.html';

// `outside-only`: we can inject axe via window.eval, but the page's own inline
// scripts do NOT run (they expect a real browser: matchMedia, rAF, scroll).
const dom = new JSDOM(readFileSync(HTML, 'utf8'), {
  runScripts: 'outside-only',
  pretendToBeVisual: true,
});
const { window } = dom;
window.eval(axe.source);

const results = await window.axe.run(window.document.documentElement, {
  rules: {
    'color-contrast': { enabled: false }, // needs layout/rendering jsdom lacks
  },
});

if (results.violations.length) {
  console.error(`\naxe found ${results.violations.length} accessibility violation(s):\n`);
  for (const v of results.violations) {
    console.error(`- [${v.impact}] ${v.id}: ${v.help}`);
    console.error(`  ${v.helpUrl}`);
    for (const node of v.nodes) {
      console.error(`    → ${node.target.join(' ')}`);
      const summary = (node.failureSummary || '').split('\n').filter(Boolean).join(' ');
      if (summary) console.error(`      ${summary}`);
    }
  }
  process.exit(1);
}

console.log(`axe: 0 violations · ${results.passes.length} rules passed · ${results.incomplete.length} need manual review (layout-dependent, e.g. contrast).`);
