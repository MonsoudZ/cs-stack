import { defineConfig, devices } from '@playwright/test';

// Builds the static site and serves it with `astro preview`, then runs the
// interaction tests against the real bundle (the same HTML/JS users get).
export default defineConfig({
  testDir: './e2e',
  // Visual-regression specs run under their own config (playwright.visual.config.js)
  // inside the pinned Linux container, so they're excluded from the default run.
  testIgnore: '**/*.visual.spec.js',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
