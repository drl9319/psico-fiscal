from __future__ import annotations

import logging

import os
import tempfile
from datetime import date
from pathlib import Path
from typing import Any, BinaryIO, Optional, Union, Dict

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field

# Configura el logger correctamente
logger = logging.getLogger("uvicorn.error")

try:
    # Pydantic v2
    from pydantic import field_validator  # type: ignore

    _PYDANTIC_V2 = True
except Exception:  # pragma: no cover
    # Pydantic v1 fallback
    from pydantic import validator as field_validator  # type: ignore

    _PYDANTIC_V2 = False


class InvoiceSchema(BaseModel):
    accounting_date: date = Field(
        ...,
        description="The accounting or invoice date found in the document (YYYY-MM-DD).",
    )
    supplier_name: str = Field(..., description="Legal name of the issuer/vendor.")
    supplier_id: str = Field(..., description="Tax ID, CIF, or NIF of the supplier.")
    supplier_address: str = Field(..., description="Full physical address of the supplier.")
    invoice_number: str = Field(..., description="The unique invoice reference number (e.g., ES-00000003107/26).")
    amount: float
    tax: float
    total: float
    retencion: float = Field(default=0.0, description="Retención IRPF aplicada, si existe. Por defecto es 0.0.")
    # Auto-computed: credit note if total is negative
    is_credit_note: bool = Field(default=False, description="True if total amount is negative (credit note / abono).")
    # Duplicate detection metadata (optional)
    is_duplicate: bool = Field(default=False, description="True if an invoice with the same invoice_number exists in the DB.")
    existing_record: Optional[Dict[str, Any]] = Field(default=None, description="Existing DB record when duplicate is detected.")

    if _PYDANTIC_V2:

        @field_validator("amount", "tax", "total", mode="before")
        @classmethod
        def _coerce_float(cls, v: Any) -> float:
            return _to_float(v)

        @field_validator("total")
        @classmethod
        def _set_credit_note(cls, v: float) -> float:
            return v

        @field_validator("is_credit_note", mode="before")
        @classmethod
        def _compute_credit_note(cls, v: Any, info) -> bool:
            # If already explicitly set, respect it
            if isinstance(v, bool):
                return v
            # Compute from total amount
            data = info.data
            total = data.get("total")
            if total is not None:
                return float(total) < 0
            return False

    else:

        @field_validator("amount", "tax", "total", pre=True)  # type: ignore[misc]
        def _coerce_float(cls, v: Any) -> float:  # noqa: N805
            return _to_float(v)

        @field_validator("is_credit_note", pre=True, always=True)  # type: ignore[misc]
        def _compute_credit_note_v1(cls, v: Any, values) -> bool:  # noqa: N805
            if isinstance(v, bool):
                return v
            total = values.get("total")
            if total is not None:
                return float(total) < 0
            return False


def _to_float(v: Any) -> float:
    if v is None:
        raise ValueError("numeric field is required")
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, str):
        s = v.strip()
        if not s:
            raise ValueError("numeric field is required")
        # Common invoice formats: "1.234,56" or "1,234.56" or "1234,56"
        s = s.replace("€", "").replace("EUR", "").strip()
        if "," in s and "." in s:
            if s.rfind(",") > s.rfind("."):
                s = s.replace(".", "").replace(",", ".")
            else:
                s = s.replace(",", "")
        else:
            s = s.replace(",", ".")
        return float(s)
    raise TypeError(f"cannot coerce {type(v)} to float")


PdfInput = Union[str, Path, bytes, BinaryIO]


