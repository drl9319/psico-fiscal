from pydantic import BaseModel, Field
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

class CustomerInvoiceSchema(BaseModel):
    # 'id' suele ser gestionado por la BD (serial/identity), 
    # por lo que no es necesario incluirlo en la creación.
    
    accounting_date: date
    customer_name: str = Field(..., max_length=255)
    customer_address: Optional[str] = Field(None)
    customer_id: str = Field( max_length=100)
    #invoice_serie: int
    
    # Usamos Decimal para los campos 'numeric' para evitar errores de precisión
    amount: Decimal = Field( ge=0)
    tax: Decimal = Field(ge=0)
    total: Decimal = Field(ge=0)
    retencion: Decimal = Field(default=Decimal('0.00'), ge=0)
    nif: Optional[str] = Field(None, max_length=20)
    

    class Config:
        # Esto permite que Pydantic maneje objetos de BD si lo necesitas
        from_attributes = True