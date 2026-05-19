from datetime import datetime
import logging
from typing import List, Optional
from decimal import Decimal
from pydantic import BaseModel, Field

from .db_supabase_manager import SupabaseRepository
from .models.modelo_130 import Modelo130Schema


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
) -> InvoiceSummaryResponse:
    """
    Retrieves customer invoices between two dates and calculates aggregated totals.
    
    Args:
        start_date: Start date for the period (inclusive)
        end_date: End date for the period (inclusive)
    
    Returns:
        InvoiceSummaryResponse with aggregated amount, tax, and total
    """
    try:
        repo = SupabaseRepository.get_instance()
        
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
) -> InvoiceSummaryResponse:
    """
    Retrieves supplier invoices between two dates and calculates aggregated totals.
    
    Args:
        start_date: Start date for the period (inclusive)
        end_date: End date for the period (inclusive)
    
    Returns:
        InvoiceSummaryResponse with aggregated amount, tax, and total
    """
    try:
        repo = SupabaseRepository.get_instance()
        
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
) -> dict:
    """
    Saves Modelo 130 data to Supabase database.
    
    Args:
        modelo_130: Modelo130Schema object with tax form data
    
    Returns:
        Dictionary with the created record or error information
    """
    try:
        repo = SupabaseRepository.get_instance()
        
        # Use repository create method - passes the Pydantic model directly
        created_record = await repo.create("modelo130_presentaciones", modelo_130)
        return {"status": "success", "data": created_record}
        
    except Exception as e:
        raise ValueError(f"Error saving Modelo 130: {str(e)}") from e


async def get_modelo_130(
    ejercicio: str,
    periodo: str,
) -> Optional[Modelo130Schema]:
    """
    Retrieves Modelo 130 data from Supabase by ejercicio (year) and periodo (period).
    
    Args:
        ejercicio: Year as string (e.g., "2024")
        periodo: Period as string (e.g., "01", "02", etc.)
    
    Returns:
        Modelo130Schema object if found, None otherwise
    """
    try:
        repo = SupabaseRepository.get_instance()
        
        # Get all records and filter by ejercicio and periodo
        # Note: For better performance with large datasets, consider adding
        # a filtered query method to the repository
        all_records = await repo.get_all("modelo130_presentaciones", limit=1000)
        
        for record in all_records:
            if record.get("ejercicio") == ejercicio and record.get("periodo") == periodo:
                return Modelo130Schema(**record)
        
        return None
        
    except Exception as e:
        raise ValueError(f"Error retrieving Modelo 130: {str(e)}") from e


async def calculate_new_declaracion(
    start_date: datetime,
    end_date: datetime,
) -> Modelo130Schema:
    """
    Calculates initial Modelo 130 values based on customer and supplier invoice summaries.
    
    Args:
        start_date: Start date for the calculation period (inclusive)
        end_date: End date for the calculation period (inclusive)
    
    Returns:
        A Modelo130Schema object with casilla01 (customer total revenue) and
        casilla02 (supplier total revenue) populated.
    """
    try:
        print("Entro en calculate_new_declaracion")
        print(f"Calculating new Modelo 130 for period: {start_date} to {end_date}")
        customer_summary = await get_customer_invoices_summary(start_date, end_date)
        supplier_summary = await get_supplier_invoices_summary(start_date, end_date)
        
        # Calculate casilla03 (Rendimiento Neto)
        casilla03_value = customer_summary.total_revenue - supplier_summary.total_revenue
        print(f"prueba valor de customer_summary.total_revenue: {customer_summary.total_revenue}")
        print(f"prueba valor de supplier_summary.total_revenue: {supplier_summary.total_revenue}")

        # Calculate casilla04 (20% importe casilla 03)
        casilla04_value = casilla03_value * Decimal('0.20')

        # Initialize Modelo130Schema with calculated values
        return Modelo130Schema(
            ejercicio=str(start_date.year),
            periodo=f"{start_date.month//3 + 1}T", # Example: 01,02,03 -> 1T
            Casilla01=customer_summary.total_revenue,
            Casilla02=supplier_summary.total_revenue,
            Casilla03=casilla03_value,
            Casilla04=casilla04_value,
            Casilla05=Decimal('0.00'), # Default
            Casilla06=Decimal('0.00'), # Default
            Casilla07=casilla04_value, # Default, can be adjusted
            Casilla19=Decimal('0.00'), # Default
        )
    except Exception as e:
        raise ValueError(f"Error calculating new Modelo 130: {str(e)}") from e
