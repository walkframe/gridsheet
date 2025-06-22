import { defineConfig } from '@playwright/test';

export default defineConfig({
  fullyParallel: true,
  use: {
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    launchOptions: {
      slowMo: 250,
    },
    permissions: ['clipboard-read', 'clipboard-write'],
  },
});
