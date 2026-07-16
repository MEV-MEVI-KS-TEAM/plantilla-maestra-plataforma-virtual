import { defineConfig, devices } from '@playwright/test'

/**
 * QA visual de "Cursos y Diplomados" (F4). Corre contra el BUILD DE PRODUCCIÓN
 * local (pnpm start) para fidelidad con el deploy. Un solo worker en orden para
 * que Admin (crea el diploma) corra antes que Alumno/Móvil (lo consumen).
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/globalSetup.ts',
  globalTeardown: './e2e/globalTeardown.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 25_000,
    navigationTimeout: 45_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 } } },
  ],
  webServer: {
    command: 'pnpm start',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 180_000,
  },
})
