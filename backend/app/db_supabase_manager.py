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
    """Repository for Supabase database operations.

    Two modes are supported:
    - **Admin mode** (``get_instance``): uses ``SUPABASE_SERVICE_ROLE_KEY`` —
      bypasses RLS.  Used for operations that need full access.
    - **User mode** (``get_user_instance``): uses the anon key + the
      authenticated user's JWT — subject to RLS policies so that
      ``auth.jwt() ->> 'email'`` can be inspected.
    """
    _instance: Optional["SupabaseRepository"] = None
    _url: Optional[str] = None
    _anon_key: Optional[str] = None

    @classmethod
    def _load_env(cls) -> tuple[str, str]:
        """Load & cache Supabase URL and anon key for reuse."""
        if cls._url is None or cls._anon_key is None:
            cls._url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
            cls._anon_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
            if not cls._url or not cls._anon_key:
                raise ValueError(
                    "NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY "
                    "deben estar configuradas."
                )
        return cls._url, cls._anon_key

    def __init__(self, url: str, key: str):
        """Initialise the repository with the given Supabase URL & key.

        Parameters
        ----------
        url : str
            Supabase project URL (``NEXT_PUBLIC_SUPABASE_URL``).
        key : str
            Either the ``SUPABASE_SERVICE_ROLE_KEY`` (admin mode) or the
            ``NEXT_PUBLIC_SUPABASE_ANON_KEY`` (user mode — RLS applies).
        """
        self.client: Client = create_client(url, key)
        logger = logging.getLogger("uvicorn.error")
        logger.info(
            "SupabaseRepository inicializado (key_prefix=%s…)",
            key[:8],
        )

    @classmethod
    def get_instance(cls) -> "SupabaseRepository":
        """Return the singleton admin repository (bypasses RLS)."""
        if cls._instance is None:
            url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
            key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            if not url or not key:
                raise ValueError(
                    "NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY "
                    "deben estar configuradas."
                )
            cls._instance = cls(url, key)
        return cls._instance

    @classmethod
    def get_user_instance(cls, access_token: str) -> "SupabaseRepository":
        """Create a *fresh* repository authenticated with the user's JWT.

        Uses the anon key and then sets the user's session so that
        subsequent queries respect RLS policies (``auth.jwt()`` will
        contain the user's email).

        Parameters
        ----------
        access_token : str
            The user's Supabase access token (JWT) obtained from
            ``auth.get_session().access_token`` on the frontend.
        """
        url, anon_key = cls._load_env()
        repo = cls(url, anon_key)

        # Set the authenticated session on the underlying PostgREST client
        # so that every request includes ``Authorization: Bearer <token>``.
        repo.client.auth.set_session(access_token, "")
        logger.info(
            "SupabaseRepository autenticado con JWT del usuario."
        )
        return repo

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