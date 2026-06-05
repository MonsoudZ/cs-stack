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

test('Compiler page: own nav, tokenizer emits tokens, the VM evaluates to 11', async ({ page }) => {
  await page.goto('/compiler');
  await expect(page.locator('h1.title')).toContainText('COMPILER');
  await expect(page.locator('.spine .rung')).toHaveCount(7);
  // lexer: stepping emits tokens
  const lex = page.locator('#K1');
  await lex.scrollIntoViewIfNeeded();
  for (let i = 0; i < 5; i++) {
    await lex.locator('.cpu-ctrl button').first().click();
    if (await lex.locator('.lex-tok').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(lex.locator('.lex-tok').first()).toBeVisible();
  // VM: stepping runs the bytecode to a result of 11
  const vm = page.locator('#K3');
  await vm.scrollIntoViewIfNeeded();
  for (let i = 0; i < 8; i++) {
    await vm.locator('.cpu-ctrl button').first().click();
    if (await vm.locator('.vm-result.show').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(vm.locator('.vm-result')).toContainText('11');
});

test('Network page: own nav, routing TTL counts down, DNS resolves to an IP', async ({ page }) => {
  await page.goto('/network');
  await expect(page.locator('h1.title')).toContainText('NETWORK');
  await expect(page.locator('.spine .rung')).toHaveCount(6); // its own layer set
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
  // dns: stepping the walk reveals the resolved IP
  const dns = page.locator('#N4');
  await dns.scrollIntoViewIfNeeded();
  for (let i = 0; i < 8; i++) {
    await dns.locator('.cpu-ctrl button').first().click();
    if (await dns.locator('.dns-ans').count()) break;
    await page.waitForTimeout(40);
  }
  await expect(dns.locator('.dns-ans').first()).toContainText('93.184');
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
