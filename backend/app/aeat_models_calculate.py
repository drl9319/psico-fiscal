from datetime import datetime
import logging
from typing import List, Optional
from decimal import Decimal
from pydantic import BaseModel, Field

from .db_supabase_manager import SupabaseRepository
from .models.modelo_130 import Modelo130Schema
from .models.modelo_303 import Modelo303Schema


class InvoiceSummaryResponse(BaseModel):
    """Response model for customer invoices summary between two dates"""
    total_amount: Decimal = Field(..., description="Sum of all base amounts (baseImponible)")
    total_tax: Decimal = Field(..., description="Sum of all taxes")
    total_revenue: Decimal = Field(..., description="Sum of all totals")
    invoice_count: int = Field(..., description="Number of invoices in the period")
    start_date: datetime
    end_date: datetime


async def get_customer_invoices_summary(
    start_date: datetime,
    end_date: datetime,
    access_token: str = "",
) -> InvoiceSummaryResponse:
    """
    Retrieves customer invoices between two dates and calculates aggregated totals.
    
    Args:
        start_date: Start date for the period (inclusive)
        end_date: End date for the period (inclusive)
        access_token: User's JWT for RLS-aware queries.
    
    Returns:
        InvoiceSummaryResponse with aggregated amount, tax, and total
    """
    try:
        repo = SupabaseRepository.get_user_instance(access_token) if access_token else SupabaseRepository.get_instance()
        
        # Get all customer invoices (will filter by date in the calculation)
        invoices = await repo.get_all("customer_invoices", limit=1000)
        
        # Filter invoices by date range
        filtered_invoices = [
            inv for inv in invoices
            if start_date <= datetime.fromisoformat(str(inv.get("accounting_date"))) <= end_date
        ]
        
        # Calculate totals
        total_amount = sum(
            Decimal(str(inv.get("amount", 0))) for inv in filtered_invoices
        )
        total_tax = sum(
            Decimal(str(inv.get("tax", 0))) for inv in filtered_invoices
        )
        total_revenue = sum(
            Decimal(str(inv.get("total", 0))) for inv in filtered_invoices
        )
        
        return InvoiceSummaryResponse(
            total_amount=total_amount,
            total_tax=total_tax,
            total_revenue=total_revenue,
            invoice_count=len(filtered_invoices),
            start_date=start_date,
            end_date=end_date,
        )
        
    except Exception as e:
        raise ValueError(f"Error calculating customer invoices summary: {str(e)}") from e


async def get_supplier_invoices_summary(
    start_date: datetime,
    end_date: datetime,
    access_token: str = "",
) -> InvoiceSummaryResponse:
    """
    Retrieves supplier invoices between two dates and calculates aggregated totals.
    
    Args:
        start_date: Start date for the period (inclusive)
        end_date: End date for the period (inclusive)
        access_token: User's JWT for RLS-aware queries.
    
    Returns:
        InvoiceSummaryResponse with aggregated amount, tax, and total
    """
    try:
        repo = SupabaseRepository.get_user_instance(access_token) if access_token else SupabaseRepository.get_instance()
        
        # Get all supplier invoices (will filter by date in the calculation)
        invoices = await repo.get_all("supplier_invoices", limit=1000)
        
        # Filter invoices by date range
        filtered_invoices = [
            inv for inv in invoices
            if start_date <= datetime.fromisoformat(str(inv.get("accounting_date"))) <= end_date
        ]
        
        # Calculate totals
        total_amount = sum(
            Decimal(str(inv.get("amount", 0))) for inv in filtered_invoices
        )
        total_tax = sum(
            Decimal(str(inv.get("tax", 0))) for inv in filtered_invoices
        )
        total_revenue = sum(
            Decimal(str(inv.get("total", 0))) for inv in filtered_invoices
        )
        
        return InvoiceSummaryResponse(
            total_amount=total_amount,
            total_tax=total_tax,
            total_revenue=total_revenue,
            invoice_count=len(filtered_invoices),
            start_date=start_date,
            end_date=end_date,
        )
        
    except Exception as e:
        raise ValueError(f"Error calculating supplier invoices summary: {str(e)}") from e


