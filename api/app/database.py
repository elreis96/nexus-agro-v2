"""
Database module - Supabase client connection
"""

from supabase import create_client, Client
from app.config import settings
from typing import Optional


class Database:
    """Supabase database connection manager"""
    
    _client: Optional[Client] = None
    
    @classmethod
    def get_client(cls) -> Client:
        """Get or create Supabase client"""
        if cls._client is None:
            if not settings.is_configured:
                raise ValueError(
                    "Supabase credentials not configured. "
                    "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env"
                )
            
            cls._client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_ANON_KEY
            )
        
        return cls._client


def get_supabase() -> Client:
    """Dependency for FastAPI routes"""
    return Database.get_client()
