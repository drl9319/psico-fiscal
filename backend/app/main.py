from __future__ import annotations
import logging
from decimal import Decimal
from typing import List
import tempfile
import os
import json

from fastapi import FastAPI, File, HTTPException, UploadFile, logger
from fastapi.middleware.cors import CORSMiddleware

from .models.supplier_invoices import SupplierInvoiceSchema

from .invoice_extraction import InvoiceSchema, extract_invoice_data
from .excel_extraction import extract_excel_data
from .models.customer_invoices import CustomerInvoiceSchema
from .models.modelo_130 import Modelo130Schema
from .db_supabase_manager import SupabaseRepository
from .aeat_models_calculate import get_customer_invoices_summary, get_supplier_invoices_summary, save_modelo_130, get_modelo_130, calculate_new_declaracion, InvoiceSummaryResponse
from pydantic import ValidationError

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
            "id": "ES_00000003107_26.pdf-17315",
            "accounting_date": "2026-02-26T00:00:00.000Z",
            "invoice_number": "ES-00000003107/26",
            "supplier_name": "Altania del Mar SL",
            "supplier_id": "B83082347",
            "supplier_address": "Paseo de la Castellana, 259D, Planta 50. Edificio Torre Emperador, 28046 Madrid (España)",
            "amount": 12.25,
            "taxPercent": 20.97959183673469,
            "retencionPercent": 0,
            "total": 14.82,
            "tax": 2.57,
             "category": "Otros",
            "fileName": "ES_00000003107_26.pdf",
            "status": "extracted"
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
    

@app.post("/save-multiple-invoices", status_code=201)
async def save_multiple_invoices_endpoint(invoices: List[InvoiceSchema]):
    """
    Recibe una lista de facturas extraídas, las valida y las guarda en Supabase.
    """
    repo = SupabaseRepository.get_instance()
    saved_invoices = []
    errors = []

    for i, invoice in enumerate(invoices):
        try:
            db_invoice_data = {
                "accounting_date": invoice.accounting_date,
                "supplier_name": invoice.supplier_name,
                "supplier_id": invoice.supplier_id,
                "supplier_address": invoice.supplier_address,
                "invoice_number": invoice.invoice_number,
                "amount": Decimal(str(invoice.amount)),
                "tax": Decimal(str(invoice.tax)),
                "total": Decimal(str(invoice.total)),
                "retencion": Decimal(str(invoice.retencion)),
            }
            invoice_validated = SupplierInvoiceSchema(**db_invoice_data)
            created_record = await repo.create("supplier_invoices", invoice_validated)
            saved_invoices.append(created_record)
        except ValidationError as e:
            errors.append({"index": i, "invoice": invoice.dict(), "error": str(e)})
            logger.error(f"Error de validación en la factura {i}: {e}")
        except Exception as e:
            errors.append({"index": i, "invoice": invoice.dict(), "error": str(e)})
            logger.error(f"Error al guardar la factura {i}: {e}")

    if errors:
        raise HTTPException(status_code=400, detail={
            "message": "Algunas facturas no pudieron ser guardadas.",
            "errors": errors,
            "saved_count": len(saved_invoices),
        })

    return {"status": "success", "saved_count": len(saved_invoices), "data": saved_invoices}


@app.get("/get_customer_invoices", response_model=List[CustomerInvoiceSchema])
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

@app.get("/customer_invoices_summary", response_model=InvoiceSummaryResponse)
async def get_customer_invoices_summary_endpoint(
    start_date: str,
    end_date: str,
):
    """
    Get aggregated customer invoices data (amount, tax, total) between two dates.
    
    Query Parameters:
    - start_date: ISO format date string (e.g., "2024-01-01")
    - end_date: ISO format date string (e.g., "2024-12-31")
    """
    try:
        from datetime import datetime
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        return await get_customer_invoices_summary(start, end)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date format. Use ISO format (YYYY-MM-DD): {str(e)}"
        )

@app.get("/supplier_invoices_summary", response_model=InvoiceSummaryResponse)
async def get_supplier_invoices_summary_endpoint(
    start_date: str,
    end_date: str,
):
    """
    Get aggregated supplier invoices data (amount, tax, total) between two dates.
    
    Query Parameters:
    - start_date: ISO format date string (e.g., "2024-01-01")
    - end_date: ISO format date string (e.g., "2024-12-31")
    """
    try:
        from datetime import datetime
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        return await get_supplier_invoices_summary(start, end)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date format. Use ISO format (YYYY-MM-DD): {str(e)}"
        )

@app.post("/save_modelo_130", status_code=201)
async def save_modelo_130_endpoint(modelo: Modelo130Schema):
    """
    Save Modelo 130 (tax form) data to Supabase.
    
    Body:
    - ejercicio: Year (e.g., "2024")
    - periodo: Period (e.g., "01", "02", etc.)
    - casilla01-07, casilla19: Tax form fields with decimal values
    """
    try:
        result = await save_modelo_130(modelo)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Error saving Modelo 130: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving Modelo 130: {str(e)}") from e

@app.get("/get_modelo_130", response_model=Modelo130Schema)
async def get_modelo_130_endpoint(
    ejercicio: str,
    periodo: str,
):
    """
    Retrieve Modelo 130 (tax form) data from Supabase by year and period.
    
    Query Parameters:
    - ejercicio: Year (e.g., "2024")
    - periodo: Period (e.g., "01", "02", etc.)
    """
    try:
        result = await get_modelo_130(ejercicio, periodo)
        if not result:
            raise HTTPException(
                status_code=404,
                detail=f"Modelo 130 not found for ejercicio={ejercicio}, periodo={periodo}"
            )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Error retrieving Modelo 130: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving Modelo 130: {str(e)}") from e


@app.get("/calculate_modelo_130", response_model=Modelo130Schema)
async def calculate_modelo_130_endpoint(
    start_date: str,
    end_date: str,
):
    """
    Calculates a new Modelo 130 based on aggregated customer and supplier invoices
    within the specified date range.
    
    Query Parameters:
    - start_date: ISO format date string (e.g., "2024-01-01")
    - end_date: ISO format date string (e.g., "2024-12-31")
    """
    try:
        from datetime import datetime
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        print("Entro en calculate modelo_130_endpoint")
        logger.info(f"Calculating new Modelo 130 for period endpoint: {start_date} to {end_date}")
        return await calculate_new_declaracion(start, end)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date format or calculation error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error calculating new Modelo 130: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error calculating new Modelo 130: {str(e)}") from e

@app.post("/extract-excel")
async def extract_excel_data_endpoint(file: UploadFile = File(...)):
    logger.info("--- Entro en extract excel")
    if file.content_type not in {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"}:
        raise HTTPException(status_code=415, detail="Solo se acepta Excel (.xlsx, .xls).")

    excel_bytes = await file.read()
    if not excel_bytes:
        raise HTTPException(status_code=400, detail="El archivo Excel está vacío.")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as temp_file:
        temp_file.write(excel_bytes)
        temp_file_path = temp_file.name

    try:
        # Call the excel_extraction function
        json_data = extract_excel_data(temp_file_path)
        #json_data = json_data.fillna("")
        return json.loads(json_data)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar el archivo Excel: {e}") from e
    finally:
        # Clean up the temporary file
        os.unlink(temp_file_path)

