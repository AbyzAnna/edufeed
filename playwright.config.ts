import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, 'tests/.auth/user.json');
const authFileUser2 = path.join(__dirname, 'tests/.auth/user2.json');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Setup project - runs auth setup for user 1
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // Setup project - runs auth setup for user 2
    {
      name: 'setup-user2',
      testMatch: /auth-user2\.setup\.ts/,
    },
    // Main tests depend on setup (user 1)
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
      dependencies: ['setup'],
    },
    // Multi-user tests project - uses user 2 auth
    {
      name: 'chromium-user2',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFileUser2,
      },
      dependencies: ['setup-user2'],
      testMatch: /study-room-multiuser\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
