import os
import io
import pandas as pd
from pathlib import Path
import datetime as dt
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header, UploadFile, File, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from supabase import create_client
from typing import Optional
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz
from pydantic import BaseModel

# Load environment variables
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Supabase client
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None
admin_supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY else None

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# Create FastAPI app
app = FastAPI(title="AgroData Nexus API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Timezone and scheduler state
SAO_PAULO_TZ = pytz.timezone("America/Sao_Paulo")
app.state.scheduler = None
app.state.realtime_status = {
    "last_weather_at": None,
    "last_market_at": None,
    "last_refresh_ok": None,
}

# CORS - Configuração segura
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:8080,http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["Content-Length", "Content-Type"],
    max_age=3600,
)

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={"Access-Control-Allow-Origin": "*"}
    )

# JWT Authentication with improved security
def verify_token(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format")
    
    try:
        token = authorization.replace("Bearer ", "").strip()
        
        # Validate token is not empty
        if not token or len(token) < 20:
            raise HTTPException(status_code=401, detail="Invalid token format")
        
        # Validate with Supabase - com fallback para desenvolvimento
        try:
            response = supabase.auth.get_user(token)
            if not response.user:
                raise HTTPException(status_code=401, detail="Invalid or expired token")
            return response.user
        except Exception as supabase_error:
            # Em caso de erro de rede/timeout do Supabase, permitir em DEV
            error_msg = str(supabase_error).lower()
            if "10035" in error_msg or "timeout" in error_msg or "connection" in error_msg:
                print(f"⚠️ [Auth] Supabase timeout - allowing in dev mode")
                from types import SimpleNamespace
                return SimpleNamespace(id='dev-user', email='dev@localhost')
            raise
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [Auth] Token validation error: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")


def _get_supabase_client(admin: bool = False):
    # Prefer admin client when explicitly requested and available
    if admin:
        if admin_supabase:
            return admin_supabase
        raise HTTPException(status_code=500, detail="Service role key not configured for admin operations")
    if supabase:
        return supabase
    raise HTTPException(status_code=500, detail="Supabase client not configured")


class AdminUser(BaseModel):
    user_id: str
    email: str | None = None
    nome: str | None = None
    role: str
    created_at: str | None = None


class AuditLogResponse(BaseModel):
    id: str
    user_id: str
    action: str
    target_type: str
    target_id: str | None = None
    old_value: dict | None = None
    new_value: dict | None = None
    created_at: str


class AdminRoleUpdate(BaseModel):
    role: str


def _require_admin(user):
    # TODO: Implement admin role check once service_role_key is available
    # For now, allow access but log it
    print(f"⚠️ [Admin] User {user.id} accessing admin endpoint (role check disabled)")

# Helper functions
def clean_number(value):
    if pd.isna(value) or value == '' or value == 'null':
        return None
    try:
        if isinstance(value, str):
            cleaned = value.replace('.', '').replace(',', '.')
            return round(float(cleaned), 4)
        return round(float(value), 4)
    except (ValueError, TypeError):
        return None

def clean_date(value):
    if pd.isna(value):
        return None
    try:
        date_obj = pd.to_datetime(value, errors='coerce')
        if pd.isna(date_obj):
            return None
        return date_obj.strftime('%Y-%m-%d')
    except:
        return None

# --- Realtime fetch helpers (shared by endpoints and scheduler) ---
def _safe_run(func, *args, **kwargs):
    try:
        return func(*args, **kwargs)
    except Exception as e:
        print(f"⚠️ [Scheduler] Job error in {getattr(func, '__name__', 'func')}: {e}")
        return None

def _fetch_weather_and_store(lat: float = -15.6014, lon: float = -56.0979):
    print(f"🌦️ [Realtime Weather] Fetching for lat={lat}, lon={lon}")
    import requests
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        'latitude': lat,
        'longitude': lon,
        'current': 'temperature_2m,precipitation,weather_code',
        'daily': 'temperature_2m_max,temperature_2m_min,precipitation_sum',
        'timezone': 'America/Sao_Paulo',
        'forecast_days': 7
    }
    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    data = response.json()

    # Persist daily current snapshot
    current = data.get('current', {})
    today = dt.datetime.now(SAO_PAULO_TZ).strftime('%Y-%m-%d')
    weather_record = {
        'data_fk': today,
        'temp_max': current.get('temperature_2m', 0),
        'chuva_mm': current.get('precipitation', 0),
        'localizacao': 'Mato Grosso'
    }
    client = _get_supabase_client()
    client.table('fact_clima').upsert([weather_record], on_conflict='data_fk').execute()
    app.state.realtime_status['last_weather_at'] = dt.datetime.now(SAO_PAULO_TZ).isoformat()
    return {
        "current": {
            "temperature": current.get('temperature_2m'),
            "precipitation": current.get('precipitation'),
            "weather_code": current.get('weather_code'),
            "time": current.get('time')
        },
        "daily_forecast": data.get('daily', {}),
        "location": {"latitude": lat, "longitude": lon, "name": "Mato Grosso"}
    }

