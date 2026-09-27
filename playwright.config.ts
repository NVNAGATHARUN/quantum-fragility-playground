import { defineConfig, devices } from '@playwright/test';

const python = process.env.PLAYWRIGHT_PYTHON
  || (process.platform === 'win32' ? 'backend\\.venv\\Scripts\\python.exe' : 'python');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: [
    {
      command: `${python} -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000`,
      url: 'http://127.0.0.1:8000/health/ready',
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: {
        ...process.env,
        DATABASE_URL: 'sqlite+aiosqlite:///./e2e_quantum_lens.db',
        JWT_SECRET_KEY: 'playwright-local-test-secret-with-at-least-32-characters',
      },
    },
    {
      command: 'npm run dev -- --host 127.0.0.1',
      url: 'http://127.0.0.1:5173',
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
