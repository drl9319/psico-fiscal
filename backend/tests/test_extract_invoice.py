"""
Tests for the PDF invoice extraction endpoint (``POST /extract-invoice``).

The real ``extract_invoice_data`` function uses LangChain + Google GenAI
which is neither available nor desirable in unit tests.  Therefore we mock
it entirely and test:

* Happy path — a valid PDF returns the expected ``InvoiceSchema``.
* Wrong content type — a non-PDF upload returns ``415``.
* Empty file — an empty payload returns ``400``.
"""

from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING
from unittest.mock import patch

import pytest

if TYPE_CHECKING:
    from httpx import AsyncClient

from app.invoice_extraction import InvoiceSchema  # noqa: E402


# ── Mock return value ─────────────────────────────────────────────────
_MOCK_INVOICE = InvoiceSchema(
    accounting_date=date(2025, 6, 15),
    supplier_name="Test Supplier S.L.",
    supplier_id="B12345678",
    supplier_address="C/ Falsa 123, 28001 Madrid",
    invoice_number="INV-2025-001",
    amount=1000.0,
    tax=210.0,
    total=1210.0,
    retencion=0.0,
    is_credit_note=False,
    is_duplicate=False,
    existing_record=None,
)


class TestExtractInvoice:
    """Tests for ``POST /extract-invoice``."""

    # ── Happy path ───────────────────────────────────────────────────

    @patch("app.main.extract_invoice_data", return_value=_MOCK_INVOICE)
    async def test_valid_pdf_returns_invoice_data(
        self,
        mock_extract,
        test_client: AsyncClient,
    ):
        """Upload a valid PDF and verify the correct invoice data is
        returned."""
        payload = b"%PDF-1.4 mock pdf content ..."
        resp = await test_client.post(
            "/extract-invoice",
            files={"file": ("factura.pdf", payload, "application/pdf")},
        )

        assert resp.status_code == 200, (
            f"Expected 200, got {resp.status_code}: {resp.text}"
        )

        data = resp.json()
        assert data["supplier_name"] == "Test Supplier S.L."
        assert data["supplier_id"] == "B12345678"
        assert data["invoice_number"] == "INV-2025-001"
        assert data["amount"] == 1000.0
        assert data["tax"] == 210.0
        assert data["total"] == 1210.0
        assert data["accounting_date"] == "2025-06-15"
        assert data["is_credit_note"] is False

    # ── Wrong content type ───────────────────────────────────────────

    async def test_non_pdf_content_type_returns_415(
        self, test_client: AsyncClient,
    ):
        """Uploading a file with a non-PDF content type should be
        rejected with ``415 Unsupported Media Type``."""
        payload = b"this is not a pdf"
        resp = await test_client.post(
            "/extract-invoice",
            files={"file": ("document.txt", payload, "text/plain")},
        )

        assert resp.status_code == 415, (
            f"Expected 415, got {resp.status_code}: {resp.text}"
        )
        detail = resp.json().get("detail", "")
        assert "PDF" in detail or "application/pdf" in detail.lower()

    # ── Empty file ───────────────────────────────────────────────────

    async def test_empty_file_returns_400(
        self, test_client: AsyncClient,
    ):
        """Uploading an empty PDF should be rejected with ``400 Bad
        Request``."""
        payload = b""
        resp = await test_client.post(
            "/extract-invoice",
            files={"file": ("empty.pdf", payload, "application/pdf")},
        )

        assert resp.status_code == 400, (
            f"Expected 400, got {resp.status_code}: {resp.text}"
        )

    # ── Missing file ─────────────────────────────────────────────────

    async def test_missing_file_field_returns_422(
        self, test_client: AsyncClient,
    ):
        """Sending the request without a ``file`` part should return
        ``422 Unprocessable Entity``."""
        resp = await test_client.post("/extract-invoice")
        assert resp.status_code == 422, (
            f"Expected 422, got {resp.status_code}: {resp.text}"
        )
