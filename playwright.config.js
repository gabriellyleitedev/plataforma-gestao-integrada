import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 90000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5179',
    channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  webServer: [
    {
      command: 'node src/server.js',
      cwd: './backend',
      url: 'http://localhost:3101/api/health',
      env: {
        NODE_ENV: 'test',
        DB_DRIVER: 'sqlite',
        SQLITE_PATH: ':memory:',
        PORT: '3101',
        FRONTEND_URL: 'http://localhost:5179'
      },
      reuseExistingServer: false
    },
    {
      command: 'npm run dev -w frontend -- --port 5179',
      url: 'http://localhost:5179',
      env: { API_PROXY_TARGET: 'http://localhost:3101', VITE_API_URL: '/api' },
      reuseExistingServer: false,
      timeout: 120000
    }
  ]
});
