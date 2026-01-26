import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AgroData Nexus API", version="1.0.0")

# ✅ CORS configuration - SECURE for production
# In production, NEVER use wildcard "*"
# Get allowed origins from environment variable (set in Vercel)
default_origins = "http://localhost:5173,http://localhost:3000,http://localhost:8000,http://localhost:8080"
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", default_origins)

# Parse comma-separated origins and strip whitespace
origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]

print(f"✅ CORS Allowed Origins: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # ✅ Specific methods
    allow_headers=["Content-Type", "Authorization"],              # ✅ Specific headers
)

@app.get("/api/health")
async def health():
    return {"status": "online", "environment": os.getenv("ENVIRONMENT", "development")}
