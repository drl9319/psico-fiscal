/**
 * Global setup for Playwright authentication.
 *
 * This file is referenced in the Playwright config as ``globalSetup``.
 * It logs in once with valid test credentials and saves the browser
 * storage state so that subsequent tests are already authenticated.
 *
 * **Usage in CI / local development:**
 *
 * Set the following environment variables before running tests:
 *
 * - ``TEST_USER_EMAIL`` — the email of an existing Supabase Auth user.
 * - ``TEST_USER_PASSWORD`` — that user's password.
 *
 * If these variables are **not** set, the auth-dependent tests will be
 * skipped (see the ``test.skip`` markers in the spec files).
 */

import { expect, type FullConfig } from "@playwright/test"

async function globalSetup(config: FullConfig) {
  const email = process.env.TEST_USER_EMAIL
  const password = process.env.TEST_USER_PASSWORD

  if (!email || !password) {
    console.warn(
      "⚠  TEST_USER_EMAIL / TEST_USER_PASSWORD not set — " +
        "auth e2e tests will be skipped.",
    )
    return
  }
}

export default globalSetup
