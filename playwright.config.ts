import { defineConfig, devices } from '@playwright/test';
import os from 'os';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const browsers = (process.env.PW_BROWSERS || 'chromium').split(',');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,

  // CI: 1 retry max (after you stabilize, set to 0)
  retries: process.env.CI ? 1 : 0,

  // CI: use cores but cap it
  workers: process.env.CI ? Math.min(4, os.cpus().length) : 4,

  reporter: process.env.CI ? [['html', { open: 'never' }]] : 'html',

  use: {
    baseURL,
    trace: process.env.CI ? 'retain-on-failure' : 'on-first-retry',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { storageState: undefined },
    },

    ...(browsers.includes('chromium')
      ? [{
          name: 'chromium',
          use: { ...devices['Desktop Chrome'], storageState: 'e2e/auth.json' },
          dependencies: ['setup'],
        }]
      : []),

    ...(browsers.includes('firefox')
      ? [{
          name: 'firefox',
          use: { ...devices['Desktop Firefox'], storageState: 'e2e/auth.json' },
          dependencies: ['setup'],
        }]
      : []),

    ...(browsers.includes('webkit')
      ? [{
          name: 'webkit',
          use: { ...devices['Desktop Safari'], storageState: 'e2e/auth.json' },
          dependencies: ['setup'],
        }]
      : []),
  ],
});