async def save_modelo_130(
    modelo_130: Modelo130Schema,
    access_token: str = "",
) -> dict:
    """
    Saves or updates Modelo 130 data in the Supabase database.

    Args:
        modelo_130: Modelo130Schema object with tax form data
        access_token: User's JWT for RLS-aware queries.

    Returns:
        Dictionary with the created/updated record or error information
    """
    try:
        repo = SupabaseRepository.get_user_instance(access_token) if access_token else SupabaseRepository.get_instance()

        # 1. Extraemos los campos del modelo en un diccionario para limpiarlos
        # Nota: Si usas Pydantic v1 usa modelo_130.dict(), si usas v2 usa .model_dump()
        datos_limpios = modelo_130.model_dump() if hasattr(modelo_130, 'model_dump') else modelo_130.dict()

        # 2. Convertimos todos los objetos Decimal a float
        for clave, valor in datos_limpios.items():
            if isinstance(valor, Decimal):
                datos_limpios[clave] = float(valor)

        # Check if a record with the same ejercicio and periodo exists
        existing_records = await repo.get_all("modelo130_presentaciones", limit=1000)
        for record in existing_records:
            if record.get("ejercicio") == modelo_130.ejercicio and record.get("periodo") == modelo_130.periodo:
                # El método update sí suele esperar un diccionario plano (dict)
                updated_record = await repo.update(
                    "modelo130_presentaciones",
                    record["id"],  
                    datos_limpios
                )
                return {"status": "success", "data": updated_record, "action": "updated"}

        # 3. Para el create, creamos una copia del OBJETO de Pydantic con los floats inyectados
        # Esto soluciona el error porque el repositorio recibirá el objeto esperado con .model_dump
        modelo_con_floats = modelo_130.model_copy(update=datos_limpios) if hasattr(modelo_130, 'model_copy') else modelo_130.copy(update=datos_limpios)

        created_record = await repo.create("modelo130_presentaciones", modelo_con_floats)
        return {"status": "success", "data": created_record, "action": "created"}

    except Exception as e:
        raise ValueError(f"Error saving Modelo 130: {str(e)}") from e


async def get_modelo_130(
    ejercicio: str,
    periodo: str,
    access_token: str = "",
) -> Optional[Modelo130Schema]:
    """
    Retrieves Modelo 130 data from Supabase by ejercicio (year) and periodo (period).
    
    Args:
        ejercicio: Year as string (e.g., "2024")
        periodo: Period as string (e.g., "Q1", "Q2", etc.)
        access_token: User's JWT for RLS-aware queries.
    
    Returns:
        Modelo130Schema object if found, None otherwise
    """
    try:
        repo = SupabaseRepository.get_user_instance(access_token) if access_token else SupabaseRepository.get_instance()
        
        # Get all records and filter by ejercicio and periodo
        # Note: For better performance with large datasets, consider adding
        # a filtered query method to the repository
        all_records = await repo.get_all("modelo130_presentaciones", limit=1000)
        print(f"Retrieved {len(all_records)} records from modelo130_presentaciones")
        print(f"Looking for record with ejercicio={ejercicio} and periodo={periodo}")
        for record in all_records:
            if record.get("ejercicio") == ejercicio and record.get("periodo") == periodo:
                print(f"Found matching record: {record}")
                return Modelo130Schema(**record)
        
        return None
        
    except Exception as e:
        raise ValueError(f"Error retrieving Modelo 130: {str(e)}") from e


async def calculate_new_declaracion(
    start_date: datetime,
    end_date: datetime,
    access_token: str = "",
) -> Modelo130Schema:
    """
    Calculates initial Modelo 130 values based on customer and supplier invoice summaries.

    Args:
        start_date: Start date for the calculation period (inclusive)
        end_date: End date for the calculation period (inclusive)
        access_token: User's JWT for RLS-aware queries.

    Returns:
        A Modelo130Schema object with casilla01 (customer total revenue) and
        casilla02 (supplier total revenue) populated.
    """
    try:
        print("Entro en calculate_new_declaracion")
        print(f"Calculating new Modelo 130 for period: {start_date} to {end_date}")
        customer_summary = await get_customer_invoices_summary(start_date, end_date, access_token)
        supplier_summary = await get_supplier_invoices_summary(start_date, end_date, access_token)

        # Determine the quarter of the declaration
        current_quarter = start_date.month // 3 + 1

        # Initialize values for Casilla01 and Casilla02
        casilla01_value = customer_summary.total_revenue
        casilla02_value = supplier_summary.total_revenue

        # Casilla05: "De trimestres anteriores" — defaults to 0 for Q1
        casilla05_value = Decimal('0.00')

        # If not the first quarter, retrieve the last quarter's data
        if current_quarter > 1:
            previous_quarter = current_quarter - 1
            ejercicio = str(start_date.year)
            periodo = f"Q{previous_quarter}"

            last_quarter_data = await get_modelo_130(ejercicio, periodo)

            if last_quarter_data:
                casilla01_value += last_quarter_data.Casilla01
                casilla02_value += last_quarter_data.Casilla02
                # Casilla05 gets sum of previous quarter's "De trimestres anteriores" (Casilla05) + "Pago fraccionado previo" (Casilla07)
                casilla05_value += last_quarter_data.Casilla05 + last_quarter_data.Casilla07

        # Calculate casilla03 (Rendimiento Neto)
        casilla03_value = casilla01_value - casilla02_value

        # Calculate casilla04 (20% importe casilla 03)
        casilla04_value = casilla03_value * Decimal('0.20')

        # Casilla07 = casilla04 - casilla05 (Pago fraccionado previo)
        casilla07_value = casilla04_value - casilla05_value

        # Initialize Modelo130Schema with calculated values
        return Modelo130Schema(
            ejercicio=str(start_date.year),
            periodo=f"{current_quarter}T", # Example: 01,02,03 -> 1T
            Casilla01=casilla01_value,
            Casilla02=casilla02_value,
            Casilla03=casilla03_value,
            Casilla04=casilla04_value,
            Casilla05=casilla05_value,
            Casilla06=Decimal('0.00'), # Default
            Casilla07=casilla07_value,
            Casilla19=Decimal('0.00'), # Default
        )
    except Exception as e:
        raise ValueError(f"Error calculating new Modelo 130: {str(e)}") from e


