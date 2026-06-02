from pydantic import BaseModel, Field
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

class Modelo303Schema(BaseModel):
    # 'id' suele ser gestionado por la BD (serial/identity), 
    # por lo que no es necesario incluirlo en la creación.
    
    ejercicio: str = Field(..., max_length=4)
    periodo: str = Field(..., max_length=4)

    # ── IVA DEVENGADO (Output IVA) ──
    # General 0%
    casilla150: Decimal = Field(default=Decimal('0.00'), description="Base Imponible - General")
    casilla152: Decimal = Field(default=Decimal('0.00'), description="Cuota - General")
    # Modificación bases
    casilla14: Decimal = Field(default=Decimal('0.00'), description="Base Imponible - Modificación bases")
    casilla15: Decimal = Field(default=Decimal('0.00'), description="Cuota - Modificación bases")

    # ── IVA DEDUCIBLE (Input IVA) ──
    # Interiores corrientes
    casilla28: Decimal = Field(default=Decimal('0.00'), description="Base Imponible - Interiores corrientes")
    casilla29: Decimal = Field(default=Decimal('0.00'), description="Cuota - Interiores corrientes")
    # Modificación bases
    casilla40: Decimal = Field(default=Decimal('0.00'), description="Base Imponible - Modificación bases deducible")
    casilla41: Decimal = Field(default=Decimal('0.00'), description="Cuota - Modificación bases deducible")

    class Config:
        from_attributes = True
