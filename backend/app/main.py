from __future__ import annotations
import logging
from decimal import Decimal
from typing import List

from fastapi import FastAPI, File, HTTPException, UploadFile, logger
from fastapi.middleware.cors import CORSMiddleware

from backend.app.models.supplier_invoices import SupplierInvoiceSchema

from .invoice_extraction import InvoiceSchema, extract_invoice_data
from .models.customer_invoices import CustomerInvoiceSchema
from .db_supabase_manager import SupabaseRepository

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
        ##return extract_invoice_data(pdf_bytes)
        pdf_bytes = {
            "accounting_date": "2026-04-30",
            "supplier_name": "Altania del Mar SL",
            "supplier_id": "B83082347",
            "supplier_address": "Paseo de la Castellana, 259D Planta 50. Edificio Torre Emperador 28046 Madrid (España)",
            "amount": 7.75,
            "tax": 1.63,
            "total": 9.38,
            "retencion": 0
            }
        ###PRUEBA para no gastar dineros en la API de Google durante el desarrollo. Elimina esto y descomenta la línea anterior para usar la función real de extracción.
        return pdf_bytes
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/save-invoice", status_code=201)
async def save_invoice_endpoint(invoice: InvoiceSchema):
    """
    Recibe los datos de una factura extraída, los valida con el esquema
    de la base de datos y los guarda en Supabase.
    """
    try:
        # Mapeo del esquema de extracción al esquema de la base de datos
        # Nota: La precisión se maneja con Decimal.
        db_invoice_data = {
            "accounting_date": invoice.accounting_date,
            "supplier_name": invoice.supplier_name,
            "supplier_id": invoice.supplier_id,
            "supplier_address": invoice.supplier_address,
            #"invoice_serie": invoice.invoice_serie,
            "amount": Decimal(str(invoice.amount)),
            "tax": Decimal(str(invoice.tax)),
            "total": Decimal(str(invoice.total)),
            "retencion": Decimal(str(invoice.retencion)),
        }
        
        # Validación estricta con el esquema de la base de datos
        invoice_validated = SupplierInvoiceSchema(**db_invoice_data)
        
        # Persistencia en Supabase
        repo = SupabaseRepository.get_instance()
        created_record = await repo.create("supplier_invoices", invoice_validated)
        
        return {"status": "success", "data": created_record}
        
    except Exception as e:
        logger.error(f"Error al guardar la factura: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno al guardar la factura: {e}") from e
    

@app.get("/get_customer_invoices", response_model=List[InvoiceSchema])
async def get_customer_invoices_endpoint(limit: int = 100):
    logger.error(f"Prueba comienzo a leer facturas, limit={limit}")
    repo = SupabaseRepository.get_instance()
    logger.error(f"Prueba comienzo a leer facturas, repo={repo}")
    return await repo.get_all("customer_invoices", limit=limit)

@app.get("/get_supplier_invoices", response_model=List[SupplierInvoiceSchema])
async def get_supplier_invoices_endpoint(limit: int = 100):
    logger.error(f"Prueba comienzo a leer facturas, limit={limit}")
    repo = SupabaseRepository.get_instance()
    logger.error(f"Prueba comienzo a leer facturas, repo={repo}")
    return await repo.get_all("supplier_invoices", limit=limit)

