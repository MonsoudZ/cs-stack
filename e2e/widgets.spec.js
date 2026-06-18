import { test, expect } from '@playwright/test';

// These verify the islands actually HYDRATE and respond to input in a real
// browser — the gap unit tests can't cover (a hydration/event-wiring
// regression would otherwise ship silently). The widgets hydrate on scroll
// (client:visible), so the first interaction on each is wrapped in
// expect(...).toPass() to absorb the hydration race without double-toggling.

test('loads with the hero and no console/page errors', async ({ page }) => {
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/');
  await expect(page.locator('h1.title')).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(errors, errors.join('\n')).toEqual([]);
});

test('Bits island: flipping the high bit updates the readout', async ({ page }) => {
  await page.goto('/');
  await page.locator('#L3').scrollIntoViewIfNeeded();
  const highBit = page.getByRole('button', { name: /place value 128/ });
  const readout = page.locator('#L3 .readout');
  await expect(readout).toContainText('0');
  await expect(async () => {
    await highBit.click();
    await expect(readout).toContainText('128', { timeout: 400 });
  }).toPass({ timeout: 8000 });
  await expect(readout).toContainText('10000000'); // binary
});

test('LogicGate island: AND of 1 and 1 lights the output', async ({ page }) => {
  await page.goto('/');
  const gate = page.locator('#L2');
  await gate.scrollIntoViewIfNeeded();
  const lamp = gate.locator('.lamp');
  const inputA = gate.getByRole('button', { name: /input A/ });
  await expect(lamp).toHaveText('0'); // default AND, both inputs low
  // probe hydration with a single-click effect (A flips to pressed)
  await expect(async () => {
    await inputA.click();
    await expect(inputA).toHaveAttribute('aria-pressed', 'true', { timeout: 400 });
  }).toPass({ timeout: 8000 });
  await expect(lamp).toHaveText('0'); // 1 AND 0 is still 0
  await gate.getByRole('button', { name: /input B/ }).click();
  await expect(lamp).toHaveText('1'); // 1 AND 1 = 1
});

test('Adder island: setting the high A bit carries into a sum of 16', async ({ page }) => {
  await page.goto('/');
  const adder = page.locator('#L4');
  await adder.scrollIntoViewIfNeeded();
  await expect(adder).toContainText('= 8'); // 5 + 3
  const highBit = adder.getByRole('button', { name: /A bit 1,/ }); // worth 8
  await expect(async () => {
    await highBit.click();
    await expect(adder).toContainText('= 16', { timeout: 400 }); // 13 + 3, carry sets the overflow bit
  }).toPass({ timeout: 8000 });
});

