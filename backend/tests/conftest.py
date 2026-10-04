"""
Shared fixtures for the FastAPI backend test suite.

Provides:
- ``test_client`` — an ``httpx.AsyncClient`` wired to the FastAPI app with
  the ``get_current_user`` dependency overridden so that tests do **not**
  require a real Supabase JWT.
- A fake ``mock_user`` dict that simulates an authenticated user.
"""

from __future__ import annotations

import os
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

# ── Patch environment BEFORE any app module is imported ─────────────────
# This ensures the auth module picks up test values instead of real ones.
os.environ.setdefault("NEXT_PUBLIC_SUPABASE_URL", "https://test-project.supabase.co")
os.environ.setdefault(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test",
)

from app.main import app  # noqa: E402
from app.auth import get_current_user  # noqa: E402


# ── Fake authenticated user ────────────────────────────────────────────
@pytest.fixture
def mock_user() -> dict:
    """Return a fake user payload that replaces the real auth dependency."""
    return {
        "id": "test-user-uuid",
        "email": "test@psicofiscal.test",
        "aud": "authenticated",
        "role": "authenticated",
        "user_metadata": {},
        "app_metadata": {},
        "access_token": "fake-jwt-token-for-testing",
    }


# ── Override the auth dependency ──────────────────────────────────────
@pytest.fixture(autouse=True)
def _override_auth(mock_user: dict) -> None:
    """Replace ``get_current_user`` with a stub that returns ``mock_user``.

    Applied **automatically** to every test in the session (``autouse=True``).
    """

    async def _mock_get_current_user() -> dict:
        return mock_user

    app.dependency_overrides[get_current_user] = _mock_get_current_user
    yield
    # Restore the real dependency after the test so it doesn't leak
    app.dependency_overrides.pop(get_current_user, None)


# ── Async HTTP client ─────────────────────────────────────────────────
@pytest_asyncio.fixture
async def test_client() -> AsyncGenerator[AsyncClient, None]:
    """Provide an ``httpx.AsyncClient`` that speaks ASGI directly to the
    FastAPI app — no need to run ``uvicorn`` during tests."""
    transport = ASGITransport(app=app)  # type: ignore[arg-type]
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
