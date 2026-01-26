import os
import time
from typing import Dict
from collections import defaultdict
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from datetime import datetime, timedelta

app = FastAPI(
    title="AgroData Nexus API",
    version="1.0.0",
    docs_url="/api/docs" if os.getenv("ENVIRONMENT") != "production" else None,
    redoc_url="/api/redoc" if os.getenv("ENVIRONMENT") != "production" else None,
)

# ✅ CORS configuration - SECURE for production
# In production, NEVER use wildcard "*"
# Get allowed origins from environment variable (set in Vercel/Railway)
default_origins = "http://localhost:5173,http://localhost:3000,http://localhost:8000,http://localhost:8080"
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", default_origins)

# Parse comma-separated origins and strip whitespace
origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]

# ✅ Log CORS configuration for debugging
print(f"✅ CORS Allowed Origins: {origins}")
print(f"✅ Environment: {os.getenv('ENVIRONMENT', 'development')}")

# ✅ Validate Supabase configuration
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url:
    print("⚠️ WARNING: SUPABASE_URL not configured")
if not supabase_key:
    print("⚠️ WARNING: SUPABASE_SERVICE_ROLE_KEY not configured")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # ✅ Specific methods
    allow_headers=["Content-Type", "Authorization"],              # ✅ Specific headers
)

# ✅ Rate Limiting (Simple in-memory implementation)
# In production, use Redis for distributed rate limiting
rate_limit_store: Dict[str, list] = defaultdict(list)
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "60"))  # seconds

# Tentar usar Redis se disponível
USE_REDIS = False
redis_client = None
try:
    import sys
    import os
    # Adicionar diretório api ao path
    api_dir = os.path.dirname(os.path.abspath(__file__))
    if api_dir not in sys.path:
        sys.path.insert(0, api_dir)
    
    from lib.redis_client import redis_client
    USE_REDIS = redis_client.enabled
except (ImportError, ModuleNotFoundError) as e:
    USE_REDIS = False
    redis_client = None
    print(f"ℹ️ Redis client não disponível ({e}), usando rate limiting em memória")

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Rate limiting middleware com suporte a Redis"""
    # Skip rate limiting for health checks
    if request.url.path == "/api/health":
        return await call_next(request)
    
    # Get client IP
    client_ip = request.client.host if request.client else "unknown"
    rate_limit_key = f"rate_limit:{client_ip}"
    
    # Usar Redis se disponível, senão usar memória
    if USE_REDIS and redis_client:
        count = redis_client.increment(rate_limit_key, RATE_LIMIT_WINDOW)
        
        if count > RATE_LIMIT_REQUESTS:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": f"Rate limit exceeded. Maximum {RATE_LIMIT_REQUESTS} requests per {RATE_LIMIT_WINDOW} seconds."
                },
                headers={"Retry-After": str(RATE_LIMIT_WINDOW)},
            )
        
        remaining = max(0, RATE_LIMIT_REQUESTS - count)
    else:
        # Fallback para memória
        now = time.time()
        rate_limit_store[client_ip] = [
            timestamp for timestamp in rate_limit_store[client_ip]
            if now - timestamp < RATE_LIMIT_WINDOW
        ]
        
        if len(rate_limit_store[client_ip]) >= RATE_LIMIT_REQUESTS:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": f"Rate limit exceeded. Maximum {RATE_LIMIT_REQUESTS} requests per {RATE_LIMIT_WINDOW} seconds."
                },
                headers={"Retry-After": str(RATE_LIMIT_WINDOW)},
            )
        
        rate_limit_store[client_ip].append(now)
        remaining = RATE_LIMIT_REQUESTS - len(rate_limit_store[client_ip])
    
    # Add rate limit headers
    response = await call_next(request)
    response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT_REQUESTS)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    response.headers["X-RateLimit-Reset"] = str(int(time.time() + RATE_LIMIT_WINDOW))
    
    return response

# ✅ Cache headers middleware
@app.middleware("http")
async def cache_headers_middleware(request: Request, call_next):
    """Add cache headers to responses"""
    response = await call_next(request)
    
    # Add cache headers based on endpoint
    if request.url.path.startswith("/api/health"):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    elif request.url.path.startswith("/api/"):
        # Cache API responses for 5 minutes
        response.headers["Cache-Control"] = "public, max-age=300"
        response.headers["Vary"] = "Authorization"
    
    return response

# ✅ Global exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "path": request.url.path,
            "timestamp": datetime.utcnow().isoformat(),
        },
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors"""
    print(f"❌ Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error",
            "path": request.url.path,
            "timestamp": datetime.utcnow().isoformat(),
        },
    )

@app.get("/api/health")
async def health(request: Request):
    """Health check endpoint - verifica se a API está online"""
    return {
        "status": "online",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "supabase_configured": bool(supabase_url and supabase_key),
        "cors_origins": len(origins),
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
    }

@app.get("/api/")
async def root():
    """Root endpoint"""
    return {
        "status": "ok",
        "service": "AgroData Nexus API",
        "version": "1.0.0",
        "docs": "/api/docs" if os.getenv("ENVIRONMENT") != "production" else "disabled",
    }
