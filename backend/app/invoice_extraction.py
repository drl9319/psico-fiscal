from __future__ import annotations

import logging

import os
import tempfile
from datetime import date
from pathlib import Path
from typing import Any, BinaryIO, Optional, Union

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
    fecha_contabilizacion: date = Field(
        ...,
        description="Fecha de contabilización en formato ISO (YYYY-MM-DD).",
    )
    proveedor: str
    dni: str
    direccion: str
    #invoice_serie: int = Field(..., description="El número de serie o número de factura. Es un número entero.")
    base: float
    impuesto: float
    total: float
    retencion: float = Field(default=0.0, description="Retención IRPF aplicada, si existe. Por defecto es 0.0.")

    if _PYDANTIC_V2:

        @field_validator("base", "impuesto", "total", mode="before")
        @classmethod
        def _coerce_float(cls, v: Any) -> float:
            return _to_float(v)

    else:

        @field_validator("base", "impuesto", "total", pre=True)  # type: ignore[misc]
        def _coerce_float(cls, v: Any) -> float:  # noqa: N805
            return _to_float(v)


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
) -> InvoiceSchema:
    """
    Extrae datos de una factura desde un PDF y devuelve un `InvoiceSchema` validado.

    - Usa Gemini vía `ChatGoogleGenerativeAI` y `with_structured_output(InvoiceSchema)`.
    - Extrae texto con `PyPDFLoader` y hace fallback a OCR si está disponible.
    - Lee `GOOGLE_API_KEY` desde variables de entorno (opcionalmente cargadas desde `.env.local`).
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
                "Eres un asistente experto en contabilidad y extracción de datos de facturas en España. "
                "Devuelve SIEMPRE todos los campos requeridos. "
                "fecha_contabilizacion debe ser ISO (YYYY-MM-DD). "
                #"invoice_serie debe ser un número entero. "
                "base, impuesto, total y retencion deben ser números (float) sin símbolos. "
                "Si no encuentras retención, el valor debe ser 0.0."
            )
        )
        human = HumanMessage(
            content=(
                "Extrae los datos estructurados de esta factura.\n\n"
                "=== TEXTO DE LA FACTURA (puede tener ruido) ===\n"
                f"{text}\n"
            )
        )

        result = structured.invoke([system, human])
        if isinstance(result, InvoiceSchema):
            return result
        return InvoiceSchema.model_validate(result) if _PYDANTIC_V2 else InvoiceSchema.parse_obj(result)

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

