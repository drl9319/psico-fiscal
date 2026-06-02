"""
Supabase JWT verification for FastAPI.

Uses the ``supabase`` Python client's ``auth.get_user()`` method to
validate the JWT directly against the Supabase Auth service.  This
approach:

- Requires **no JWKS fetching** or crypto key management.
- Makes a single HTTP call to ``{SUPABASE_URL}/auth/v1/user`` with the
  user's JWT in the ``Authorization`` header.
- Returns the authenticated user's metadata on success.
- Works regardless of Supabase's signing key configuration.

Usage in any endpoint:
    from .auth import get_current_user

    @app.get("/protected")
    async def protected_route(user: dict = Depends(get_current_user)):
        return {"message": f"Hello {user['email']}"}
"""

from __future__ import annotations

import os
import logging
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

from supabase import create_client

logger = logging.getLogger("uvicorn.error")

# ── Load environment ──────────────────────────────────────────────────
base_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(base_dir, "../../.env.local")
load_dotenv(dotenv_path=dotenv_path)

SUPABASE_URL: Optional[str] = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_ANON_KEY: Optional[str] = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

# FastAPI security scheme
security = HTTPBearer(auto_error=False)

# Shared Supabase client (uses the anon key — sufficient for token
# verification because ``auth.get_user()`` validates the JWT itself).
_supabase_client = None


def _get_supabase_client():
    """Lazily-initialised Supabase client for token verification."""
    global _supabase_client
    if _supabase_client is None:
        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            raise RuntimeError(
                "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY "
                "must be configured."
            )
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    return _supabase_client


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    """FastAPI dependency that validates the bearer JWT against Supabase Auth.

    Calls ``supabase.auth.get_user(token)`` which verifies the token via
    Supabase's ``/auth/v1/user`` endpoint.  If the token is valid the
    decoded user object is returned; otherwise a ``401`` is raised.

    The returned dict contains ``id``, ``email``, ``aud``, ``role``,
    ``user_metadata``, ``app_metadata``, and the raw ``access_token``
    string (for forwarding to Supabase queries).
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = credentials.credentials

    try:
        supabase = _get_supabase_client()
        # ``auth.get_user()`` sends the JWT to Supabase Auth for
        # verification.  It raises ``AuthApiError`` on failure.
        user_response = supabase.auth.get_user(access_token)
        auth_user = user_response.user

        if auth_user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user = {
            "id": auth_user.id,
            "email": auth_user.email,
            "aud": getattr(auth_user, "aud", None),
            "role": getattr(auth_user, "role", None),
            "user_metadata": auth_user.user_metadata or {},
            "app_metadata": auth_user.app_metadata or {},
            # Raw JWT string — needed to forward to Supabase so RLS
            # can inspect auth.jwt() ->> 'email' and apply row-level
            # security policies.
            "access_token": access_token,
        }
        return user

    except Exception as e:
        logger.warning("Token verification failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
