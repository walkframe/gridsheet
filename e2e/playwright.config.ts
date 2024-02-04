import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    trace: 'on-first-retry',
    video: 'on',
    launchOptions: {
      slowMo: 200,
    },
  },
  timeout: 100000,
});