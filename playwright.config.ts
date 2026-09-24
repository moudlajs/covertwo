import { defineConfig, devices } from '@playwright/test'

const PORT = 4173

export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/covertwo/`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'mobile', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    // Tests run against the production build, not the dev server.
    // e2e builds point the app at a fake API host that mock-espn.ts serves.
    command: `VITE_API_BASE=http://api.test npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/covertwo/`,
    reuseExistingServer: !process.env.CI,
  },
})