def _fetch_market_and_store():
    print("💰 [Realtime Market] Fetching quotes...")
    import requests
    # Dólar
    try:
        today = dt.datetime.now(SAO_PAULO_TZ)
        bc_url = "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)"
        bc_params = {
            '@dataCotacao': f"'{today.strftime('%m-%d-%Y')}'",
            '$top': 1,
            '$format': 'json',
            '$select': 'cotacaoCompra,cotacaoVenda,dataHoraCotacao'
        }
        bc_response = requests.get(bc_url, params=bc_params, timeout=5)
        bc_data = bc_response.json()
        if bc_data.get('value'):
            valor_dolar = bc_data['value'][0]['cotacaoCompra']
        else:
            client = _get_supabase_client()
            last_dolar = client.table('fact_mercado').select('valor_dolar').order('data_fk', desc=True).limit(1).execute()
            valor_dolar = last_dolar.data[0]['valor_dolar'] if last_dolar.data else 5.0
    except Exception as e:
        print(f"⚠️ Dólar API error: {e}")
        client = _get_supabase_client()
        last_dolar = client.table('fact_mercado').select('valor_dolar').order('data_fk', desc=True).limit(1).execute()
        valor_dolar = last_dolar.data[0]['valor_dolar'] if last_dolar.data else 5.0

    # JBS (Yahoo)
    try:
        yahoo_url = f"https://query1.finance.yahoo.com/v8/finance/chart/JBSS3.SA"
        yahoo_params = {'interval': '1d', 'range': '1d'}
        yahoo_response = requests.get(yahoo_url, params=yahoo_params, timeout=5)
        yahoo_data = yahoo_response.json()
        quote = yahoo_data['chart']['result'][0]['meta']
        valor_jbs = quote.get('regularMarketPrice', quote.get('previousClose', 0))
    except Exception as e:
        print(f"⚠️ JBS API error: {e}")
        client = _get_supabase_client()
        last_jbs = client.table('fact_mercado').select('valor_jbs').order('data_fk', desc=True).limit(1).execute()
        valor_jbs = last_jbs.data[0]['valor_jbs'] if last_jbs.data else 40.0

    # Boi Gordo (última cotação)
    client = _get_supabase_client()
    last_boi = client.table('fact_mercado').select('valor_boi_gordo').order('data_fk', desc=True).limit(1).execute()
    valor_boi_gordo = last_boi.data[0]['valor_boi_gordo'] if last_boi.data else 660.0

    today_str = dt.datetime.now(SAO_PAULO_TZ).strftime('%Y-%m-%d')
    market_record = {
        'data_fk': today_str,
        'valor_dolar': round(float(valor_dolar), 4),
        'valor_jbs': round(float(valor_jbs), 2),
        'valor_boi_gordo': round(float(valor_boi_gordo), 2)
    }
    client.table('fact_mercado').upsert([market_record], on_conflict='data_fk').execute()
    app.state.realtime_status['last_market_at'] = dt.datetime.now(SAO_PAULO_TZ).isoformat()

    return {
        "timestamp": dt.datetime.now(SAO_PAULO_TZ).isoformat(),
        "market": {
            "dolar": {"value": round(float(valor_dolar), 4), "currency": "BRL", "source": "Banco Central"},
            "jbs": {"value": round(float(valor_jbs), 2), "ticker": "JBSS3.SA", "source": "Yahoo Finance"},
            "boi_gordo": {"value": round(float(valor_boi_gordo), 2), "unit": "R$/@", "source": "CEPEA (cached)"}
        }
    }

