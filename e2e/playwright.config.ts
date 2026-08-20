import { defineConfig } from '@playwright/test';

export default defineConfig({
  fullyParallel: true,
  // Mouse-drag autofill specs are timing-sensitive and occasionally flake on the slower CI
  // runners (they pass reliably locally). Retry in CI so a transient miss doesn't fail the run;
  // this is also what `trace: 'on-first-retry'` below assumes. No retries locally.
  retries: process.env.CI ? 2 : 0,
  use: {
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    launchOptions: {
      slowMo: 150,
    },
    permissions: ['clipboard-read', 'clipboard-write'],
  },
});
