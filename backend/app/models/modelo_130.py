from pydantic import BaseModel, Field
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

class Modelo130Schema(BaseModel):
    # 'id' suele ser gestionado por la BD (serial/identity), 
    # por lo que no es necesario incluirlo en la creación.
    
    ejercicio: str = Field(..., max_length=4)
    periodo: str = Field(..., max_length=4)
    Casilla01: Decimal = Field(default=Decimal('0.00'))
    Casilla02: Decimal = Field(default=Decimal('0.00'))
    Casilla03: Decimal = Field(default=Decimal('0.00'))
    Casilla04: Decimal = Field(default=Decimal('0.00'))
    Casilla05: Decimal = Field(default=Decimal('0.00'))
    Casilla06: Decimal = Field(default=Decimal('0.00'))
    Casilla07: Decimal = Field(default=Decimal('0.00'))
    Casilla19: Decimal = Field(default=Decimal('0.00'))

    class Config:
        # Esto permite que Pydantic maneje objetos de BD si lo necesitas
        from_attributes = True