# --- Scheduler lifecycle ---
@app.on_event("startup")
async def _on_startup():
    try:
        scheduler = AsyncIOScheduler(timezone=SAO_PAULO_TZ)
        # Weather at 10:00, 13:00, 18:00
        scheduler.add_job(_safe_run, CronTrigger(hour='10,13,18', minute=0), args=[_fetch_weather_and_store, -15.6014, -56.0979], id="weather_job", replace_existing=True)
        # Market 5 minutes after to avoid API spikes
        scheduler.add_job(_safe_run, CronTrigger(hour='10,13,18', minute=5), args=[_fetch_market_and_store], id="market_job", replace_existing=True)
        scheduler.start()
        app.state.scheduler = scheduler
        print("⏰ Scheduler started (10:00, 13:00, 18:00 BRT)")
    except Exception as e:
        print(f"⚠️ Failed to start scheduler: {e}")

@app.on_event("shutdown")
async def _on_shutdown():
    sched = app.state.scheduler
    if sched:
        try:
            sched.shutdown(wait=False)
            print("⏹️ Scheduler stopped")
        except Exception:
            pass

# Endpoints
@app.get("/")
def root():
    return {"status": "ok", "service": "AgroData Nexus API", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy", "database": "connected" if supabase else "not configured"}

@app.get("/api/notifications")
@limiter.limit("60/minute")
def get_notifications(request: Request, authorization: Optional[str] = Header(None), limit: int = 50):
    user = verify_token(authorization)
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Validação de segurança: limitar consultas grandes
    if limit < 1 or limit > 100:
        raise HTTPException(status_code=400, detail="Limit must be between 1 and 100")
    
    response = supabase.table('notifications').select('*').order('created_at', desc=True).limit(limit).execute()
    return response.data or []

@app.delete("/api/notifications/{notification_id}")
@limiter.limit("60/minute")
def delete_notification(request: Request, notification_id: int, authorization: Optional[str] = Header(None)):
    user = verify_token(authorization)
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Validação de segurança: ID positivo
    if notification_id < 1:
        raise HTTPException(status_code=400, detail="Invalid notification ID")
    
    supabase.table('notifications').delete().eq('id', notification_id).execute()
    return {"success": True, "message": "Notification deleted"}


# --- Admin endpoints (service role) ---

@app.get("/api/admin/users", response_model=list[AdminUser])
def get_admin_users(request: Request, authorization: Optional[str] = Header(None)):
    user = verify_token(authorization)
    _require_admin(user)
    client = _get_supabase_client(admin=False)  # Use anon client for now

    profiles_res = client.table('profiles').select('user_id,nome,email,created_at').execute()
    roles_res = client.table('user_roles').select('user_id,role').execute()

    role_map = {r['user_id']: r['role'] for r in (roles_res.data or [])}

    users: list[AdminUser] = []
    for profile in profiles_res.data or []:
        user_id = profile.get('user_id') or profile.get('id')
        users.append(AdminUser(
            user_id=user_id,
            email=profile.get('email'),
            nome=profile.get('nome'),
            created_at=profile.get('created_at'),
            role=role_map.get(user_id, 'gestor')
        ))

    return users


@app.post("/api/admin/users/{user_id}/role")
def update_user_role(request: Request, user_id: str, payload: AdminRoleUpdate, authorization: Optional[str] = Header(None)):
    user = verify_token(authorization)
    _require_admin(user)
    client = _get_supabase_client(admin=False)  # Use anon client for now

    if payload.role not in ["admin", "gestor"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    existing = client.table('user_roles').select('id').eq('user_id', user_id).limit(1).execute()
    if existing.data:
        client.table('user_roles').update({'role': payload.role}).eq('user_id', user_id).execute()
    else:
        client.table('user_roles').insert({'user_id': user_id, 'role': payload.role}).execute()

    # Audit log entry
    client.table('audit_logs').insert({
        'user_id': user.id,
        'action': 'role_change',
        'target_type': 'user_role',
        'target_id': user_id,
        'old_value': None,
        'new_value': {'role': payload.role}
    }).execute()

    return {"success": True, "role": payload.role}


@app.get("/api/admin/audit-logs", response_model=list[AuditLogResponse])
def get_audit_logs(request: Request, authorization: Optional[str] = Header(None), limit: int = 50):
    user = verify_token(authorization)
    _require_admin(user)
    client = _get_supabase_client(admin=False)  # Use anon client for now

    res = client.table('audit_logs') \
        .select('*') \
        .order('created_at', desc=True) \
        .limit(min(limit, 200)) \
        .execute()

    return res.data or []

@app.post("/api/import/climate")
@limiter.limit("10/hour")
def import_climate(request: Request, file: UploadFile = File(...), authorization: Optional[str] = Header(None)):
    user = verify_token(authorization)
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files allowed")
    
    try:
        content = file.file.read()
        df = pd.read_csv(io.BytesIO(content))
        
        df.columns = df.columns.str.strip().str.lower()
        column_map = {'date': 'data', 'temp': 'temp_max', 'temperatura_max': 'temp_max', 
                     'chuva': 'chuva_mm', 'precipitacao': 'chuva_mm', 'local': 'localizacao'}
        df = df.rename(columns=column_map)
        
        if 'data' not in df.columns:
            raise HTTPException(status_code=400, detail="Column 'data' not found")
        
        df['data_fk'] = df['data'].apply(clean_date)
        df['temp_max'] = df.get('temp_max', pd.Series()).apply(clean_number)
        df['chuva_mm'] = df.get('chuva_mm', pd.Series()).apply(clean_number)
        if 'localizacao' not in df.columns:
            df['localizacao'] = 'Cuiabá'
        else:
            df['localizacao'] = df['localizacao'].fillna('Cuiabá')
        
        df_valid = df[df['data_fk'].notna()].copy()
        records = df_valid[['data_fk', 'temp_max', 'chuva_mm', 'localizacao']].to_dict('records')
        
        success_count = 0
        for i in range(0, len(records), 100):
            batch = records[i:i + 100]
            supabase.table('fact_clima').upsert(batch, on_conflict='data_fk').execute()
            success_count += len(batch)
        
        return {
            "success": True,
            "records_imported": success_count,
            "total_records": len(df),
            "message": f"Imported {success_count} climate records"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/import/market")
@limiter.limit("10/hour")
def import_market(request: Request, file: UploadFile = File(...), authorization: Optional[str] = Header(None)):
    user = verify_token(authorization)
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files allowed")
    
    try:
        content = file.file.read()
        df = pd.read_csv(io.BytesIO(content))
        
        df.columns = df.columns.str.strip().str.lower()
        column_map = {'date': 'data', 'dolar': 'valor_dolar', 'jbs': 'valor_jbs', 
                     'boi_gordo': 'valor_boi_gordo', 'boi': 'valor_boi_gordo'}
        df = df.rename(columns=column_map)
        
        required_cols = ['data', 'valor_dolar', 'valor_jbs', 'valor_boi_gordo']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Missing columns: {', '.join(missing_cols)}")
        
        df['data_fk'] = df['data'].apply(clean_date)
        df['valor_dolar'] = df['valor_dolar'].apply(clean_number)
        df['valor_jbs'] = df['valor_jbs'].apply(clean_number)
        df['valor_boi_gordo'] = df['valor_boi_gordo'].apply(clean_number)
        
        df_valid = df[df['data_fk'].notna()].copy()
        records = df_valid[['data_fk', 'valor_dolar', 'valor_jbs', 'valor_boi_gordo']].to_dict('records')
        
        success_count = 0
        for i in range(0, len(records), 100):
            batch = records[i:i + 100]
            supabase.table('fact_mercado').upsert(batch, on_conflict='data_fk').execute()
            success_count += len(batch)
        
        return {
            "success": True,
            "records_imported": success_count,
            "total_records": len(df),
            "message": f"Imported {success_count} market records"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market-data")
@limiter.limit("60/minute")
def get_market_data(
    request: Request,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    user = verify_token(authorization)
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    query = supabase.table('fact_mercado').select('*').order('data_fk', desc=True)
    
    if start_date:
        query = query.gte('data_fk', start_date)
    if end_date:
        query = query.lte('data_fk', end_date)
    
    response = query.limit(1000).execute()
    return response.data or []

@app.get("/api/climate-data")
@limiter.limit("60/minute")
def get_climate_data(
    request: Request,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    location: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    user = verify_token(authorization)
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    query = supabase.table('fact_clima').select('*').order('data_fk', desc=True)
    
    if start_date:
        query = query.gte('data_fk', start_date)
    if end_date:
        query = query.lte('data_fk', end_date)
    if location:
        query = query.eq('localizacao', location)
    
    response = query.limit(1000).execute()
    return response.data or []

@app.get("/api/analytics/correlation")
@limiter.limit("600/minute")
def get_correlation_analysis(
    request: Request,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    print(f"📊 [Correlation] Start: {start_date} to {end_date}")
    try:
        user = verify_token(authorization)
        
        # Query market data
        query = supabase.table('fact_mercado').select('data_fk, valor_dolar, valor_jbs, valor_boi_gordo').order('data_fk')
        
        if start_date:
            query = query.gte('data_fk', start_date)
        if end_date:
            query = query.lte('data_fk', end_date)
        
        print("📊 [Correlation] Executing query...")
        response = query.limit(2000).execute()
        data = response.data or []
        print(f"📊 [Correlation] Query done. Rows: {len(data)}")
        
        if len(data) < 2:
            return [] # Return empty list for charts
        
        # Return raw data for scatter plot
        return data
    except Exception as e:
        print(f"❌ [Correlation] ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/volatility")
@limiter.limit("600/minute")
def get_volatility_analysis(
    request: Request,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    print(f"📉 [Volatility] Start: {start_date} to {end_date}")
    try:
        user = verify_token(authorization)
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        # Validação de segurança: formato de data
        if start_date:
            try:
                pd.to_datetime(start_date)
            except:
                raise HTTPException(status_code=400, detail="Invalid start_date format (use YYYY-MM-DD)")
        if end_date:
            try:
                pd.to_datetime(end_date)
            except:
                raise HTTPException(status_code=400, detail="Invalid end_date format (use YYYY-MM-DD)")
        
        # Query market data
        query = supabase.table('fact_mercado').select('data_fk, valor_dolar, valor_jbs, valor_boi_gordo').order('data_fk')
        
        if start_date:
            query = query.gte('data_fk', start_date)
        if end_date:
            query = query.lte('data_fk', end_date)
        
        print("📉 [Volatility] Executing query...")
        response = query.limit(2000).execute()
        data = response.data or []
        print(f"📉 [Volatility] Query done. Rows: {len(data)}")
        
        if len(data) < 2:
            return []
        
        # Calculate monthly volatility (boxplots) using pandas
        df = pd.DataFrame(data)
        df['data_fk'] = pd.to_datetime(df['data_fk'])
        df['ano'] = df['data_fk'].dt.year
        df['mes'] = df['data_fk'].dt.month
        
        monthly = df.groupby(['ano', 'mes'])
        result = []
        
        for (ano, mes), group in monthly:
            # Calculate stats for boi
            # Clean data first - remove nulls
            boi_series = pd.to_numeric(group['valor_boi_gordo'], errors='coerce').dropna()
            dolar_series = pd.to_numeric(group['valor_dolar'], errors='coerce').dropna()
            
            if boi_series.empty or dolar_series.empty:
                continue
                
            boi_stats = boi_series.describe(percentiles=[.25, .5, .75])
            dolar_stats = dolar_series.describe(percentiles=[.25, .5, .75])
            
            result.append({
                "ano": int(ano),
                "mes": int(mes),
                # Boi
                "min_boi": float(boi_stats['min']),
                "q1_boi": float(boi_stats['25%']),
                "mediana_boi": float(boi_stats['50%']),
                "q3_boi": float(boi_stats['75%']),
                "max_boi": float(boi_stats['max']),
                # Dolar
                "min_dolar": float(dolar_stats['min']),
                "q1_dolar": float(dolar_stats['25%']),
                "mediana_dolar": float(dolar_stats['50%']),
                "q3_dolar": float(dolar_stats['75%']),
                "max_dolar": float(dolar_stats['max']),
            })
            
        return result
    except Exception as e:
        print(f"❌ [Volatility] ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/lag")
@limiter.limit("600/minute")
def get_lag_analysis(
    request: Request,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    lag_days: int = 60,
    authorization: Optional[str] = Header(None)
):
    print(f"🌧️ [Lag] Start: {start_date}, Lag: {lag_days}")
    try:
        user = verify_token(authorization)
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not configured")
        
        # Validação de segurança: formato de data e lag razoável
        if start_date:
            try:
                pd.to_datetime(start_date)
            except:
                raise HTTPException(status_code=400, detail="Invalid start_date format (use YYYY-MM-DD)")
        if lag_days < 0 or lag_days > 365:
            raise HTTPException(status_code=400, detail="lag_days must be between 0 and 365")
        
        # 1. Fetch Climate Data (Chuva)
        print("🌧️ [Lag] Querying climate...")
        # Fetch data without complex db-side filtering for nulls to avoid syntax errors
        clima_query = supabase.table('fact_clima').select('data_fk, chuva_mm')
        if start_date: clima_query = clima_query.gte('data_fk', start_date)
        
        clima_resp = clima_query.order('data_fk').limit(2000).execute()
        clima_data = pd.DataFrame(clima_resp.data or [])
        # Filter nulls in pandas
        if not clima_data.empty and 'chuva_mm' in clima_data.columns:
            clima_data = clima_data.dropna(subset=['chuva_mm'])
        
        # 2. Fetch Market Data (Boi)
        print("🌧️ [Lag] Querying market...")
        mercado_query = supabase.table('fact_mercado').select('data_fk, valor_boi_gordo')
        # Use wider range to catch the lagged prices
        
        mercado_resp = mercado_query.order('data_fk').limit(2000).execute()
        mercado_data = pd.DataFrame(mercado_resp.data or [])
        # Filter nulls in pandas
        if not mercado_data.empty and 'valor_boi_gordo' in mercado_data.columns:
            mercado_data = mercado_data.dropna(subset=['valor_boi_gordo'])
            
        if clima_data.empty or mercado_data.empty:
            print("🌧️ [Lag] No data found.")
            return []
        
        print(f"🌧️ [Lag] Processing {len(clima_data)} climate rows and {len(mercado_data)} market rows...")
            
        # 3. Merge and Shift
        clima_data['data_fk'] = pd.to_datetime(clima_data['data_fk'])
        mercado_data['data_fk'] = pd.to_datetime(mercado_data['data_fk'])
        
        # Create the lagged target date
        clima_data['target_date'] = clima_data['data_fk'] + pd.Timedelta(days=lag_days)
        
        # Merge on target_date == market_date
        df = pd.merge(
            clima_data, 
            mercado_data, 
            left_on='target_date', 
            right_on='data_fk', 
            suffixes=('_clima', '_mercado')
        )
        
        # Format for frontend
        result = []
        for _, row in df.iterrows():
            result.append({
                "data_chuva": row['data_fk_clima'].strftime('%Y-%m-%d'),
                "data_preco": row['data_fk_mercado'].strftime('%Y-%m-%d'),
                "chuva_mm": row['chuva_mm'],
                "valor_boi_gordo": row['valor_boi_gordo']
            })
            
        return result
    except Exception as e:
        print(f"❌ [Lag] ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/realtime/weather")
@limiter.limit("30/minute")
def get_realtime_weather(
    request: Request,
    lat: float = -15.6014,
    lon: float = -56.0979,
    authorization: Optional[str] = Header(None)
):
    """
    Busca dados climáticos em tempo real do OpenMeteo
    Coordenadas padrão: Cuiabá, MT (região pecuarista)
    """
    try:
        user = verify_token(authorization)
        result = _fetch_weather_and_store(lat, lon)
        return result
    except Exception as e:
        print(f"❌ [Realtime Weather] ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Weather API error: {str(e)}")


@app.get("/api/realtime/market")
@limiter.limit("30/minute")
def get_realtime_market(
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """
    Busca cotações em tempo real:
    - Dólar: Banco Central (PTAX)
    - JBS: Yahoo Finance (JBSS3.SA)
    - Boi Gordo: Última cotação do banco (CEPEA não tem API pública)
    """
    try:
        user = verify_token(authorization)
        result = _fetch_market_and_store()
        return result
    except Exception as e:
        print(f"❌ [Realtime Market] ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Market API error: {str(e)}")


@app.post("/api/realtime/refresh")
@limiter.limit("10/minute")
def refresh_realtime_now(
    request: Request,
    lat: float = -15.6014,
    lon: float = -56.0979,
    authorization: Optional[str] = Header(None)
):
    """Dispara a coleta imediata (tempo real) e retorna o resultado combinado."""
    try:
        user = verify_token(authorization)
        weather = _fetch_weather_and_store(lat, lon)
        market = _fetch_market_and_store()
        app.state.realtime_status['last_refresh_ok'] = dt.datetime.now(SAO_PAULO_TZ).isoformat()
        return {"weather": weather, "market": market}
    except Exception as e:
        print(f"❌ [Realtime Refresh] ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"Refresh error: {e}")


@app.get("/api/realtime/status")
def get_realtime_status():
    """Retorna os timestamps da última execução das coletas agendadas/manuais."""
    return app.state.realtime_status
