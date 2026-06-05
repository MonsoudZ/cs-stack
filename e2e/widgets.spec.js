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
