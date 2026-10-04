import { defineConfig, devices } from "@playwright/test"

/**
 * Playwright configuration for the Psico-Fiscal frontend.
 *
 * Tests expect the Next.js dev server to be running on ``http://localhost:3000``
 * (the default).  You can start it with:
 *
 * .. code:: bash
 *
 *     npm run dev
 *
 * Then run tests with:
 *
 * .. code:: bash
 *
 *     npx playwright test
 *
 * Environment variables required by the app (``NEXT_PUBLIC_SUPABASE_URL``,
 * ``NEXT_PUBLIC_SUPABASE_ANON_KEY``, etc.) are loaded from ``.env.local`` at
 * the project root.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    // Base URL for all page.goto() calls
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    // Store authentication state across tests
    storageState: "e2e/.auth/user.json",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
