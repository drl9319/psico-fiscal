"""
Tests for authentication (login / logout) flows.

Because the real ``get_current_user`` dependency is overridden in
``conftest.py`` to return a fake user, these tests focus on:

1. Verifying that **protected endpoints require a bearer token** by
   temporarily removing the override and asserting a ``401`` response.
2. Confirming that a **mocked authenticated request** is accepted.

.. note::

   Actual login / logout against the Supabase Auth REST API is exercised by
   the **Playwright e2e tests** in ``frontend/e2e/`` — those tests run
   against the real deployed frontend and go through the browser's login
   form.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

if TYPE_CHECKING:
    from httpx import AsyncClient


# ── Helper: remove the auth override so the real dependency runs ──────
@pytest.fixture
def _remove_auth_override():
    """Temporarily pop the ``get_current_user`` override so the real
    dependency (which requires a valid JWT) is evaluated."""
    from app.auth import get_current_user
    from app.main import app

    app.dependency_overrides.pop(get_current_user, None)
    yield
    # Restore override after test
    async def _mock_get_current_user():
        return {
            "id": "test-user-uuid",
            "email": "test@psicofiscal.test",
            "aud": "authenticated",
            "role": "authenticated",
            "user_metadata": {},
            "app_metadata": {},
            "access_token": "fake-jwt-token-for-testing",
        }

    app.dependency_overrides[get_current_user] = _mock_get_current_user


class TestAuthentication:
    """Suite of authentication-related endpoint tests."""

    # ── Missing token → 401 ──────────────────────────────────────────

    @pytest.mark.usefixtures("_remove_auth_override")
    async def test_missing_token_returns_401(self, test_client: AsyncClient):
        """A request **without** an ``Authorization`` header should be
        rejected with ``401 Unauthorized``."""
        resp = await test_client.get("/get_customer_invoices")
        assert resp.status_code == 401, (
            f"Expected 401 for missing token, got {resp.status_code}: "
            f"{resp.text}"
        )

    @pytest.mark.usefixtures("_remove_auth_override")
    async def test_invalid_token_returns_401(self, test_client: AsyncClient):
        """A request **with** a bogus ``Bearer`` token should also be
        rejected with ``401`` (the real dependency tries to verify against
        Supabase and fails)."""
        resp = await test_client.get(
            "/get_customer_invoices",
            headers={"Authorization": "Bearer this-is-not-a-valid-jwt"},
        )
        assert resp.status_code == 401, (
            f"Expected 401 for invalid token, got {resp.status_code}: "
            f"{resp.text}"
        )

    # ── Authenticated request succeeds (with mocked repo) ────────────

    async def test_authenticated_request_succeeds(
        self, test_client: AsyncClient,
    ):
        """When the auth override is in place (the default), a protected
        endpoint should accept the request (not 401).

        We also mock ``SupabaseRepository.get_user_instance`` so that the
        endpoint logic (which calls Supabase after auth) returns gracefully.
        """
        from unittest.mock import patch, AsyncMock

        mock_repo = AsyncMock()
        mock_repo.get_all.return_value = []

        with patch(
            "app.main.SupabaseRepository.get_user_instance",
            return_value=mock_repo,
        ):
            resp = await test_client.get("/get_customer_invoices")
            # The mock lets us through; we just care it's not 401
            assert resp.status_code != 401, (
                f"Authenticated request got 401: {resp.text}"
            )
            # With the mocked repo it should return 200 + empty list
            assert resp.status_code == 200, (
                f"Expected 200, got {resp.status_code}: {resp.text}"
            )
            assert resp.json() == []

    # ── Health-check / unprotected endpoint ─────────────────────────

    async def test_openapi_schema_available(self, test_client: AsyncClient):
        """The OpenAPI schema at ``/openapi.json`` should be publicly
        accessible without authentication."""
        resp = await test_client.get("/openapi.json")
        assert resp.status_code == 200
        assert "openapi" in resp.json()
