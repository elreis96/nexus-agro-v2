import os
import io
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from typing import Optional
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Load environment variables
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Supabase client
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# Create FastAPI app
app = FastAPI(title="AgroData Nexus API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT Authentication
def verify_token(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    try:
        token = authorization.replace("Bearer ", "")
        # Validate with Supabase
        response = supabase.auth.get_user(token)
        if not response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return response.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

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
    
    response = supabase.table('notifications').select('*').order('created_at', desc=True).limit(limit).execute()
    return response.data or []

@app.delete("/api/notifications/{notification_id}")
@limiter.limit("60/minute")
def delete_notification(request: Request, notification_id: int, authorization: Optional[str] = Header(None)):
    user = verify_token(authorization)
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    supabase.table('notifications').delete().eq('id', notification_id).execute()
    return {"success": True, "message": "Notification deleted"}

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
@limiter.limit("60/minute")
def get_correlation_analysis(
    request: Request,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    print(f"📊 [Correlation] Start: {start_date} to {end_date}")
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

@app.get("/api/analytics/volatility")
@limiter.limit("60/minute")
def get_volatility_analysis(
    request: Request,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    print(f"📉 [Volatility] Start: {start_date} to {end_date}")
    user = verify_token(authorization)
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
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
        "data_points": len(data),
        "period": {"start": data[0]['data_fk'], "end": data[-1]['data_fk']}
    }

@app.get("/api/analytics/lag")
@limiter.limit("60/minute")
def get_lag_analysis(
    request: Request,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    lag_days: int = 60,
    authorization: Optional[str] = Header(None)
):
    print(f"🌧️ [Lag] Start: {start_date}, Lag: {lag_days}")
    user = verify_token(authorization)
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # 1. Fetch Climate Data (Chuva)
    print("🌧️ [Lag] Querying climate...")
    clima_query = supabase.table('fact_clima').select('data_fk, chuva_mm').extension('not.is', 'chuva_mm', 'null')
    if start_date: clima_query = clima_query.gte('data_fk', start_date)
    # We need extra data at the end for the lag, but simplifying for now
    
    clima_resp = clima_query.order('data_fk').limit(2000).execute()
    clima_data = pd.DataFrame(clima_resp.data or [])
    
    # 2. Fetch Market Data (Boi)
    print("🌧️ [Lag] Querying market...")
    mercado_query = supabase.table('fact_mercado').select('data_fk, valor_boi_gordo').extension('not.is', 'valor_boi_gordo', 'null')
    # Use wider range to catch the lagged prices
    
    mercado_resp = mercado_query.order('data_fk').limit(2000).execute()
    mercado_data = pd.DataFrame(mercado_resp.data or [])
    
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
