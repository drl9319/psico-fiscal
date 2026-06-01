from pydantic import BaseModel, Field
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

class SupplierInvoiceSchema(BaseModel):
    # 'id' suele ser gestionado por la BD (serial/identity), 
    # por lo que no es necesario incluirlo en la creación.
    
    # 'id' gestionado automáticamente por Supabase (id identity/serial)
    id: Optional[int] = Field(default=None)
    accounting_date: date
    supplier_name: str = Field(..., max_length=255)
    supplier_address: Optional[str] = Field(None)
    supplier_id: str = Field(max_length=100)
    invoice_number: str = Field(..., description="El número de factura o un identificador único.")
    
    # Usamos Decimal para los campos 'numeric' para evitar errores de precisión
    amount: Decimal = Field()
    tax: Decimal = Field()
    total: Decimal = Field()
    retencion: Decimal = Field(default=Decimal('0.00'))
    is_credit_note: bool = Field(default=False, description="Indica si la factura es un abono (nota de crédito), basado en si el total es negativo.")

    class Config:
        # Esto permite que Pydantic maneje objetos de BD si lo necesitas
        from_attributes = True