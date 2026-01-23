import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from typing import Optional

# Load environment variables
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Supabase client
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

# Create FastAPI app
app = FastAPI(title="AgroData Nexus API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok", "service": "AgroData Nexus API", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy", "database": "connected" if supabase else "not configured"}

@app.get("/api/notifications")
def get_notifications(authorization: Optional[str] = Header(None), limit: int = 50):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Simple query without user filtering for now
    response = supabase.table('notifications').select('*').order('created_at', desc=True).limit(limit).execute()
    return response.data or []

@app.delete("/api/notifications/{notification_id}")
def delete_notification(notification_id: int, authorization: Optional[str] = Header(None)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    supabase.table('notifications').delete().eq('id', notification_id).execute()
    return {"success": True, "message": "Notification deleted"}
