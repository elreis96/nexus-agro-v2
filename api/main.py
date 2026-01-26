import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AgroData Nexus API", version="1.0.0")

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

@app.get("/api/health")
async def health():
    """Health check endpoint - verifica se a API está online"""
    return {
        "status": "online",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "supabase_configured": bool(supabase_url and supabase_key),
        "cors_origins": len(origins),
    }