# ════════════════════════════════════════════════════════════════
# Modelo 303 functions
# ════════════════════════════════════════════════════════════════


async def save_modelo_303(
    modelo_303: Modelo303Schema,
    access_token: str = "",
) -> dict:
    """
    Saves or updates Modelo 303 data in the Supabase database.

    Args:
        modelo_303: Modelo303Schema object with tax form data
        access_token: User's JWT for RLS-aware queries.

    Returns:
        Dictionary with the created/updated record or error information
    """
    try:
        repo = SupabaseRepository.get_user_instance(access_token) if access_token else SupabaseRepository.get_instance()

        datos_limpios = modelo_303.model_dump() if hasattr(modelo_303, 'model_dump') else modelo_303.dict()
        for clave, valor in datos_limpios.items():
            if isinstance(valor, Decimal):
                datos_limpios[clave] = float(valor)

        # Check if a record with the same ejercicio and periodo exists
        existing_records = await repo.get_all("modelo303_presentaciones", limit=1000)
        for record in existing_records:
            if record.get("ejercicio") == modelo_303.ejercicio and record.get("periodo") == modelo_303.periodo:
                updated_record = await repo.update(
                    "modelo303_presentaciones",
                    record["id"],
                    datos_limpios
                )
                return {"status": "success", "data": updated_record, "action": "updated"}

        modelo_con_floats = modelo_303.model_copy(update=datos_limpios) if hasattr(modelo_303, 'model_copy') else modelo_303.copy(update=datos_limpios)
        created_record = await repo.create("modelo303_presentaciones", modelo_con_floats)
        return {"status": "success", "data": created_record, "action": "created"}

    except Exception as e:
        raise ValueError(f"Error saving Modelo 303: {str(e)}") from e


async def get_modelo_303(
    ejercicio: str,
    periodo: str,
    access_token: str = "",
) -> Optional[Modelo303Schema]:
    """
    Retrieves Modelo 303 data from Supabase by ejercicio (year) and periodo (period).

    Args:
        ejercicio: Year as string (e.g., "2024")
        periodo: Period as string (e.g., "01", "02", etc.)
        access_token: User's JWT for RLS-aware queries.

    Returns:
        Modelo303Schema object if found, None otherwise
    """
    try:
        repo = SupabaseRepository.get_user_instance(access_token) if access_token else SupabaseRepository.get_instance()

        all_records = await repo.get_all("modelo303_presentaciones", limit=1000)
        print(f"Retrieved {len(all_records)} records from modelo303_presentaciones")
        print(f"Looking for record with ejercicio={ejercicio} and periodo={periodo}")
        for record in all_records:
            if record.get("ejercicio") == ejercicio and record.get("periodo") == periodo:
                print(f"Found matching record: {record}")
                return Modelo303Schema(**record)

        return None

    except Exception as e:
        raise ValueError(f"Error retrieving Modelo 303: {str(e)}") from e


