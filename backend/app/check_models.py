import os
from dotenv import load_dotenv
from google import genai

# Carga las variables desde el archivo .env
load_dotenv(dotenv_path="../../.env.local")
# Obtiene la clave
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("¡ERROR! No se encuentra la clave GOOGLE_API_KEY en tu archivo .env.")
else:
    print("Clave encontrada. Conectando con Google...")
    try:
        # Inicializa el cliente moderno
        client = genai.Client(api_key=api_key)
        
        # Lista los modelos disponibles
        for model in client.models.list():
            print(f"Modelo disponible: {model.name}")
            
    except Exception as e:
        print(f"Error de conexión: {e}")