def extract_invoice_data(
    pdf: PdfInput,
    *,
    model: str = "gemini-1.5-flash",
    temperature: float = 0.0,
    max_chars: int = 120_000,
    check_db: bool = True,
    db_table: str = "supplier_invoices",
) -> InvoiceSchema:
    """
    Extract invoice data from the provided PDF content and return a validated `InvoiceSchema` object.

    TECHNICAL REQUIREMENTS:
    - Use Gemini via `ChatGoogleGenerativeAI` with `.with_structured_output(InvoiceSchema)`.
    - Process the PDF using `PyPDFLoader`. If the extracted text is empty or unreadable, trigger an OCR fallback mechanism to ensure data capture.
    - Ensure `GOOGLE_API_KEY` is retrieved from environment variables (loaded via `.env.local`).

    EXTRACTION RULES:
    1. Identify the Supplier: Extract the legal name, tax ID (CIF/NIF), and full address of the issuer.
    2. Date Formatting: Locate the invoice/accounting date and convert it to ISO format (YYYY-MM-DD).
    3. Invoice Reference: Capture the full `invoice_number` string, including prefixes and special characters (e.g., "ES-00000003107/26").
    4. Financial Totals: Extract `amount` (taxable base), `tax` (VAT/IVA amount), `total`, and `retencion` (IRPF) as float values. 
    5. Validation: If a field is missing or ambiguous, return `null` for that specific field rather than guessing.

    The output must strictly conform to the `InvoiceSchema` structure.
    """

    _load_env_if_possible()

    if not os.getenv("GOOGLE_API_KEY"):
        raise RuntimeError(
            "Falta la variable de entorno GOOGLE_API_KEY (Gemini). "
            "Configúrala en tu entorno o en `.env.local`."
        )

    tmp_path: Optional[str] = None
    try:
        tmp_path = _materialize_pdf_to_path(pdf)
        text = _extract_text_from_pdf(tmp_path, max_chars=max_chars)

        if not text.strip():
            text = _extract_text_with_ocr_fallback(tmp_path, max_chars=max_chars)

        ##llm = ChatGoogleGenerativeAI(model=model, temperature=temperature)
        # FORZAMOS el modelo aquí, ignorando cualquier configuración previa
        # Crea el logger al principio del archivo
        logger = logging.getLogger("uvicorn.error")
        print(model)
        logger.info("--- LA FUNCIÓN SE ESTÁ EJECUTANDO --- {model}")
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash-lite",
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            # Esto es lo que soluciona el 404:
            api_version="v1" ,
            temperature=temperature
        )

        structured = llm.with_structured_output(InvoiceSchema)

        system = SystemMessage(
            content=(
                "You are an expert assistant in accounting and invoice data extraction in Spain. "
                "It ALWAYS returns all required fields. "
                "accounting_date must be in ISO format (YYYY-MM-DD). "
                #"invoice_serie must be an integer. "
                "amount (taxable base / base imponible), tax (VAT / IVA), total and retencion must be numbers (float) without currency symbols. "
                "IMPORTANT: For credit notes (abonos / notas de crédito), ALL monetary values (amount, tax, total) MUST be NEGATIVE numbers. "
                "The total MUST equal amount + tax - retencion. "
                "For regular invoices, all values are positive. "
                "If you don't find retention, the value must be 0.0."
            )
        )
        human = HumanMessage(
            content=(
                "Extract the structured data from this invoice.\n\n"
                "=== INVOICE TEXT (may contain noise) ===\n"
                f"{text}\n"
            )
        )

        result = structured.invoke([system, human])

        # Normalize result to a plain dict so we can attach duplicate info if needed
        if isinstance(result, dict):
            raw: dict = result
        else:
            # Pydantic model or similar
            if hasattr(result, "model_dump"):
                raw = result.model_dump()  # pydantic v2
            elif hasattr(result, "dict"):
                raw = result.dict()
            else:
                # Fallback: try to treat as mapping
                try:
                    raw = dict(result)
                except Exception:
                    raw = {}

        # Optional DB duplicate check
        if check_db:
            try:
                from .db_supabase_manager import SupabaseRepository

                invoice_num = raw.get("invoice_number")
                if invoice_num:
                    repo = SupabaseRepository.get_instance()
                    resp = repo.client.table(db_table).select("*").eq("invoice_number", invoice_num).limit(1).execute()
                    existing = getattr(resp, "data", None)
                    if existing:
                        # attach duplicate info
                        raw["is_duplicate"] = True
                        raw["existing_record"] = existing[0]
            except Exception as e:
                logger = logging.getLogger("uvicorn.error")
                logger.warning("DB duplicate check failed: %s", e)

        # Validate and return InvoiceSchema with potential duplicate metadata
        return InvoiceSchema.model_validate(raw) if _PYDANTIC_V2 else InvoiceSchema.parse_obj(raw)

    except (ValueError, TypeError) as e:
        # Coerción numérica / validación de esquema
        raise ValueError(f"Error de validación del esquema InvoiceSchema: {e}") from e
    except Exception as e:
        # OCR, lectura de PDF, errores del LLM, etc.
        raise RuntimeError(f"Error extrayendo datos de la factura: {e}") from e
    finally:
        if tmp_path:
            try:
                Path(tmp_path).unlink(missing_ok=True)  # type: ignore[arg-type]
            except Exception:
                pass


def _materialize_pdf_to_path(pdf: PdfInput) -> str:
    if isinstance(pdf, (str, Path)):
        return str(pdf)
    if isinstance(pdf, (bytes, bytearray)):
        data = bytes(pdf)
    else:
        data = pdf.read()

    fd, path = tempfile.mkstemp(suffix=".pdf")
    os.close(fd)
    with open(path, "wb") as f:
        f.write(data)
    return path


def _extract_text_from_pdf(pdf_path: str, *, max_chars: int) -> str:
    from langchain_community.document_loaders import PyPDFLoader

    loader = PyPDFLoader(pdf_path)
    docs = loader.load()
    text = "\n\n".join(d.page_content for d in docs if getattr(d, "page_content", None))
    return text[:max_chars]


def _extract_text_with_ocr_fallback(pdf_path: str, *, max_chars: int) -> str:
    """
    OCR opcional: requiere `pdf2image` + `pytesseract` instalados y Tesseract en el sistema.
    Si no está disponible, devuelve string vacío para que el caller gestione el error.
    """
    try:
        from pdf2image import convert_from_path  # type: ignore
        import pytesseract  # type: ignore
    except Exception:
        return ""

    try:
        images = convert_from_path(pdf_path, dpi=250)
        parts: list[str] = []
        for img in images:
            parts.append(pytesseract.image_to_string(img))
            if sum(len(p) for p in parts) >= max_chars:
                break
        return ("\n\n".join(parts))[:max_chars]
    except Exception as e:
        raise RuntimeError(f"Error de OCR: {e}") from e


def _load_env_if_possible() -> None:
    """
    Integra con tu `.env.local` (típico en Next.js) si existe.
    En producción, es preferible inyectar variables en el entorno.
    """
    try:
        from dotenv import load_dotenv  # type: ignore
    except Exception:
        return

    root = Path(__file__).resolve().parents[2]
    env_local = root / ".env.local"
    if env_local.exists():
        load_dotenv(env_local, override=False)