async def calculate_modelo_303(
    start_date: datetime,
    end_date: datetime,
    access_token: str = "",
) -> Modelo303Schema:
    """
    Calculates Modelo 303 values based on aggregated customer and supplier invoices.

    Calculation rules:
      IVA DEVENGADO (Output IVA):
        casilla150: sum customer_invoices amount (base imponible), tipo factura (is_credit_note=false)
        casilla152: sum customer_invoices tax (cuota IVA), tipo factura (is_credit_note=false)
        casilla14:  sum customer_invoices amount (base imponible), tipo Abono (is_credit_note=true)
        casilla15:  sum customer_invoices tax (cuota IVA), tipo Abono (is_credit_note=true)

      IVA DEDUCIBLE (Input IVA):
        casilla28:  sum supplier_invoices amount (base imponible), tipo factura (is_credit_note=false)
        casilla29:  sum supplier_invoices tax (cuota IVA), tipo factura (is_credit_note=false)
        casilla40:  sum supplier_invoices amount (base imponible), tipo Abono (is_credit_note=true)
        casilla41:  sum supplier_invoices tax (cuota IVA), tipo Abono (is_credit_note=true)

    Args:
        start_date: Start date for the calculation period (inclusive)
        end_date: End date for the calculation period (inclusive)
        access_token: User's JWT for RLS-aware queries.

    Returns:
        A Modelo303Schema object with calculated values.
    """
    try:
        print(f"Calculating Modelo 303 for period: {start_date} to {end_date}")

        repo = SupabaseRepository.get_user_instance(access_token) if access_token else SupabaseRepository.get_instance()

        # ── Fetch all invoices ──
        customer_invoices = await repo.get_all("customer_invoices", limit=1000)
        supplier_invoices = await repo.get_all("supplier_invoices", limit=1000)

        # ── Helper: safely parse a boolean from various sources ──
        def _is_truthy(val):
            """Handle boolean values that might come as string 'true'/'false' from DB."""
            if isinstance(val, bool):
                return val
            if isinstance(val, str):
                return val.strip().lower() == "true"
            return bool(val)

        # ── Filter by date range ──
        def in_date_range(inv):
            raw_date = str(inv.get("accounting_date", ""))
            # Try common ISO formats, then fall back to date-only
            try:
                inv_date = datetime.fromisoformat(raw_date)
            except (ValueError, TypeError):
                try:
                    from datetime import date
                    if isinstance(inv.get("accounting_date"), date) and not isinstance(inv.get("accounting_date"), datetime):
                        inv_date = datetime.combine(inv.get("accounting_date"), datetime.min.time())
                    else:
                        # Last resort — try parsing as date only
                        from datetime import date
                        d = date.fromisoformat(raw_date[:10])
                        inv_date = datetime.combine(d, datetime.min.time())
                except Exception:
                    print(f"WARNING: Could not parse date: {raw_date}")
                    return False
            return start_date <= inv_date <= end_date

        customer_filtered = [inv for inv in customer_invoices if in_date_range(inv)]
        supplier_filtered = [inv for inv in supplier_invoices if in_date_range(inv)]

        # ── Helper: sum a field with a credit-note filter ──
        def sum_field(invoices, field, is_credit_note=None):
            filtered = invoices
            if is_credit_note is not None:
                filtered = [
                    inv for inv in invoices
                    if _is_truthy(inv.get("is_credit_note", False)) == is_credit_note
                ]
            return sum(Decimal(str(inv.get(field, 0))) for inv in filtered)

        # ── IVA DEVENGADO ──
        casilla150 = sum_field(customer_filtered, "amount", is_credit_note=False)
        casilla152 = sum_field(customer_filtered, "tax", is_credit_note=False)
        casilla14  = sum_field(customer_filtered, "amount", is_credit_note=True)
        casilla15  = sum_field(customer_filtered, "tax", is_credit_note=True)

        # ── IVA DEDUCIBLE ──
        casilla28 = sum_field(supplier_filtered, "amount", is_credit_note=False)
        casilla29 = sum_field(supplier_filtered, "tax", is_credit_note=False)
        # casilla40/41: supplier invoices with tipo Abono (credit notes)
        casilla40 = sum_field(supplier_filtered, "amount", is_credit_note=True)
        casilla41 = sum_field(supplier_filtered, "tax", is_credit_note=True)

        # Determine quarter
        current_quarter = (start_date.month - 1) // 3 + 1

        print(f"Modelo 303 results — casilla150={casilla150}, casilla152={casilla152}, "
              f"casilla14={casilla14}, casilla15={casilla15}, "
              f"casilla28={casilla28}, casilla29={casilla29}, "
              f"casilla40={casilla40}, casilla41={casilla41}")

        return Modelo303Schema(
            ejercicio=str(start_date.year),
            periodo=f"{current_quarter:02d}",
            casilla150=casilla150,
            casilla152=casilla152,
            casilla14=casilla14,
            casilla15=casilla15,
            casilla28=casilla28,
            casilla29=casilla29,
            casilla40=casilla40,
            casilla41=casilla41,
        )

    except Exception as e:
        raise ValueError(f"Error calculating Modelo 303: {str(e)}") from e
