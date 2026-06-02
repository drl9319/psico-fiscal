from pydantic import BaseModel, Field, field_validator
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

class CustomerInvoiceSchema(BaseModel):
    # 'id' suele ser gestionado por la BD (serial/identity),
    # por lo que no es necesario incluirlo en la creación.
    
    # 'id' gestionado automáticamente por Supabase (id identity/serial)
    id: Optional[int] = Field(default=None)
    accounting_date: date
    customer_name: str = Field(..., max_length=255)
    customer_address: Optional[str] = Field(None)
    customer_id: str = Field( max_length=100)
    invoice_number: str = Field(..., max_length=100)
    #invoice_serie: int
    
    # Usamos Decimal para los campos 'numeric' para evitar errores de precisión
    amount: Decimal = Field()
    tax: Decimal = Field()
    total: Decimal = Field()
    retencion: Decimal = Field(default=Decimal('0.00'))
    is_credit_note: bool = Field(default=False, description="Indica si la factura es un abono (nota de crédito), basado en si el total es negativo.")

    @field_validator("is_credit_note", mode="before")
    @classmethod
    def compute_credit_note(cls, v: bool, info) -> bool:
        """Auto-compute is_credit_note from total if not explicitly provided."""
        if isinstance(v, bool):
            return v
        data = info.data
        total = data.get("total")
        if total is not None:
            return float(total) < 0
        return False

    class Config:
        # Esto permite que Pydantic maneje objetos de BD si lo necesitas
        from_attributes = True