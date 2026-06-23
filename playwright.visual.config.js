import { defineConfig, devices } from '@playwright/test';

// Visual-regression config. Runs ONLY the *.visual.spec.js snapshots, and is
// meant to run inside the pinned Playwright Linux container (see scripts/visual.sh
// and the `visual` CI job) so baselines are pixel-identical across machines.
// A fixed viewport and a tiny diff tolerance (anti-aliasing only) keep it from
// flaking while still catching real layout/logic changes in the diagrams.
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.visual.spec.js',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  // Baselines live next to the spec, named by platform so a stray local run on a
  // different OS can't clobber the canonical (Linux) set.
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{platform}/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      // Baselines and CI run in the same pinned container, so rendering is
      // deterministic — the tolerance only needs to absorb a few stray AA
      // pixels. A tight absolute budget (not a ratio) catches small but real
      // changes — a changed value, a moved node — that a ratio would dilute.
      maxDiffPixels: 60,
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },
  use: {
    baseURL: 'http://localhost:4321',
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
  projects: [{ name: 'visual', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
