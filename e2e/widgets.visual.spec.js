// Visual-regression snapshots of the key interactive diagrams, captured in
// deterministic stepped states. These are the most fragile, highest-value part
// of the site — a refactor can change a widget's logic or layout without any
// unit/e2e assertion noticing. A pixel diff catches that.
//
// Determinism: steppers never autoplay (the timer only starts on AUTO), so a
// fixed number of STEP clicks lands on a fixed state. We snapshot the widget
// ELEMENT (not the page) so the animated background/scanline is excluded, and
// Playwright's toHaveScreenshot disables CSS animations/transitions and waits
// for two stable frames before capturing.
//
// Baselines are generated and checked inside the pinned Playwright Linux
// container (see scripts/visual.sh + the `visual` CI job), so they match CI
// exactly regardless of the developer's OS. Run via `npm run test:visual`.
import { test, expect } from '@playwright/test';

// Click STEP until the stepper reaches its terminal frame (the control relabels
// to "RESTART ↺"). This is deterministic regardless of hydration timing: a
// fixed click count flaps because clicks fired before `client:visible` hydration
// are dropped, landing the widget on a different step. Looping to the terminal
// state is immune to that — the final frame is always the same, and we never
// click RESTART (which would reset to step 0).
async function stepToEnd(widget) {
  const btn = widget.locator('.cpu-ctrl button').first();
  for (let i = 0; i < 40; i++) {
    const label = ((await btn.textContent()) || '').trim();
    if (label.startsWith('RESTART')) break;
    await btn.click();
    await widget.page().waitForTimeout(40);
  }
  await expect(btn).toContainText('RESTART');
}

// Wait for web fonts before capturing: the mono numbers in some widgets re-wrap
// when JetBrains Mono swaps in, so a screenshot taken mid-swap flaps run to run.
async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(80);
}

// Snapshot a single widget element. `stepped` runs it to its terminal frame.
async function snapWidget({ page }, { url, section, nth = 0, stepped = true, name }) {
  await page.goto(url);
  const widget = page.locator(`${section} .widget`).nth(nth);
  await widget.scrollIntoViewIfNeeded();
  await expect(widget).toBeVisible();
  if (stepped) await stepToEnd(widget);
  await settle(page);
  await expect(widget).toHaveScreenshot(name);
}

test.describe('Visual regression: the key diagrams', () => {
  test('CPU fetch–decode–execute (home #L6)', async ({ page }) => {
    await snapWidget({ page }, { url: '/', section: '#L6', name: 'cpu-final.png' });
  });

  test('RequestFlow quorum write/read (design/key-value-store #KV3)', async ({ page }) => {
    await snapWidget({ page }, { url: '/design/key-value-store', section: '#KV3', name: 'requestflow-kv.png' });
  });

  test('Digital signature sign/verify (crypto #X6)', async ({ page }) => {
    await snapWidget({ page }, { url: '/crypto', section: '#X6', nth: 0, name: 'signature-final.png' });
  });

  test('Raft leader election (raft #RF1)', async ({ page }) => {
    await snapWidget({ page }, { url: '/raft', section: '#RF1', name: 'raft-election-final.png' });
  });

  test('Tracer capstone, initial render (home #L12)', async ({ page }) => {
    await snapWidget({ page }, { url: '/', section: '#L12', stepped: false, name: 'tracer-initial.png' });
  });

  test('Cross-link strip (design/key-value-store)', async ({ page }) => {
    await page.goto('/design/key-value-store');
    const strip = page.locator('nav.xlink');
    await strip.scrollIntoViewIfNeeded();
    await settle(page);
    await expect(strip).toHaveScreenshot('crosslinks-strip.png');
  });

  test('Site map grid (map)', async ({ page }) => {
    await page.goto('/map');
    const grid = page.locator('.map-grid');
    await grid.scrollIntoViewIfNeeded();
    await settle(page);
    await expect(grid).toHaveScreenshot('map-grid.png');
  });
});
