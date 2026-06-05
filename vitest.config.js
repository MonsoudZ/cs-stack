import { defineConfig } from 'vitest/config';

// Keep `vitest run` to the pure-logic unit tests in src/. The Playwright
// browser tests live in e2e/*.spec.js and are run separately (npm run test:e2e),
// so they must not be picked up by Vitest's default spec glob.
export default defineConfig({
  test: {
    include: ['src/**/*.test.js'],
  },
});
