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

const PAGES = ['dist/index.html', 'dist/network/index.html', 'dist/compiler/index.html', 'dist/languages/index.html', 'dist/render/index.html', 'dist/crypto/index.html', 'dist/database/index.html', 'dist/memory/index.html', 'dist/os/index.html', 'dist/structures/index.html', 'dist/numbers/index.html', 'dist/silicon/index.html', 'dist/cpu/index.html', 'dist/concurrency/index.html', 'dist/cloud/index.html', 'dist/raft/index.html', 'dist/devops/index.html', 'dist/logic/index.html', 'dist/learn/index.html', 'dist/search/index.html', 'dist/ai/index.html', 'dist/design/index.html', 'dist/design/url-shortener/index.html', 'dist/design/rate-limiter/index.html', 'dist/design/news-feed/index.html', 'dist/design/chat/index.html', 'dist/design/twitter/index.html', 'dist/design/video/index.html', 'dist/404.html'];
let failed = false;

for (const HTML of PAGES) {
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
    failed = true;
    console.error(`\n${HTML}: axe found ${results.violations.length} accessibility violation(s):\n`);
    for (const v of results.violations) {
      console.error(`- [${v.impact}] ${v.id}: ${v.help}`);
      console.error(`  ${v.helpUrl}`);
      for (const node of v.nodes) {
        console.error(`    → ${node.target.join(' ')}`);
        const summary = (node.failureSummary || '').split('\n').filter(Boolean).join(' ');
        if (summary) console.error(`      ${summary}`);
      }
    }
  } else {
    console.log(`${HTML}: axe 0 violations · ${results.passes.length} rules passed · ${results.incomplete.length} need manual review (layout-dependent).`);
  }
}

if (failed) process.exit(1);
