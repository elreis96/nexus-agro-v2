"""
Vercel FastAPI Serverless Function Entry Point

This file is the entry point for Vercel's Python runtime.
Vercel automatically detects api/index.py and uses 'app' as the ASGI application.
No need for Mangum, handlers, or any adapters - just export a FastAPI app.
"""

import sys
import traceback
from fastapi import FastAPI
from fastapi.responses import JSONResponse

# Try to import the main app with production-ready error handling
try:
    from main import app
    print("✓ Successfully imported main app")
except Exception as e:
    print(f"✗ Failed to import main app: {str(e)}")
    print(traceback.format_exc())
    
    # Fallback: Create a minimal app that returns the error
    # This ensures Vercel doesn't show "Function crashed"
    app = FastAPI(title="AgroData Nexus API - Error Recovery", version="1.0.0")
    
    @app.get("/api/health")
    def health_error():
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": "Failed to initialize application",
                "details": str(e)
            }
        )
    
    @app.get("/")
    def root_error():
        return JSONResponse(
            status_code=503,
            content={
                "status": "error",
                "message": "Backend initialization failed. Check logs."
            }
        )

# The app object is automatically detected and used by Vercel
# No explicit handler or export needed