test('Database page: own nav, B-tree finds the key, a crash without a txn loses money, isolation levels differ', async ({ page }) => {
  await page.goto('/database');
  await expect(page.locator('h1.title')).toContainText('DATABASE');
  await expect(page.locator('.spine .rung')).toHaveCount(8);
  // b-tree: descend to the found key
  const bt = page.locator('#D1');
  await bt.scrollIntoViewIfNeeded();
  for (let i = 0; i < 4; i++) {
    await bt.locator('.cpu-ctrl button').first().click();
    if (await bt.locator('.bt-key.found').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(bt.locator('.bt-key.found')).toHaveText('10');
  // joins (section D3): stepping the nested loop produces the matched result rows
  const jn = page.locator('#D3');
  await jn.scrollIntoViewIfNeeded();
  for (let i = 0; i < 12; i++) {
    await jn.locator('.cpu-ctrl button').first().click();
    if (await jn.locator('.jn-tbl.out tbody tr').count() >= 3) break;
    await page.waitForTimeout(40);
  }
  await expect(jn.locator('.jn-tbl.out tbody tr')).toHaveCount(3);
  // transaction off → the crash loses money (total drops to 250)
  const tx = page.locator('#D4');
  await tx.scrollIntoViewIfNeeded();
  const txBtn = tx.getByRole('button', { name: /transaction:/ });
  await expect(async () => {
    await txBtn.click();
    await expect(txBtn).toContainText('OFF', { timeout: 400 });
  }).toPass({ timeout: 8000 });
  for (let i = 0; i < 5; i++) {
    await tx.locator('.cpu-ctrl button').first().click();
    if (await tx.locator('.txn-acct.total.lost').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(tx.locator('.txn-acct.total .txn-val')).toHaveText('250');
  // isolation (section D5): READ UNCOMMITTED exposes a dirty read
  const iso = page.locator('#D5');
  await iso.scrollIntoViewIfNeeded();
  await expect(async () => {
    await iso.getByRole('button', { name: 'READ UNCOMMITTED' }).click();
    await expect(iso.getByRole('button', { name: 'READ UNCOMMITTED' })).toHaveAttribute('aria-pressed', 'true', { timeout: 400 });
  }).toPass({ timeout: 8000 });
  for (let i = 0; i < 8; i++) {
    await iso.locator('.cpu-ctrl button').first().click();
    if (await iso.locator('.iso-flag').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(iso.locator('.iso-flag')).toContainText('dirty read');
});

test('Memory page: own nav, fragmentation fails a malloc, a cache hits, an address translates to 122', async ({ page }) => {
  await page.goto('/memory');
  await expect(page.locator('h1.title')).toContainText('MEMORY');
  await expect(page.locator('.spine .rung')).toHaveCount(9);
  // allocator (section M2): stepping reaches a fragmented malloc that fails
  const al = page.locator('#M2');
  await al.scrollIntoViewIfNeeded();
  for (let i = 0; i < 7; i++) {
    await al.locator('.cpu-ctrl button').first().click();
    if (await al.locator('.al-heap.failed').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(al.locator('.al-heap.failed')).toBeVisible();
  // cache (now section M4): stepping eventually lands on a HIT
  const cache = page.locator('#M4');
  await cache.scrollIntoViewIfNeeded();
  for (let i = 0; i < 9; i++) {
    await cache.locator('.cpu-ctrl button').first().click();
    if (await cache.locator('.ca-badge.hit').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(cache.locator('.ca-badge.hit')).toBeVisible();
  // address translation (now section M6): resolves the first virtual address to physical 122
  const vm = page.locator('#M6');
  await vm.scrollIntoViewIfNeeded();
  for (let i = 0; i < 4; i++) {
    await vm.locator('.cpu-ctrl button').first().click();
    if (await vm.locator('.vmt-phys.show').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(vm.locator('.vmt-phys')).toContainText('122');
});

test('Cross-stack footer: lists every deep dive on home, omits the current one on a deep dive', async ({ page }) => {
  // home: every deep dive is linked, no "back to full stack" (we're home)
  await page.goto('/');
  const homeNav = page.locator('.stacknav');
  await expect(homeNav.locator('.stacknav-link')).toHaveCount(18);
  await expect(homeNav.locator('.stacknav-home')).toHaveCount(0);
  // a deep dive: the current stack is omitted (the rest) and home link returns
  await page.goto('/memory');
  const sibNav = page.locator('.stacknav');
  await expect(sibNav.locator('.stacknav-link')).toHaveCount(17);
  await expect(sibNav.getByRole('link', { name: /the Memory stack/i })).toHaveCount(0);
  // the links actually navigate to a sibling explorable
  await sibNav.getByRole('link', { name: /the Crypto stack/i }).click();
  await expect(page).toHaveURL(/\/crypto\/?$/);
  await expect(page.locator('h1.title')).toContainText('CRYPTO');
});

test('Cross-references: sibling deep-dives link to each other where concepts touch', async ({ page }) => {
  // the CPU's ALU section points to the numbers stack…
  await page.goto('/cpu');
  const ref = page.locator('#CP2 .see-also a');
  await ref.scrollIntoViewIfNeeded();
  await expect(ref).toContainText('the Numbers stack');
  await ref.click();
  await expect(page).toHaveURL(/\/numbers\/?$/);
  // …and numbers points back to the CPU (a reciprocal pair)
  const back = page.locator('#NB1 .see-also a');
  await back.scrollIntoViewIfNeeded();
  await expect(back).toContainText('the CPU stack');
  await back.click();
  await expect(page).toHaveURL(/\/cpu\/?$/);
});

test('Search: a query returns results that link to the right page', async ({ page }) => {
  await page.goto('/search');
  const input = page.locator('#search input').first();
  await input.waitFor({ state: 'visible', timeout: 8000 }); // Pagefind injects it after loading the index
  await input.fill('deadlock');
  const result = page.locator('.pagefind-ui__result a').first();
  await expect(result).toBeVisible({ timeout: 8000 });
  await expect(result).toHaveAttribute('href', /\/concurrency\/?/);
  // the footer links to search from any page
  await page.goto('/cpu');
  await expect(page.locator('.stacknav a[href="/search"]').first()).toBeVisible();
});

test('Reduced motion: the global reset neutralizes animations and transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/silicon');
  await expect(page).toHaveTitle(/SILICON|silicon/);
  // a transition present on every page (footer deep-dive card) collapses to ~0
  const td = await page.locator('.stacknav-link').first().evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(parseFloat(td)).toBeLessThan(0.01);
  // an infinite-loop animation: drive the diode to forward bias so .di-flow renders
  const di = page.locator('#SI2');
  await di.scrollIntoViewIfNeeded();
  for (let i = 0; i < 6; i++) {
    await di.locator('.cpu-ctrl button').first().click();
    if (await di.locator('.di-flow').count()) break;
    await page.waitForTimeout(40);
  }
  const ad = await di.locator('.di-flow').first().evaluate((el) => getComputedStyle(el).animationDuration);
  expect(parseFloat(ad)).toBeLessThan(0.01); // ambient pulse effectively off
});

test('Prev/next: deep dives chain through the curriculum order', async ({ page }) => {
  // a mid-stack page links back and forward to its neighbours
  await page.goto('/silicon');
  const pn = page.locator('.prevnext');
  await expect(pn.locator('.pn-prev')).toHaveAttribute('href', '/');
  const next = pn.locator('.pn-next');
  await expect(next).toHaveAttribute('href', '/logic');
  await next.click();
  await expect(page).toHaveURL(/\/logic\/?$/);
  await expect(page.locator('h1.title')).toContainText('LOGIC');
  // the last deep dive (AI, the app on top) sends you to the guided path
  await page.goto('/ai');
  await expect(page.locator('.prevnext .pn-next')).toHaveAttribute('href', '/learn');
});

test('Guided path: /learn lists the curriculum, tracks progress, and resumes', async ({ page }) => {
  await page.goto('/learn');
  await expect(page.locator('h1.title')).toContainText('LEARN');
  // 19 lessons: the full-stack overview + 18 deep dives
  await expect(page.locator('.path-item')).toHaveCount(19);
  // homepage CTA points here
  await page.goto('/');
  await expect(page.locator('.hero-path')).toHaveAttribute('href', '/learn');
  // marking a lesson done updates the count and the resume target (persisted in localStorage)
  await page.goto('/learn');
  const first = page.locator('.path-item').first().locator('.path-done');
  await expect(async () => {
    await first.click();
    await expect(first).toHaveAttribute('aria-pressed', 'true', { timeout: 400 });
  }).toPass({ timeout: 8000 });
  await expect(page.locator('#pathCount')).toContainText('1 of 19 done');
  await expect(page.locator('#pathResume')).toContainText('Resume');
  // survives a reload
  await page.reload();
  await expect(page.locator('.path-item').first().locator('.path-done')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#pathCount')).toContainText('1 of 19 done');
});

test('Quiz: wrong answer gives feedback, correct answer marks the lesson done on the path', async ({ page }) => {
  await page.goto('/numbers');
  const quiz = page.locator('.quiz');
  await quiz.scrollIntoViewIfNeeded();
  // a wrong choice → "not quite" and the correct option is revealed
  await expect(async () => {
    await quiz.getByRole('button', { name: /Floating-point hardware has bugs/ }).click();
    await expect(quiz.locator('.quiz-verdict')).toContainText('Not quite', { timeout: 400 });
  }).toPass({ timeout: 8000 });
  await expect(quiz.locator('.quiz-opt.correct')).toBeVisible();
  // reset and answer correctly
  await quiz.getByRole('button', { name: 'try again' }).click();
  await quiz.getByRole('button', { name: /no exact binary form/ }).click();
  await expect(quiz.locator('.quiz-verdict')).toContainText('Correct');
  // the tiered quiz exposes harder questions: switch to the Hard tier and solve it
  await quiz.getByRole('tab', { name: /hard/i }).click();
  await expect(quiz.locator('.quiz-q')).toContainText('x + 1.0 == x');
  await quiz.getByRole('button', { name: /spacing between representable doubles is larger than 1/ }).click();
  await expect(quiz.locator('.quiz-verdict')).toContainText('Correct');
  // the guided path now reflects the numbers lesson as done
  await page.goto('/learn');
  await expect(page.locator('.path-item[data-key="numbers"] .path-done')).toHaveAttribute('aria-pressed', 'true');
});

test('Social cards: each deep dive advertises its own per-stack OG image', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\.png$/);
  await page.goto('/memory');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\/memory\.png$/);
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', /THE MEMORY STACK/);
  // system-design case studies get their own per-design card too
  await page.goto('/design/url-shortener');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\/url-shortener\.png$/);
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', /URL shortener — a small system design/);
});

test('Cloud page: own nav, the balancer fails over, a replica read goes stale', async ({ page }) => {
  await page.goto('/cloud');
  await expect(page.locator('h1.title')).toContainText('CLOUD');
  await expect(page.locator('.spine .rung')).toHaveCount(6);
  // load balancer: stepping past the crash marks a server DOWN, traffic continues
  const lb = page.locator('#CD1');
  await lb.scrollIntoViewIfNeeded();
  for (let i = 0; i < 6; i++) {
    await lb.locator('.cpu-ctrl button').first().click();
    if (await lb.locator('.lb-server.down').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(lb.locator('.lb-server.down')).toBeVisible();
  // replication: stepping reaches a stale read from a lagging replica
  const rp = page.locator('#CD4');
  await rp.scrollIntoViewIfNeeded();
  for (let i = 0; i < 4; i++) {
    await rp.locator('.cpu-ctrl button').first().click();
    if (await rp.locator('.rp-read.stale').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(rp.locator('.rp-read.stale')).toContainText('stale');
});

test('Raft page: own nav, an election produces a leader, a log entry commits on a majority', async ({ page }) => {
  await page.goto('/raft');
  await expect(page.locator('h1.title')).toContainText('CONSENSUS');
  await expect(page.locator('.spine .rung')).toHaveCount(6);
  // leader election (section RF1): stepping reaches a node that becomes leader
  const el = page.locator('#RF1');
  await el.scrollIntoViewIfNeeded();
  for (let i = 0; i < 8; i++) {
    await el.locator('.cpu-ctrl button').first().click();
    if (await el.locator('.rft-node.leader').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(el.locator('.rft-node.leader')).toBeVisible();
  // log replication (section RF2): stepping commits an entry once a majority store it
  const lg = page.locator('#RF2');
  await lg.scrollIntoViewIfNeeded();
  for (let i = 0; i < 8; i++) {
    await lg.locator('.cpu-ctrl button').first().click();
    if (await lg.locator('.rl-entry.committed').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(lg.locator('.rl-entry.committed').first()).toBeVisible();
});

test('Languages page: own nav, the run-model widget reveals JIT, the memory widget shows a manual leak', async ({ page }) => {
  await page.goto('/languages');
  await expect(page.locator('h1.title')).toContainText('LANGUAGES');
  await expect(page.locator('.spine .rung')).toHaveCount(6);
  // run models (LA1): stepping reveals each language, ending with the JIT lane (JS)
  const run = page.locator('#LA1');
  await run.scrollIntoViewIfNeeded();
  for (let i = 0; i < 8; i++) {
    await run.locator('.cpu-ctrl button').first().click();
    if (await run.locator('.lr-lane.m-JIT.shown').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(run.locator('.lr-lane.m-JIT.shown')).toBeVisible();
  // memory models (LA3): stepping reaches the manual-free leak
  const mem = page.locator('#LA3');
  await mem.scrollIntoViewIfNeeded();
  for (let i = 0; i < 6; i++) {
    await mem.locator('.cpu-ctrl button').first().click();
    if (await mem.locator('.lm-block.leaked').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(mem.locator('.lm-block.leaked')).toBeVisible();
  // the capstone comparison table lists all five languages
  await expect(page.locator('#LA5 .lang-tbl tbody tr')).toHaveCount(5);
});

test('DevOps page: own nav, a CI gate fails and blocks the commit, a canary deploy rolls back', async ({ page }) => {
  await page.goto('/devops');
  await expect(page.locator('h1.title')).toContainText('DEVOPS');
  await expect(page.locator('.spine .rung')).toHaveCount(6);
  // CI pipeline (DV1): stepping reaches a failed gate that blocks the commit
  const ci = page.locator('#DV1');
  await ci.scrollIntoViewIfNeeded();
  for (let i = 0; i < 8; i++) {
    await ci.locator('.cpu-ctrl button').first().click();
    if (await ci.locator('.ci-stage.fail').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(ci.locator('.ci-stage.fail')).toBeVisible();
  // canary deploy (DV2): stepping reaches the auto-rollback after the error spike
  const dp = page.locator('#DV2');
  await dp.scrollIntoViewIfNeeded();
  for (let i = 0; i < 10; i++) {
    await dp.locator('.cpu-ctrl button').first().click();
    if (await dp.locator('.dp-flag.bad').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(dp.locator('.dp-flag.bad')).toBeVisible();
});

test('System design: the index links to the URL-shortener case study, which traces a request to a cache hit', async ({ page }) => {
  // index lists the case study and links to it
  await page.goto('/design');
  await expect(page.locator('h1.title')).toContainText('DESIGN');
  const card = page.getByRole('link', { name: /URL shortener/i });
  await expect(card).toBeVisible();
  await card.click();
  await expect(page).toHaveURL(/\/design\/url-shortener\/?$/);
  await expect(page.locator('h1.title')).toContainText('URL');
  await expect(page.locator('.spine .rung')).toHaveCount(6);
  // the generic request-flow widget (section US2): stepping reaches a cache HIT
  const rf = page.locator('#US2');
  await rf.scrollIntoViewIfNeeded();
  const hit = rf.locator('.rf-node .rf-meta', { hasText: 'HIT' });
  for (let i = 0; i < 16; i++) {
    await rf.locator('.cpu-ctrl button').first().click();
    if (await hit.count()) break;
    await page.waitForTimeout(40);
  }
  await expect(hit).toBeVisible();
  // the case study carries a tiered quiz
  await expect(page.locator('.quiz .quiz-level')).toHaveCount(3);
});

test('System design: the rate-limiter case study traces a request to a 429 rejection (generic RequestFlow)', async ({ page }) => {
  await page.goto('/design/rate-limiter');
  await expect(page.locator('h1.title')).toContainText('RATE');
  await expect(page.locator('.spine .rung')).toHaveCount(6);
  // the generic request-flow widget: stepping past the bucket emptying flags a rejection
  const rf = page.locator('#RL2');
  await rf.scrollIntoViewIfNeeded();
  for (let i = 0; i < 16; i++) {
    await rf.locator('.cpu-ctrl button').first().click();
    if (await rf.locator('.rf-node.warn').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(rf.locator('.rf-node.warn')).toBeVisible();
});

test('System design: the distributed KV store traces a quorum write/read to a lagging replica (generic RequestFlow)', async ({ page }) => {
  await page.goto('/design');
  const card = page.getByRole('link', { name: /Distributed KV store/i });
  await expect(card).toBeVisible();
  await card.click();
  await expect(page).toHaveURL(/\/design\/key-value-store\/?$/);
  await expect(page.locator('h1.title')).toContainText('KEY-VALUE');
  await expect(page.locator('.spine .rung')).toHaveCount(6);
  // the quorum widget (section KV3): stepping reaches a stale/lagging replica (flagged)
  const rf = page.locator('#KV3');
  await rf.scrollIntoViewIfNeeded();
  for (let i = 0; i < 16; i++) {
    await rf.locator('.cpu-ctrl button').first().click();
    if (await rf.locator('.rf-node.warn').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(rf.locator('.rf-node.warn')).toBeVisible();
  await expect(page.locator('.quiz .quiz-level')).toHaveCount(3);
});

test('Concurrency page: own nav, two locks deadlock, compare-and-swap stays correct', async ({ page }) => {
  await page.goto('/concurrency');
  await expect(page.locator('h1.title')).toContainText('CONCURRENCY');
  await expect(page.locator('.spine .rung')).toHaveCount(5);
  // deadlock: stepping the opposite-order locks reaches a circular wait
  const dl = page.locator('#CC2');
  await dl.scrollIntoViewIfNeeded();
  for (let i = 0; i < 7; i++) {
    await dl.locator('.cpu-ctrl button').first().click();
    if (await dl.locator('.dl-banner').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(dl.locator('.dl-banner')).toContainText('DEADLOCK');
  // compare-and-swap: one CAS fails (the race) but the counter still ends at 2
  const cas = page.locator('#CC3');
  await cas.scrollIntoViewIfNeeded();
  for (let i = 0; i < 8; i++) {
    await cas.locator('.cpu-ctrl button').first().click();
    if (await cas.locator('.cas-attempt.fail').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(cas.locator('.cas-attempt.fail')).toBeVisible();
  // step to the end and confirm both increments landed
  for (let i = 0; i < 3; i++) await cas.locator('.cpu-ctrl button').first().click();
  await expect(cas.locator('.cas-counter')).toContainText('2');
});

test('CPU page: own nav, the ALU computes AND, the pipeline overlaps five stages', async ({ page }) => {
  await page.goto('/cpu');
  await expect(page.locator('h1.title')).toContainText('CPU');
  await expect(page.locator('.spine .rung')).toHaveCount(6);
  // ALU: default ADD of 200 + 100 wraps to 44 with the carry flag set
  const alu = page.locator('#CP2');
  await alu.scrollIntoViewIfNeeded();
  await expect(alu.locator('.alu-dec')).toContainText('44');
  // switching to AND recomputes (200 & 100 = 64)
  await expect(async () => {
    await alu.getByRole('button', { name: 'AND' }).click();
    await expect(alu.locator('.alu-dec')).toContainText('64', { timeout: 400 });
  }).toPass({ timeout: 8000 });
  // pipeline: stepping fills all five stages at once (steady-state overlap)
  const pl = page.locator('#CP3');
  await pl.scrollIntoViewIfNeeded();
  for (let i = 0; i < 6; i++) {
    await pl.locator('.cpu-ctrl button').first().click();
    if (await pl.locator('.st-wb').count()) break;
    await page.waitForTimeout(40);
  }
  // at steady state every stage class is present exactly once
  for (const st of ['st-if', 'st-id', 'st-ex', 'st-mem', 'st-wb']) {
    await expect(pl.locator('.' + st)).toHaveCount(1);
  }
});

test('Silicon page: own nav, doping adds carriers, the diode conducts forward, CMOS inverts', async ({ page }) => {
  await page.goto('/silicon');
  await expect(page.locator('h1.title')).toContainText('SILICON');
  await expect(page.locator('.spine .rung')).toHaveCount(5);
  // doping: choosing n-type reveals a free-electron carrier
  const dope = page.locator('#SI1');
  await dope.scrollIntoViewIfNeeded();
  await expect(async () => {
    await dope.getByRole('button', { name: 'n-type' }).click();
    await expect(dope.locator('.dope-carrier.el')).toBeVisible({ timeout: 400 });
  }).toPass({ timeout: 8000 });
  await expect(dope.locator('.dope-v.el')).toContainText('free electrons');
  // diode: stepping reaches a forward bias where current flows
  const di = page.locator('#SI2');
  await di.scrollIntoViewIfNeeded();
  for (let i = 0; i < 5; i++) {
    await di.locator('.cpu-ctrl button').first().click();
    if (await di.locator('.di-junction.flow').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(di.locator('.di-junction.flow')).toBeVisible();
  // CMOS inverter: input HIGH must give output LOW (a NOT gate)
  const cm = page.locator('#SI4');
  await cm.scrollIntoViewIfNeeded();
  await expect(cm.locator('.inv-out')).toContainText('HIGH'); // default input LOW → output HIGH
  await expect(async () => {
    await cm.locator('.inv-in').click();
    await expect(cm.locator('.inv-out')).toContainText('LOW', { timeout: 400 });
  }).toPass({ timeout: 8000 });
  await expect(cm.locator('.inv-fet.n.on')).toBeVisible(); // nMOS pulls down
});

test('Numbers page: own nav, two’s complement negates to −5, and 0.1 + 0.2 ≠ 0.3', async ({ page }) => {
  await page.goto('/numbers');
  await expect(page.locator('h1.title')).toContainText('NUMBERS');
  await expect(page.locator('.spine .rung')).toHaveCount(5);
  // two's complement: stepping negates +5 to -5
  const tc = page.locator('#NB1');
  await tc.scrollIntoViewIfNeeded();
  for (let i = 0; i < 4; i++) {
    await tc.locator('.cpu-ctrl button').first().click();
    if ((await tc.locator('.tc-val').textContent())?.includes('-5')) break;
    await page.waitForTimeout(40);
  }
  await expect(tc.locator('.tc-val')).toContainText('-5');
  // float sum: stepping reaches the verdict that the equality is false
  const fs = page.locator('#NB4');
  await fs.scrollIntoViewIfNeeded();
  for (let i = 0; i < 6; i++) {
    await fs.locator('.cpu-ctrl button').first().click();
    if (await fs.locator('.fs-verdict').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(fs.locator('.fs-verdict')).toContainText('false');
  await expect(page.locator('#NB4 .fs-val').first()).toContainText('0.1000000000000000');
});

test('Structures page: own nav, the array grows by doubling, a hash lookup finds its key, BFS visits every node', async ({ page }) => {
  await page.goto('/structures');
  await expect(page.locator('h1.title')).toContainText('STRUCTURES');
  await expect(page.locator('.spine .rung')).toHaveCount(8);
  // dynamic array (now section S2): stepping triggers a capacity doubling
  const da = page.locator('#S2');
  await da.scrollIntoViewIfNeeded();
  for (let i = 0; i < 6; i++) {
    await da.locator('.cpu-ctrl button').first().click();
    if (await da.locator('.da-cells.grew').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(da.locator('.da-cells.grew')).toBeVisible();
  // hash map (now section S4): stepping finds "bird" in its chain
  const hm = page.locator('#S4');
  await hm.scrollIntoViewIfNeeded();
  for (let i = 0; i < 8; i++) {
    await hm.locator('.cpu-ctrl button').first().click();
    if (await hm.locator('.hm-key.hit').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(hm.locator('.hm-key.hit')).toHaveText('bird');
  // graph (section S6): BFS eventually visits node E (the last, deepest node)
  const gr = page.locator('#S6');
  await gr.scrollIntoViewIfNeeded();
  for (let i = 0; i < 7; i++) {
    await gr.locator('.cpu-ctrl button').first().click();
    if (await gr.locator('.gr-node.seen').count() >= 5) break;
    await page.waitForTimeout(40);
  }
  await expect(gr.locator('.gr-node.seen')).toHaveCount(5);
});

test('OS page: own nav, the scheduler runs a process, a syscall traps, a path resolves to blocks', async ({ page }) => {
  await page.goto('/os');
  await expect(page.locator('h1.title')).toContainText('OS');
  await expect(page.locator('.spine .rung')).toHaveCount(8);
  // scheduler: stepping puts a process on the core
  const sch = page.locator('#O1');
  await sch.scrollIntoViewIfNeeded();
  for (let i = 0; i < 3; i++) {
    await sch.locator('.cpu-ctrl button').first().click();
    if (await sch.locator('.proc-core').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(sch.locator('.proc-core')).toBeVisible();
  // syscall: stepping crosses into kernel mode and blocks on I/O
  const sc = page.locator('#O3');
  await sc.scrollIntoViewIfNeeded();
  for (let i = 0; i < 6; i++) {
    await sc.locator('.cpu-ctrl button').first().click();
    if (await sc.locator('.sc-marker.blocked').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(sc.locator('.sc-lane.kern.active')).toBeVisible();
  await expect(sc.locator('.sc-marker.blocked')).toContainText('blocked');
  // filesystem (section O5): stepping resolves /docs/notes.txt down to its data blocks
  const fs = page.locator('#O5');
  await fs.scrollIntoViewIfNeeded();
  for (let i = 0; i < 6; i++) {
    await fs.locator('.cpu-ctrl button').first().click();
    if (await fs.locator('.pr-block').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(fs.locator('.pr-block').first()).toBeVisible();
});

test('Crypto page: own nav, hash avalanches, DH agrees on a shared secret', async ({ page }) => {
  await page.goto('/crypto');
  await expect(page.locator('h1.title')).toContainText('CRYPTO');
  await expect(page.locator('.spine .rung')).toHaveCount(7);
  // hash: changing the input changes the digest
  const hash = page.locator('#X0');
  await hash.scrollIntoViewIfNeeded();
  const hex = hash.locator('.hash-hex').first();
  const before = (await hex.textContent()) || '';
  await expect(async () => {
    await hash.locator('#hashtext').fill('world');
    await expect(hex).not.toHaveText(before, { timeout: 400 });
  }).toPass({ timeout: 8000 });
  // diffie-hellman: step until both sides agree, secret = 2
  const dh = page.locator('#X3');
  await dh.scrollIntoViewIfNeeded();
  for (let i = 0; i < 9; i++) {
    await dh.locator('.cpu-ctrl button').first().click();
    if (await dh.locator('.dh-shared.on').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(dh.locator('.dh-shared.on').first()).toHaveText('2');
  // signatures & merkle (section X6): stepping the merkle build reaches a tampered
  // block that breaks the root hash
  const mk = page.locator('#X6 .widget').nth(1); // the second widget is the Merkle tree
  await mk.scrollIntoViewIfNeeded();
  for (let i = 0; i < 12; i++) {
    await mk.locator('.cpu-ctrl button').first().click();
    if (await mk.locator('.mk-node.root.bad').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(mk.locator('.mk-node.root.bad')).toBeVisible();
});

test('Render page: own nav, transform re-runs only composite, the event loop renders once', async ({ page }) => {
  await page.goto('/render');
  await expect(page.locator('h1.title')).toContainText('RENDER');
  await expect(page.locator('.spine .rung')).toHaveCount(8);
  // critical rendering path (section R4): stepping a load reaches first paint
  const crp = page.locator('#R4');
  await crp.scrollIntoViewIfNeeded();
  for (let i = 0; i < 8; i++) {
    await crp.locator('.cpu-ctrl button').first().click();
    if (await crp.locator('.crp-paint.on').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(crp.locator('.crp-paint.on')).toContainText('first paint');
  // what re-runs (now section R5): transform only re-composites
  const ri = page.locator('#R5');
  await ri.scrollIntoViewIfNeeded();
  await expect(ri.locator('.ri-stage.rerun')).toHaveCount(3); // default (width) re-runs all three
  await expect(async () => {
    await ri.getByRole('button', { name: /transform/ }).click();
    await expect(ri.locator('.ri-stage.rerun')).toHaveCount(1, { timeout: 400 });
  }).toPass({ timeout: 8000 });
  await expect(ri.locator('.ri-stage.rerun .ri-name')).toHaveText('Composite'); // the cheap path
  // event loop (now section R6): stepping a turn ends in a painted frame
  const el = page.locator('#R6');
  await el.scrollIntoViewIfNeeded();
  for (let i = 0; i < 9; i++) {
    await el.locator('.cpu-ctrl button').first().click();
    if (await el.locator('.el-render.done').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(el.locator('.el-render.done')).toBeVisible();
});

test('AI page: own nav, the neuron acts as a gate, the LLM predicts the next token', async ({ page }) => {
  await page.goto('/ai');
  await expect(page.locator('h1.title')).toContainText('AI');
  await expect(page.locator('.spine .rung')).toHaveCount(9);
  // neuron (AI0): default [1,0] with weights [1,1] bias −1.5 → output 0; turn x2 on → 1
  const nu = page.locator('#AI0');
  await nu.scrollIntoViewIfNeeded();
  await expect(nu.locator('.nu-oval')).toHaveText('0');
  await expect(async () => {
    await nu.getByRole('button', { name: /x2/ }).click();
    await expect(nu.locator('.nu-oval')).toHaveText('1', { timeout: 400 });
  }).toPass({ timeout: 8000 });
  // language model (now AI5): "mat" is the top next-token by default
  const nt = page.locator('#AI5');
  await nt.scrollIntoViewIfNeeded();
  await expect(nt.locator('.nt-row').first().locator('.nt-tok')).toHaveText('mat');
  await expect(nt.locator('.nt-fill.topp')).toBeVisible(); // the top token's bar is marked
});

test('Logic page: own nav, NAND builds AND, and the multiplexer selects an input', async ({ page }) => {
  await page.goto('/logic');
  await expect(page.locator('h1.title')).toContainText('LOGIC');
  await expect(page.locator('.spine .rung')).toHaveCount(6);
  // NAND universality (section LG2): the AND built from NAND matches the real AND
  const uni = page.locator('#LG2');
  await uni.scrollIntoViewIfNeeded();
  await expect(uni.getByRole('button', { name: 'AND' })).toBeVisible();
  await expect(uni.locator('.uni-ok')).toHaveCount(4);       // 4-row truth table
  await expect(uni.locator('.uni-ok', { hasText: '✗' })).toHaveCount(0); // every row matches
  // multiplexer (section LG3): select picks which input reaches the output
  const mux = page.locator('#LG3');
  await mux.scrollIntoViewIfNeeded();
  // default a=0, b=1, sel=0 → out follows a = 0
  await expect(mux.locator('.mux-out .mux-bit')).toHaveText('0');
  await expect(async () => {
    await mux.locator('.mux-selbtn').click();                // sel → 1, route b
    await expect(mux.locator('.mux-out .mux-bit')).toHaveText('1', { timeout: 400 });
  }).toPass({ timeout: 8000 });
});

test('Compiler page: own nav, tokenizer emits tokens, type checking rejects a bug, the VM evaluates to 11, the optimizer folds to return 16', async ({ page }) => {
  await page.goto('/compiler');
  await expect(page.locator('h1.title')).toContainText('COMPILER');
  await expect(page.locator('.spine .rung')).toHaveCount(9);
  // lexer: stepping emits tokens
  const lex = page.locator('#K1');
  await lex.scrollIntoViewIfNeeded();
  for (let i = 0; i < 5; i++) {
    await lex.locator('.cpu-ctrl button').first().click();
    if (await lex.locator('.lex-tok').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(lex.locator('.lex-tok').first()).toBeVisible();
  // type checking (section K3): toggling in a bug surfaces a type error
  const tc = page.locator('#K3');
  await tc.scrollIntoViewIfNeeded();
  await expect(async () => {
    await tc.getByRole('button', { name: /program:/ }).click();
    await expect(tc.getByRole('button', { name: /program:/ })).toContainText('has a bug', { timeout: 400 });
  }).toPass({ timeout: 8000 });
  for (let i = 0; i < 6; i++) {
    await tc.locator('.cpu-ctrl button').first().click();
    if (await tc.locator('.tc-verdict.bad').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(tc.locator('.tc-verdict.bad')).toContainText('type error');
  // scope resolution (also section K3, the second widget): stepping resolves
  // references and ends on an undefined name
  const scope = page.locator('#K3 .widget').nth(1);
  await scope.scrollIntoViewIfNeeded();
  for (let i = 0; i < 8; i++) {
    await scope.locator('.cpu-ctrl button').first().click();
    if (await scope.locator('.sc-result.bad').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(scope.locator('.sc-result.bad')).toContainText('undefined');
  // VM (now section K4): stepping runs the bytecode to a result of 11
  const vm = page.locator('#K4');
  await vm.scrollIntoViewIfNeeded();
  for (let i = 0; i < 8; i++) {
    await vm.locator('.cpu-ctrl button').first().click();
    if (await vm.locator('.vm-result.show').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(vm.locator('.vm-result')).toContainText('11');
  // optimizer (section K5): stepping the passes collapses the program to a single `return 16`
  const opt = page.locator('#K5');
  await opt.scrollIntoViewIfNeeded();
  await expect(opt.locator('.opt-line')).toHaveCount(5); // starts at the 5-line program
  for (let i = 0; i < 10; i++) {
    await opt.locator('.cpu-ctrl button').first().click();
    if ((await opt.locator('.opt-line').count()) === 1) break;
    await page.waitForTimeout(40);
  }
  await expect(opt.locator('.opt-line')).toHaveCount(1);
  await expect(opt.locator('.opt-prog')).toContainText('return 16');
  // AST (section K2): stepping reduces the tree bottom-up to a single 11
  const ast = page.locator('#K2');
  await ast.scrollIntoViewIfNeeded();
  await expect(ast.locator('.ast-val')).toHaveCount(5); // +, 3, ×, 4, 2
  for (let i = 0; i < 10; i++) {
    await ast.locator('.cpu-ctrl button').first().click();
    if ((await ast.locator('.ast-val').count()) === 1) break;
    await page.waitForTimeout(40);
  }
  await expect(ast.locator('.ast-val')).toHaveCount(1);
  await expect(ast.locator('.ast-val')).toContainText('11');
  // runtimes (section K6): interpreter leads cold, a compiled strategy leads after the run
  const rt = page.locator('#K6');
  await rt.scrollIntoViewIfNeeded();
  await expect(rt.locator('.rt-lead')).toContainText('interpreter');
  for (let i = 0; i < 8; i++) {
    await rt.locator('.cpu-ctrl button').first().click();
    if (/after 100/.test(await rt.locator('.rt-iters').innerText())) break;
    await page.waitForTimeout(40);
  }
  await expect(rt.locator('.rt-iters')).toContainText('100');
  await expect(rt.locator('.rt-lead')).toContainText('AOT');
  // registers (section KR): stepping allocates 2 registers and spills c to the stack
  const reg = page.locator('#KR');
  await reg.scrollIntoViewIfNeeded();
  for (let i = 0; i < 8; i++) {
    await reg.locator('.cpu-ctrl button').first().click();
    if (await reg.locator('.reg-badge.b-spill', { hasText: 'stack' }).count()) break;
    await page.waitForTimeout(40);
  }
  await expect(reg.locator('.reg-badge.b-spill')).toContainText('stack');
  await expect(reg.locator('.reg-row .reg-badge', { hasText: 'R0' }).first()).toBeVisible();
});

test('Network page: own nav, routing TTL counts down, DNS resolves, HTTP returns 200', async ({ page }) => {
  await page.goto('/network');
  await expect(page.locator('h1.title')).toContainText('NETWORK');
  await expect(page.locator('.spine .rung')).toHaveCount(9); // its own layer set
  // routing: stepping drops the TTL
  const routing = page.locator('#N2');
  await routing.scrollIntoViewIfNeeded();
  const ttl = routing.locator('.ttlval');
  await expect(ttl).toHaveText('6');
  const rstep = () => routing.locator('.cpu-ctrl button').first();
  await expect(async () => {
    await rstep().click();
    await expect(ttl).toHaveText('5', { timeout: 400 });
  }).toPass({ timeout: 8000 });
  // congestion control (section N4): stepping past the handshake and ramp reaches
  // a loss that collapses the congestion window
  const tcp = page.locator('#N4');
  await tcp.scrollIntoViewIfNeeded();
  for (let i = 0; i < 12; i++) {
    await tcp.locator('.cpu-ctrl button').first().click();
    if (await tcp.locator('.tcp-cwnd.lost').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(tcp.locator('.tcp-cwnd.lost')).toBeVisible();
  // dns: stepping the walk reveals the resolved IP
  const dns = page.locator('#N5');
  await dns.scrollIntoViewIfNeeded();
  for (let i = 0; i < 8; i++) {
    await dns.locator('.cpu-ctrl button').first().click();
    if (await dns.locator('.dns-ans').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(dns.locator('.dns-ans').first()).toContainText('93.184');
  // http (section N7): stepping the exchange surfaces the 200 status line
  const http = page.locator('#N7');
  await http.scrollIntoViewIfNeeded();
  for (let i = 0; i < 8; i++) {
    await http.locator('.cpu-ctrl button').first().click();
    if (await http.locator('.http-line.status').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(http.locator('.http-line.status')).toContainText('200');
});

test('RaceCondition island: no lock loses an update; a lock prevents it', async ({ page }) => {
  await page.goto('/');
  const race = page.locator('#L8a');
  await race.scrollIntoViewIfNeeded();
  const counter = race.locator('.counter');
  const step = () => race.locator('.cpu-ctrl button').first();
  // step the racy interleaving until the lost-update appears (loop absorbs hydration, breaks before restart)
  for (let i = 0; i < 14; i++) {
    await step().click();
    if (await counter.evaluate((el) => el.classList.contains('lost'))) break;
    await page.waitForTimeout(40);
  }
  await expect(counter).toHaveText('1'); // an increment was lost
  await expect(counter).toHaveClass(/lost/);
  // turn the lock on (rebuilds at step 0) and run again → both increments count
  await race.getByRole('button', { name: /lock:/ }).click();
  for (let i = 0; i < 16; i++) {
    await step().click();
    if (((await counter.textContent()) || '').trim() === '2') break;
    await page.waitForTimeout(40);
  }
  await expect(counter).toHaveText('2');
});

test('FlipFlop island: Q holds its bit until the clock ticks', async ({ page }) => {
  await page.goto('/');
  const ff = page.locator('#L2b');
  await ff.scrollIntoViewIfNeeded();
  const q = ff.locator('.ff-out');
  await expect(q).toHaveText('0');
  const dBtn = ff.getByRole('button', { name: /data input/ });
  await expect(async () => {
    await dBtn.click();
    await expect(dBtn).toHaveAttribute('aria-pressed', 'true', { timeout: 400 }); // hydration probe
  }).toPass({ timeout: 8000 });
  await expect(q).toHaveText('0'); // Q held while D changed — the whole point
  await ff.getByRole('button', { name: /tick/i }).click();
  await expect(q).toHaveText('1'); // the tick captured D
});

test('FloatBits island: toggling the sign bit negates the value', async ({ page }) => {
  await page.goto('/');
  const widget = page.locator('#L4b');
  await widget.scrollIntoViewIfNeeded();
  const val = widget.locator('.val');
  await expect(val).toContainText('1.5'); // default mini-float
  const signBit = widget.getByRole('button', { name: /sign bit/ });
  await expect(async () => {
    await signBit.click();
    await expect(val).toContainText('-1.5', { timeout: 400 });
  }).toPass({ timeout: 8000 });
});

test('Voltage (CSS-only): tapping the wire flips LOW to HIGH with no JS', async ({ page }) => {
  await page.goto('/');
  const widget = page.locator('.voltage-static');
  await widget.scrollIntoViewIfNeeded();
  const high = widget.locator('.voltage-state .state-high');
  const low = widget.locator('.voltage-state .state-low');
  await expect(low).toBeVisible();
  await expect(high).toBeHidden();
  await widget.locator('label.voltage-wire').click();
  await expect(high).toBeVisible(); // HIGH now shown
  await expect(low).toBeHidden();
});

test('Cloud island: toggling the cache flips between miss and hit', async ({ page }) => {
  await page.goto('/');
  const cloud = page.locator('#L10');
  await cloud.scrollIntoViewIfNeeded();
  const cacheBtn = cloud.getByRole('button', { name: /cache:/ });
  await expect(cacheBtn).toContainText('COLD');
  await expect(async () => {
    await cacheBtn.click();
    await expect(cacheBtn).toContainText('WARM', { timeout: 400 });
  }).toPass({ timeout: 8000 });
  await expect(cloud.locator('.cloudlat')).toHaveClass(/warm/);
});

test('Tracer island: STEP advances and switching method resets the step', async ({ page }) => {
  await page.goto('/');
  const tracer = page.locator('.trace-widget');
  await tracer.scrollIntoViewIfNeeded();
  const counter = page.locator('.trace-progress span').first();
  const step = tracer.getByRole('button', { name: /STEP/ });
  await expect(counter).toHaveText('1');
  await expect(async () => {
    await step.click();
    await expect(counter).toHaveText('2', { timeout: 400 });
  }).toPass({ timeout: 8000 });
  // method switch rebuilds the steps and resets to 1 (the $version reactivity fix)
  await tracer.getByRole('button', { name: 'Binary search' }).click();
  await expect(page.locator('.trace-title')).toHaveText('Binary search');
  await expect(counter).toHaveText('1');
});

test('Spine nav: clicking a rung deep-links the layer into the URL', async ({ page }) => {
  await page.goto('/');
  await page.locator('.spine .rung', { hasText: 'Trace' }).click();
  await expect(page).toHaveURL(/#L12$/);
});

test('Top nav: lists every stack, marks the current one, and links across', async ({ page }) => {
  await page.goto('/compiler');
  const nav = page.locator('nav.topnav');
  await expect(nav).toBeVisible();
  // one pill per stack (18), plus the brand link home
  await expect(nav.locator('.topnav-pill')).toHaveCount(18);
  await expect(nav.locator('.topnav-brand')).toHaveAttribute('href', '/');
  // the current stack's pill is highlighted
  const current = nav.locator('.topnav-pill[aria-current="page"]');
  await expect(current).toHaveCount(1);
  await expect(current).toHaveText(/Compiler/);
  await expect(current.locator('.topnav-num')).toHaveText('08'); // compiler is layer 08
  // clicking another pill navigates to that stack
  await nav.locator('.topnav-pill', { hasText: 'Network' }).click();
  await expect(page).toHaveURL(/\/network\/?$/);
  await expect(page.locator('nav.topnav .topnav-pill[aria-current="page"]')).toHaveText(/Network/);
});

test('Theme toggle: flips data-theme and persists the choice', async ({ page }) => {
  await page.goto('/');
  const toggle = page.locator('#themeToggle');
  await expect(toggle).toBeVisible(); // revealed by JS
  const before = await page.evaluate(() => document.documentElement.dataset.theme);
  await toggle.click();
  const after = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(after).not.toBe(before);
  expect(['light', 'dark']).toContain(after);
  const stored = await page.evaluate(() => localStorage.getItem('theme'));
  expect(stored).toBe(after); // persisted
});

test('Skip link: focuses, slides in, and jumps focus to the content', async ({ page }) => {
  await page.goto('/');
  const skip = page.locator('.skip-link');
  await skip.focus();
  await expect(skip).toBeFocused();
  await skip.click();
  await expect(page).toHaveURL(/#main$/);
  await expect(page.locator('#main')).toBeFocused();
});

test('Print: Why panels expand on beforeprint and restore on afterprint', async ({ page }) => {
  await page.goto('/');
  const why = page.locator('details.why').first();
  await expect(why).toHaveJSProperty('open', false);
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  await expect(why).toHaveJSProperty('open', true);
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await expect(why).toHaveJSProperty('open', false);
});

test('Keyboard nav: j jumps from the first layer to the next', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('j');
  await expect(page).toHaveURL(/#L0$/); // Lsi → L0
});

test('Guided tour: reveals, starts, advances with Next, and stops', async ({ page }) => {
  await page.goto('/');
  const start = page.locator('#tourStart');
  const bar = page.locator('#tourbar');
  await expect(bar).toBeHidden(); // not shown until the tour starts
  await expect(start).toBeVisible(); // hidden in markup, revealed by JS
  await start.click();
  const status = page.locator('#tourStatus');
  await expect(bar).toBeVisible();
  await expect(status).toContainText('Climbing');
  const first = await status.textContent();
  await page.locator('#tourNext').click();
  await expect(status).not.toHaveText(first ?? ''); // advanced to the next layer
  await page.locator('#tourStop').click();
  await expect(bar).toBeHidden();
});
