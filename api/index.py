from mangum import Mangum
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Simple FastAPI app for testing
app = FastAPI(title="AgroData Nexus API - Simple", version="1.0.0")

# CORS
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok", "message": "Simple API working"}

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "environment": "vercel" if os.getenv("VERCEL") else "local",
        "supabase_url": "configured" if os.getenv("VITE_SUPABASE_URL") else "missing"
    }

# Mangum handler
handler = Mangum(app, lifespan="off")
