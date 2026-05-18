from datetime import datetime
from typing import List
from decimal import Decimal
from pydantic import BaseModel, Field

from .db_supabase_manager import SupabaseRepository


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
