"""
Configuration module for FastAPI backend
Loads environment variables and provides app-wide settings
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)


class Settings:
    """Application settings"""
    
    # Supabase
    SUPABASE_URL: str = os.getenv("VITE_SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("VITE_SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # API
    API_TITLE: str = "AgroData Nexus API"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = "Backend API for AgroData Nexus - Market Intelligence Platform"
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:8080",
        "http://localhost:5173",
        "https://nexus-agro.vercel.app",
        "https://*.vercel.app"
    ]
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_IMPORT_PER_HOUR: int = 10
    
    # JWT
    JWT_ALGORITHM: str = "HS256"
    
    @property
    def is_configured(self) -> bool:
        """Check if required settings are present"""
        return bool(self.SUPABASE_URL and self.SUPABASE_ANON_KEY)


settings = Settings()
