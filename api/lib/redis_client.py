"""
Redis Client para Rate Limiting Distribuído
Preparado para uso futuro quando Redis estiver disponível
"""

import os
from typing import Optional

# Tentar importar redis, mas não falhar se não estiver instalado
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None


class RedisClient:
    """Cliente Redis para rate limiting distribuído"""
    
    def __init__(self):
        self.client: Optional[redis.Redis] = None
        self.enabled = False
        
        if REDIS_AVAILABLE:
            redis_url = os.getenv("REDIS_URL")
            if redis_url:
                try:
                    self.client = redis.from_url(redis_url, decode_responses=True)
                    # Testar conexão
                    self.client.ping()
                    self.enabled = True
                    print("✅ Redis conectado com sucesso")
                except Exception as e:
                    print(f"⚠️ Erro ao conectar Redis: {e}")
                    print("⚠️ Usando rate limiting em memória")
            else:
                print("ℹ️ REDIS_URL não configurada, usando rate limiting em memória")
        else:
            print("ℹ️ Redis não instalado, usando rate limiting em memória")
    
    def increment(self, key: str, expiry: int = 60) -> int:
        """
        Incrementa contador e retorna valor atual
        Se Redis não estiver disponível, retorna 0 (não limita)
        """
        if not self.enabled or not self.client:
            return 0
        
        try:
            count = self.client.incr(key)
            if count == 1:  # Primeira vez, definir expiry
                self.client.expire(key, expiry)
            return count
        except Exception as e:
            print(f"⚠️ Erro ao incrementar contador Redis: {e}")
            return 0
    
    def get(self, key: str) -> int:
        """Obtém valor do contador"""
        if not self.enabled or not self.client:
            return 0
        
        try:
            value = self.client.get(key)
            return int(value) if value else 0
        except Exception:
            return 0
    
    def reset(self, key: str) -> None:
        """Reseta contador"""
        if self.enabled and self.client:
            try:
                self.client.delete(key)
            except Exception:
                pass


# Instância global
redis_client = RedisClient()
