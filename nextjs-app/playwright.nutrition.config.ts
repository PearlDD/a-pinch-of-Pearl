import { defineConfig, devices } from '@playwright/test';

// Isolated, mocked auth/data: no real Supabase account or API key is needed.
export default defineConfig({
  testDir: './browser-tests',
  testMatch: 'nutrition.spec.ts',
  outputDir: './test-results',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:3005', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'touch', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3005',
    url: 'http://127.0.0.1:3005',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://preview.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'preview-anon',
      NEXT_PUBLIC_ADMIN_UID: 'preview-admin',
    },
  },
});
