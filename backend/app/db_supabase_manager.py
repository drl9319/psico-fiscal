import os
import logging
from typing import Type, TypeVar, List, Optional, Any
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client
from supabase.client import ClientOptions

# Configuración del logging para auditoría
logger = logging.getLogger(__name__)
# Carga las variables desde el archivo .env
base_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(base_dir, "../../.env.local")

load_dotenv(dotenv_path=dotenv_path)

T = TypeVar("T", bound=BaseModel)

class SupabaseRepository:
    _instance: Optional["SupabaseRepository"] = None

    def __init__(self):
        """Inicialización del cliente de Supabase (Singleton pattern)."""
        url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        logger = logging.getLogger("uvicorn.error")

        if not url or not key:
            logger.error("Credenciales de Supabase no encontradas en el entorno.")
            raise ValueError(
                "NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configuradas."
            )
            
        self.client: Client = create_client(url, key)
        logger.info("Cliente de Supabase inicializado correctamente.")

    @classmethod
    def get_instance(cls) -> "SupabaseRepository":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    async def create(self, table: str, model: BaseModel) -> dict:
        """Crea un nuevo registro con validación Pydantic."""
        try:
            # Excluimos 'id' porque es auto-incremental y lo gestiona Supabase/BD
            data = model.model_dump(mode='json', exclude={'id'})
            response = self.client.table(table).insert(data).execute()
            logger.info(f"Registro creado exitosamente en {table}.")
            return response.data
        except Exception as e:
            logger.error(f"Error al crear registro en {table}: {str(e)}")
            raise

    async def get_all(self, table: str, limit: int = 100, order_by: str = "created_at") -> List[dict]:
        """Lee todos los registros de una tabla."""
        try:
            response = (
                self.client.table(table)
                .select("*")
                .limit(limit)
                .order(order_by)
                .execute()
                )
            return response.data
        except Exception as e:
            logger.error(f"Error al obtener registros de {table}: {str(e)}")
            raise

    async def update(self, table: str, record_id: int | str, updates: dict) -> dict:
        """Modifica un registro existente."""
        try:
            response = self.client.table(table).update(updates).eq("id", record_id).execute()
            logger.info(f"Registro {record_id} actualizado en {table}.")
            return response.data
        except Exception as e:
            logger.error(f"Error al actualizar registro {record_id} en {table}: {str(e)}")
            raise

    async def delete(self, table: str, record_id: int | str) -> bool:
        """Borra un registro por ID."""
        try:
            self.client.table(table).delete().eq("id", record_id).execute()
            logger.info(f"Registro {record_id} eliminado de {table}.")
            return True
        except Exception as e:
            logger.error(f"Error al eliminar registro {record_id} en {table}: {str(e)}")
            raise