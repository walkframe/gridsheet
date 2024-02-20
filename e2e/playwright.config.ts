import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    launchOptions: {
      slowMo: 500,
    },
  },
});