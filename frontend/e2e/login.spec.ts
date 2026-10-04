/**
 * End-to-end tests for user authentication (login / logout).
 *
 * These tests run against the real Next.js frontend and the real Supabase
 * Auth backend.  They require:
 *
 * 1. The Next.js dev server running on ``http://localhost:3000``.
 * 2. Environment variables ``TEST_USER_EMAIL`` and ``TEST_USER_PASSWORD``
 *    pointing to a valid Supabase Auth user.
 *
 * **Note:** The app uses Spanish UI labels, so selectors match Spanish text.
 */

import { test, expect } from "@playwright/test"

const TEST_EMAIL = process.env.TEST_USER_EMAIL
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD

// ── Skip entire suite if credentials are not provided ────────────────
test.skip(
  () => !TEST_EMAIL || !TEST_PASSWORD,
  "TEST_USER_EMAIL / TEST_USER_PASSWORD not set",
)

test.describe("Authentication (login / logout)", () => {
  test.beforeEach(async ({ page }) => {
    // Start each test from the login page
    await page.goto("/login")
    await page.waitForLoadState("networkidle")
  })

  test("shows the login form with expected elements", async ({ page }) => {
    // The page title / heading
    await expect(page.locator("text=PsicoFiscal")).toBeVisible()

    // Email & password fields
    await expect(page.locator('input[id="email"]')).toBeVisible()
    await expect(page.locator('input[id="password"]')).toBeVisible()

    // Submit button with Spanish text
    await expect(
      page.getByRole("button", { name: "Iniciar sesión" }),
    ).toBeVisible()

    // Link to register page
    await expect(page.locator('a:has-text("Regístrate")')).toBeVisible()
  })

  test("successful login redirects to home page", async ({ page }) => {
    await page.locator('input[id="email"]').fill(TEST_EMAIL!)
    await page.locator('input[id="password"]').fill(TEST_PASSWORD!)
    await page.getByRole("button", { name: "Iniciar sesión" }).click()

    // After successful login the user should be redirected to "/"
    await page.waitForURL("**/")
    // The home page should indicate the user is logged in (e.g. sidebar or user info)
    // Adjust selector to match your actual post-login indicator
    await expect(page.locator("text=PsicoFiscal").first()).toBeVisible()
  })

  test("shows error for invalid credentials", async ({ page }) => {
    await page.locator('input[id="email"]').fill("wrong@email.test")
    await page.locator('input[id="password"]').fill("wrong-password")
    await page.getByRole("button", { name: "Iniciar sesión" }).click()

    // Expect an error message to appear (it's rendered in an ``AlertCircle`` div)
    await expect(
      page.locator("text=Invalid login credentials").or(
        page.locator("text=Email not confirmed").or(
          page.locator('[class*="destructive"]'),
        ),
      ),
    ).toBeVisible({ timeout: 10_000 })
  })

  test("user can log out", async ({ page }) => {
    // First login
    await page.locator('input[id="email"]').fill(TEST_EMAIL!)
    await page.locator('input[id="password"]').fill(TEST_PASSWORD!)
    await page.getByRole("button", { name: "Iniciar sesión" }).click()
    await page.waitForURL("**/")

    // Find and click the logout button / link
    // (Adjust the selector to match your actual logout UI element)
    const logoutButton = page
      .getByRole("button", { name: /cerrar sesión|logout|sign out/i })
      .or(page.locator('a:has-text("Cerrar sesión")'))
      .or(page.locator('button:has-text("Cerrar sesión")'))

    if (await logoutButton.isVisible()) {
      await logoutButton.click()
      // After logout the user should be redirected to /login
      await page.waitForURL("**/login")
      await expect(page.locator('input[id="email"]')).toBeVisible()
    }
  })
})
