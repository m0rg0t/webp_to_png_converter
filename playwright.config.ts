import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './browser-tests', timeout: 45000, expect: { timeout: 10000 }, forbidOnly: !!process.env.CI,
  use: { baseURL: 'http://127.0.0.1:4207', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }, { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 320, height: 640 } } }],
  webServer: { command: 'npm run dev:vk-mock -- --host 127.0.0.1 --port 4207', url: 'http://127.0.0.1:4207', reuseExistingServer: !process.env.CI },
});
