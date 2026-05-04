from __future__ import annotations
import logging

from fastapi import FastAPI, File, HTTPException, UploadFile, logger
from fastapi.middleware.cors import CORSMiddleware

from .invoice_extraction import InvoiceSchema, extract_invoice_data

app = FastAPI(title="Psico-Fiscal API")
# Configura el logger correctamente
logger = logging.getLogger("uvicorn.error")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/extract-invoice", response_model=InvoiceSchema)
async def extract_invoice_endpoint(file: UploadFile = File(...)) -> InvoiceSchema:
    logger.info("--- Entro en extrac invoice")
    if file.content_type not in {"application/pdf", "application/x-pdf"}:
        raise HTTPException(status_code=415, detail="Solo se acepta PDF (application/pdf).")

    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="El archivo PDF está vacío.")

    try:
        return extract_invoice_data(pdf_bytes)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

