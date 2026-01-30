import os
import time
from typing import Dict, List, Optional
from collections import defaultdict
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta

import pandas as pd
from supabase import Client, create_client

# ✅ Import security utilities (validators only)
from .lib.security import (
    sanitize_string,
    validate_email,
    validate_date_format,
    validate_numeric_range,
    validate_password_strength,
    validate_auth_payload,
    validate_user_update_payload
)

app = FastAPI(
    title="AgroData Nexus API",
    version="1.0.0",
    docs_url="/api/docs" if os.getenv("ENVIRONMENT") != "production" else None,
    redoc_url="/api/redoc" if os.getenv("ENVIRONMENT") != "production" else None,
)

# ✅ CORS configuration - allow wildcard for initial connectivity tests
# Set ALLOWED_ORIGINS="*" (default) to enable all origins; override with comma list in production.
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "*")

if allowed_origins_str.strip() == "*":
    origins = ["*"]
else:
    # Parse comma-separated origins and strip whitespace
    origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]

# ✅ Log CORS configuration for debugging
print(f"✅ CORS Allowed Origins: {origins}")
print(f"✅ Environment: {os.getenv('ENVIRONMENT', 'development')}")

# ✅ Validate Supabase configuration (credentials NOT logged for security)
supabase_url = os.getenv("SUPABASE_URL")
supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")
supabase_key = supabase_service_key or supabase_anon_key

print("=" * 60)
print("🔍 SUPABASE CONFIGURATION CHECK")
print("=" * 60)
print(f"SUPABASE_URL: {'✅ Set' if supabase_url else '❌ NOT SET'}")
print(f"SUPABASE_SERVICE_ROLE_KEY: {'✅ Set' if supabase_service_key else '❌ NOT SET'}")
print(f"SUPABASE_ANON_KEY: {'✅ Set' if supabase_anon_key else '❌ NOT SET'}")
print(f"Using key: {'SERVICE_ROLE' if supabase_service_key else 'ANON' if supabase_anon_key else 'NONE'}")
print("=" * 60)

if not supabase_url:
    print("⚠️ WARNING: SUPABASE_URL not configured")
if not supabase_key:
    print("⚠️ WARNING: SUPABASE key not configured (SERVICE_ROLE or ANON)")

supabase: Optional[Client] = None
if supabase_url and supabase_key:
    try:
        print(f"🔄 Initializing Supabase client...")
        supabase = create_client(supabase_url, supabase_key)
        print("✅ Supabase client initialized successfully")
        # Test connection
        try:
            test_result = supabase.table("fact_mercado").select("count", count="exact").limit(1).execute()
            print(f"✅ Supabase connection test: OK (found {test_result.count if hasattr(test_result, 'count') else 'N/A'} records)")
        except Exception as test_e:
            print(f"⚠️ Supabase connection test failed: {test_e}")
    except Exception as e:
        print(f"❌ Failed to init Supabase client: {e}")
        import traceback
        traceback.print_exc()
        supabase = None
else:
    print("❌ Cannot initialize Supabase: missing URL or key")

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
    
    # Add basic security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    
    return response


# ============ Helpers ============
def ensure_supabase() -> Client:
    if not supabase:
        print("❌ ensure_supabase() called but supabase client is None")
        print(f"   SUPABASE_URL configured: {bool(os.getenv('SUPABASE_URL'))}")
        print(f"   SUPABASE_SERVICE_ROLE_KEY configured: {bool(os.getenv('SUPABASE_SERVICE_ROLE_KEY'))}")
        print(f"   SUPABASE_ANON_KEY configured: {bool(os.getenv('SUPABASE_ANON_KEY'))}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Supabase not configured")
    return supabase


def parse_date(value: Optional[str], field: str) -> Optional[datetime]:
    if not value:
        return None
    
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid {field}")


def get_user_from_request(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.lower().startswith("bearer "):
        print("⚠️ Missing or invalid authorization header")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization header")

    token = auth_header.split(" ", 1)[1]
    if not token:
        print("⚠️ Empty token in authorization header")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    client = ensure_supabase()
    try:
        result = client.auth.get_user(token)
    except Exception as e:
        print(f"⚠️ Error validating token: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    if not result or not result.user:
        print("⚠️ Token validation returned no user")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    return result.user


def get_user_from_request_optional(request: Request):
    """
    Same as get_user_from_request, but returns None instead of raising when
    the Authorization header is missing/invalid. Useful for endpoints where
    we prefer a graceful fallback over a 401 that would crash the UI.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.lower().startswith("bearer "):
        return None

    token = auth_header.split(" ", 1)[1]
    if not token:
        return None

    client = ensure_supabase()
    try:
        result = client.auth.get_user(token)
    except Exception as e:
        print(f"⚠️ Error validating token (optional): {e}")
        return None

    if not result or not result.user:
        return None

    return result.user


def fetch_fact_mercado(start: Optional[datetime], end: Optional[datetime]) -> List[Dict]:
    try:
        print(f"📊 fetch_fact_mercado called - start: {start}, end: {end}")
        client = ensure_supabase()
        print(f"✅ Supabase client obtained, querying fact_mercado...")
        query = client.table("fact_mercado").select("data_fk, valor_dolar, valor_jbs, valor_boi_gordo").order("data_fk")
        if start:
            query = query.gte("data_fk", start.date().isoformat())
            print(f"   Filter: data_fk >= {start.date().isoformat()}")
        if end:
            query = query.lte("data_fk", end.date().isoformat())
            print(f"   Filter: data_fk <= {end.date().isoformat()}")
        print(f"🔄 Executing Supabase query...")
        resp = query.execute()
        print(f"✅ Query executed, received {len(resp.data) if resp.data else 0} records")
        return resp.data or []
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching fact_mercado: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching market data: {str(e)}"
        )


def fetch_fact_clima(start: Optional[datetime], end: Optional[datetime]) -> List[Dict]:
    try:
        print(f"🌧️ fetch_fact_clima called - start: {start}, end: {end}")
        client = ensure_supabase()
        print(f"✅ Supabase client obtained, querying fact_clima...")
        query = client.table("fact_clima").select("data_fk, chuva_mm, temp_max").order("data_fk")
        if start:
            query = query.gte("data_fk", start.date().isoformat())
            print(f"   Filter: data_fk >= {start.date().isoformat()}")
        if end:
            query = query.lte("data_fk", end.date().isoformat())
            print(f"   Filter: data_fk <= {end.date().isoformat()}")
        print(f"🔄 Executing Supabase query...")
        resp = query.execute()
        print(f"✅ Query executed, received {len(resp.data) if resp.data else 0} records")
        return resp.data or []
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching fact_clima: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching climate data: {str(e)}"
        )


def build_dataframe(records: List[Dict]) -> pd.DataFrame:
    if not records:
        return pd.DataFrame()
    try:
        df = pd.DataFrame(records)
        if "data_fk" in df.columns:
            df["data_fk"] = pd.to_datetime(df["data_fk"], errors="coerce")
        return df
    except Exception as e:
        print(f"❌ Error building dataframe: {e}", exc_info=True)
        return pd.DataFrame()

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
    supabase_status = "not_configured"
    supabase_error = None
    supabase_test_result = None
    
    if supabase and supabase_url and supabase_key:
        try:
            # Test Supabase connection with simple query
            print("🔄 Testing Supabase connection in health check...")
            result = supabase.table("fact_mercado").select("count", count="exact").limit(1).execute()
            supabase_status = "connected"
            supabase_test_result = {
                "count": result.count if hasattr(result, 'count') else None,
                "has_data": bool(result.data) if hasattr(result, 'data') else None
            }
            print(f"✅ Supabase health check: OK")
        except Exception as e:
            print(f"⚠️ Supabase health check failed: {e}", exc_info=True)
            supabase_status = "error"
            supabase_error = str(e)
    else:
        supabase_error = "Supabase client not initialized"
        if not supabase_url:
            supabase_error += " - SUPABASE_URL missing"
        if not supabase_key:
            supabase_error += " - SUPABASE key missing"
    
    return {
        "status": "online",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "supabase_configured": bool(supabase_url and supabase_key),
        "supabase_initialized": bool(supabase),
        "supabase_status": supabase_status,
        "supabase_error": supabase_error,
        "supabase_test": supabase_test_result,
        "supabase_url_set": bool(supabase_url),
        "supabase_key_set": bool(supabase_key),
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


# ============ Data Endpoints ============
@app.get("/api/market-data")
async def get_market_data(request: Request, start_date: Optional[str] = None, end_date: Optional[str] = None):
    get_user_from_request(request)
    start = parse_date(start_date, "start_date")
    end = parse_date(end_date, "end_date")

    records = fetch_fact_mercado(start, end)
    return records


@app.get("/api/climate-data")
async def get_climate_data(request: Request, start_date: Optional[str] = None, end_date: Optional[str] = None):
    get_user_from_request(request)
    start = parse_date(start_date, "start_date")
    end = parse_date(end_date, "end_date")

    records = fetch_fact_clima(start, end)
    return records


@app.get("/api/analytics/correlation")
async def correlation_analysis(request: Request, start_date: Optional[str] = None, end_date: Optional[str] = None):
    try:
        print(f"🔍 /api/analytics/correlation called - start_date: {start_date}, end_date: {end_date}")
        get_user_from_request(request)
        start = parse_date(start_date, "start_date")
        end = parse_date(end_date, "end_date")

        print(f"📊 Fetching market data for correlation analysis...")
        records = fetch_fact_mercado(start, end)
        df = build_dataframe(records)

        if df.empty:
            return {"correlation_matrix": {}, "data_points": 0, "data": []}

        # Validate required columns exist
        required_cols = ["valor_dolar", "valor_jbs", "valor_boi_gordo"]
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            print(f"⚠️ Missing columns in correlation analysis: {missing_cols}")
            return {"correlation_matrix": {}, "data_points": 0, "data": [], "error": f"Missing columns: {missing_cols}"}

        # Filter out rows with missing values for correlation
        df_clean = df[required_cols].dropna()
        if df_clean.empty:
            return {"correlation_matrix": {}, "data_points": 0, "data": []}

        corr_matrix = df_clean.corr().round(4)
        df["ano"] = df["data_fk"].dt.year
        df["mes"] = df["data_fk"].dt.month
        df["data_fk"] = df["data_fk"].dt.strftime("%Y-%m-%d")

        return {
            "correlation_matrix": corr_matrix.to_dict(),
            "data_points": len(df),
            "data": df[["data_fk", "ano", "mes", "valor_dolar", "valor_jbs", "valor_boi_gordo"]].to_dict(orient="records"),
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in correlation_analysis: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing correlation analysis: {str(e)}"
        )


@app.get("/api/analytics/volatility")
async def volatility_analysis(request: Request, start_date: Optional[str] = None, end_date: Optional[str] = None):
    try:
        print(f"🔍 /api/analytics/volatility called - start_date: {start_date}, end_date: {end_date}")
        get_user_from_request(request)
        start = parse_date(start_date, "start_date")
        end = parse_date(end_date, "end_date")

        print(f"📊 Fetching market data for volatility analysis...")
        records = fetch_fact_mercado(start, end)
        df = build_dataframe(records)

        if df.empty:
            return []

        # Validate required columns exist
        required_cols = ["valor_boi_gordo", "valor_dolar"]
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            print(f"⚠️ Missing columns in volatility analysis: {missing_cols}")
            return []

        df["ano"] = df["data_fk"].dt.year
        df["mes"] = df["data_fk"].dt.month

        def percentile(series: pd.Series, q: float) -> float:
            if series.empty:
                return 0.0
            try:
                return float(series.quantile(q))
            except Exception:
                return 0.0

        def safe_float(value) -> float:
            try:
                if pd.isna(value):
                    return 0.0
                return float(value)
            except (ValueError, TypeError):
                return 0.0

        grouped = df.groupby(["ano", "mes"])
        results: List[Dict] = []
        for (ano, mes), group in grouped:
            boi_series = group["valor_boi_gordo"].dropna()
            dolar_series = group["valor_dolar"].dropna()
            
            results.append(
                {
                    "ano": int(ano),
                    "mes": int(mes),
                    "min_boi": safe_float(boi_series.min()) if not boi_series.empty else 0.0,
                    "q1_boi": percentile(boi_series, 0.25),
                    "mediana_boi": percentile(boi_series, 0.50),
                    "q3_boi": percentile(boi_series, 0.75),
                    "max_boi": safe_float(boi_series.max()) if not boi_series.empty else 0.0,
                    "min_dolar": safe_float(dolar_series.min()) if not dolar_series.empty else 0.0,
                    "q1_dolar": percentile(dolar_series, 0.25),
                    "mediana_dolar": percentile(dolar_series, 0.50),
                    "q3_dolar": percentile(dolar_series, 0.75),
                    "max_dolar": safe_float(dolar_series.max()) if not dolar_series.empty else 0.0,
                }
            )

        return results
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in volatility_analysis: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing volatility analysis: {str(e)}"
        )


@app.get("/api/analytics/lag")
async def lag_analysis(request: Request, start_date: Optional[str] = None, end_date: Optional[str] = None, lag_days: int = 60):
    try:
        print(f"🔍 /api/analytics/lag called - start_date: {start_date}, end_date: {end_date}, lag_days: {lag_days}")
        get_user_from_request(request)
        
        # Simple bounds check for lag_days
        if lag_days < 1 or lag_days > 365:
            lag_days = 60
        
        start = parse_date(start_date, "start_date")
        end = parse_date(end_date, "end_date")

        # Prefer view_lag_chuva_60d_boi if available for server-side lag
        print(f"📊 Getting Supabase client for lag analysis...")
        client = ensure_supabase()
        
        # If lag_days different from 60, compute client-side using raw data
        if lag_days != 60:
            mercado_records = fetch_fact_mercado(start, end)
            clima_records = fetch_fact_clima(None, None)  # need earlier dates for lag lookup
            mercado_df = build_dataframe(mercado_records)
            clima_df = build_dataframe(clima_records)
            if mercado_df.empty:
                return []
            
            if "valor_boi_gordo" not in mercado_df.columns:
                print("⚠️ Missing valor_boi_gordo column in lag analysis")
                return []
            
            clima_lookup = clima_df.set_index("data_fk")["chuva_mm"] if not clima_df.empty and "chuva_mm" in clima_df.columns else None

            mercado_df["data_preco"] = mercado_df["data_fk"]
            mercado_df["data_chuva_original"] = mercado_df["data_fk"] - pd.to_timedelta(lag_days, unit="D")
            if clima_lookup is not None:
                mercado_df["chuva_mm_lag"] = mercado_df["data_chuva_original"].map(clima_lookup)
            else:
                mercado_df["chuva_mm_lag"] = None

            mercado_df["ano_preco"] = mercado_df["data_preco"].dt.year
            mercado_df["mes_preco"] = mercado_df["data_preco"].dt.month
            mercado_df["data_preco"] = mercado_df["data_preco"].dt.strftime("%Y-%m-%d")
            mercado_df["data_chuva_original"] = mercado_df["data_chuva_original"].dt.strftime("%Y-%m-%d")
            
            def safe_float(value):
                try:
                    if pd.isna(value):
                        return None
                    return float(value)
                except (ValueError, TypeError):
                    return None
            
            return [
                {
                    "data_preco": str(row["data_preco"]),
                    "ano_preco": int(row["ano_preco"]),
                    "mes_preco": int(row["mes_preco"]),
                    "valor_boi_gordo": safe_float(row["valor_boi_gordo"]),
                    "chuva_mm": safe_float(row["chuva_mm_lag"]),
                    "data_chuva_original": str(row["data_chuva_original"]),
                }
                for _, row in mercado_df.iterrows()
            ]

        # Use view for lag_days == 60
        try:
            print(f"📊 Querying view_lag_chuva_60d_boi...")
            query = client.table("view_lag_chuva_60d_boi").select(
                "data_preco, ano_preco, mes_preco, valor_boi_gordo, chuva_mm_lag_60d, data_chuva_original"
            ).order("data_preco")
            if start:
                query = query.gte("data_preco", start.date().isoformat())
                print(f"   Filter: data_preco >= {start.date().isoformat()}")
            if end:
                query = query.lte("data_preco", end.date().isoformat())
                print(f"   Filter: data_preco <= {end.date().isoformat()}")
            print(f"🔄 Executing Supabase query on view...")
            resp = query.execute()
            print(f"✅ View query executed, received {len(resp.data) if resp.data else 0} records")
            records = resp.data or []
        except Exception as e:
            print(f"⚠️ Error querying view_lag_chuva_60d_boi: {e}, falling back to raw data", exc_info=True)
            # Fallback to raw data computation
            mercado_records = fetch_fact_mercado(start, end)
            clima_records = fetch_fact_clima(None, None)
            mercado_df = build_dataframe(mercado_records)
            clima_df = build_dataframe(clima_records)
            if mercado_df.empty:
                return []
            
            clima_lookup = clima_df.set_index("data_fk")["chuva_mm"] if not clima_df.empty and "chuva_mm" in clima_df.columns else None
            mercado_df["data_preco"] = mercado_df["data_fk"]
            mercado_df["data_chuva_original"] = mercado_df["data_fk"] - pd.to_timedelta(60, unit="D")
            if clima_lookup is not None:
                mercado_df["chuva_mm_lag"] = mercado_df["data_chuva_original"].map(clima_lookup)
            else:
                mercado_df["chuva_mm_lag"] = None
            
            mercado_df["ano_preco"] = mercado_df["data_preco"].dt.year
            mercado_df["mes_preco"] = mercado_df["data_preco"].dt.month
            mercado_df["data_preco"] = mercado_df["data_preco"].dt.strftime("%Y-%m-%d")
            mercado_df["data_chuva_original"] = mercado_df["data_chuva_original"].dt.strftime("%Y-%m-%d")
            
            def safe_float(value):
                try:
                    if pd.isna(value):
                        return None
                    return float(value)
                except (ValueError, TypeError):
                    return None
            
            return [
                {
                    "data_preco": str(row["data_preco"]),
                    "ano_preco": int(row["ano_preco"]),
                    "mes_preco": int(row["mes_preco"]),
                    "valor_boi_gordo": safe_float(row["valor_boi_gordo"]),
                    "chuva_mm": safe_float(row["chuva_mm_lag"]),
                    "data_chuva_original": str(row["data_chuva_original"]),
                }
                for _, row in mercado_df.iterrows()
            ]

        def safe_float(value):
            try:
                if value is None or (isinstance(value, float) and pd.isna(value)):
                    return None
                return float(value)
            except (ValueError, TypeError):
                return None

        return [
            {
                "data_preco": rec.get("data_preco", ""),
                "ano_preco": int(rec.get("ano_preco", 0)),
                "mes_preco": int(rec.get("mes_preco", 0)),
                "valor_boi_gordo": safe_float(rec.get("valor_boi_gordo")),
                "chuva_mm": safe_float(rec.get("chuva_mm_lag_60d")),
                "data_chuva_original": rec.get("data_chuva_original", ""),
            }
            for rec in records
        ]
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in lag_analysis: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing lag analysis: {str(e)}"
        )


# ============ Import Endpoints ============
@app.post("/api/import/climate")
async def import_climate(request: Request):
    get_user_from_request(request)
    return {
        "success": True,
        "records_imported": 0,
        "records_failed": 0,
        "total_records": 0,
        "errors": [],
        "message": "Climate import endpoint - data should be loaded via Supabase migrations"
    }


@app.post("/api/import/market")
async def import_market(request: Request):
    get_user_from_request(request)
    return {
        "success": True,
        "records_imported": 0,
        "records_failed": 0,
        "total_records": 0,
        "errors": [],
        "message": "Market import endpoint - data should be loaded via Supabase migrations"
    }


# ============ Authentication Validation Endpoints ============
# These endpoints validate password policies on the backend
# The actual authentication is handled by Supabase Auth (server-side)
# Password validation now uses lib/security.py for stronger security

@app.post("/api/auth/validate-password")
async def validate_password_endpoint(request: Request):
    """
    Validate password strength on the backend.
    This endpoint should be called BEFORE sending password to Supabase.
    """
    try:
        data = await request.json()
        password = data.get("password", "")
        
        # Usar validação de segurança
        try:
            validate_password_strength(password)
            return {"valid": True, "error": None}
        except HTTPException as e:
            return {"valid": False, "error": e.detail}
    except Exception as e:
        print(f"❌ Error validating password: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error validating password: {str(e)}"
        )

@app.post("/api/auth/validate-signup")
async def validate_signup_endpoint(request: Request):
    """
    Validate signup data on the backend before sending to Supabase.
    This ensures all validation happens server-side.
    """
    try:
        data = await request.json()
        
        errors = {}
        
        # Validar email
        email = data.get("email", "")
        try:
            email = validate_email(email)
        except HTTPException as e:
            errors["email"] = e.detail
        
        # Validar senha
        password = data.get("password", "")
        try:
            validate_password_strength(password)
        except HTTPException as e:
            errors["password"] = e.detail
        
        # Validar nome (opcional)
        nome = sanitize_string(data.get("nome", "").strip(), max_length=255)
        if nome and len(nome) < 2:
            errors["nome"] = "Nome deve ter pelo menos 2 caracteres"
        
        return {
            "valid": len(errors) == 0,
            "errors": errors if errors else None
        }
    except Exception as e:
        print(f"❌ Error validating signup: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error validating signup: {str(e)}"
        )
        
        # Validate password
        is_valid, error_message = validate_password_strength(password)
        if not is_valid:
            errors["password"] = error_message
        
        # Validate nome (optional)
        if nome and len(nome) > 100:
            errors["nome"] = "Nome muito longo (máximo 100 caracteres)"
        
        if errors:
            return {
                "valid": False,
                "errors": errors
            }
        
        return {
            "valid": True,
            "errors": {}
        }
    except Exception as e:
        print(f"❌ Error validating signup: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error validating signup: {str(e)}"
        )


# ============ Admin Endpoints ============
@app.get("/api/admin/users")
async def get_admin_users(request: Request):
    print("🔍 /api/admin/users called")
    user = get_user_from_request_optional(request)
    if not user:
        print("⚠️ No user authenticated, returning empty list")
        # Fallback: return empty list instead of 401 to avoid UI crash
        return []
    
    print(f"✅ User authenticated: {user.email}")
    
    try:
        client = ensure_supabase()
        
        # Fetch all profiles
        print("📊 Fetching profiles from Supabase...")
        profiles_resp = client.table("profiles").select("*").execute()
        print(f"📊 Profiles response: {len(profiles_resp.data or [])} records")
        profiles = {p["user_id"]: p for p in (profiles_resp.data or [])}
        
        # Fetch all user_roles
        print("📊 Fetching user_roles from Supabase...")
        roles_resp = client.table("user_roles").select("*").execute()
        print(f"📊 Roles response: {len(roles_resp.data or [])} records")
        roles_map = {r["user_id"]: r["role"] for r in (roles_resp.data or [])}
        
        # Combine
        result = []
        for user_id, profile in profiles.items():
            result.append({
                "user_id": user_id,
                "email": profile.get("email"),
                "nome": profile.get("nome"),
                "role": roles_map.get(user_id, "gestor"),
                "created_at": profile.get("created_at")
            })
        
        print(f"✅ Returning {len(result)} users")
        return result
    except Exception as e:
        print(f"❌ Error fetching admin users: {e}")
        import traceback
        traceback.print_exc()
        return []


@app.get("/api/admin/audit-logs")
async def get_admin_audit_logs(request: Request, limit: int = 100):
    user = get_user_from_request_optional(request)
    if not user:
        return []
    
    try:
        # Simple bounds check for limit
        if limit < 1 or limit > 1000:
            limit = 100
        
        client = ensure_supabase()
        resp = client.table("audit_logs").select("*").order("created_at", desc=True).limit(limit).execute()
        return resp.data or []
    except Exception as e:
        print(f"❌ Error fetching audit logs: {e}")
        import traceback
        traceback.print_exc()
        return []


@app.put("/api/admin/users/{user_id}/role")
async def update_user_role(request: Request, user_id: str, role: str):
    user = get_user_from_request_optional(request)
    if not user:
        return {"success": False, "role": role, "detail": "Unauthorized"}
    
    try:
        # Sanitizar user_id (UUID)
        user_id = sanitize_string(user_id, max_length=100)
        
        # Validar role permitido
        allowed_roles = ["admin", "gestor", "analista"]
        if role not in allowed_roles:
            return {"success": False, "role": role, "detail": f"Role must be one of: {', '.join(allowed_roles)}"}
        
        client = ensure_supabase()
        
        # Upsert role
        client.table("user_roles").upsert({
            "user_id": user_id,
            "role": role
        }).execute()
        
        return {"success": True, "role": role}
    except Exception as e:
        print(f"❌ Error updating user role: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "role": role, "detail": str(e)}


# ============ Realtime Endpoints ============
@app.get("/api/realtime/weather")
async def get_realtime_weather(request: Request, lat: float = -15.6014, lon: float = -56.0979):
    get_user_from_request(request)
    
    # Simple bounds check for coordinates
    if lat < -90 or lat > 90:
        lat = -15.6014
    if lon < -180 or lon > 180:
        lon = -56.0979
    
    return {
        "lat": lat,
        "lon": lon,
        "temp": 32.0,
        "humidity": 65,
        "wind_speed": 10,
        "condition": "Parcialmente nublado",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/api/realtime/market")
async def get_realtime_market(request: Request):
    get_user_from_request(request)
    return {
        "valor_dolar": 5.35,
        "valor_jbs": 40.0,
        "valor_boi_gordo": 615.0,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/api/realtime/refresh")
async def refresh_realtime(request: Request, lat: float = -15.6014, lon: float = -56.0979):
    get_user_from_request(request)
    
    # Simple bounds check for coordinates
    if lat < -90 or lat > 90:
        lat = -15.6014
    if lon < -180 or lon > 180:
        lon = -56.0979
    
    return {
        "weather": {
            "lat": lat,
            "lon": lon,
            "temp": 32.0,
            "humidity": 65,
            "wind_speed": 10,
            "condition": "Parcialmente nublado",
            "timestamp": datetime.utcnow().isoformat()
        },
        "market": {
            "valor_dolar": 5.35,
            "valor_jbs": 40.0,
            "valor_boi_gordo": 615.0,
            "timestamp": datetime.utcnow().isoformat()
        }
    }


@app.get("/api/realtime/status")
async def get_realtime_status(request: Request):
    get_user_from_request(request)
    return {
        "last_weather_at": datetime.utcnow().isoformat(),
        "last_market_at": datetime.utcnow().isoformat(),
        "last_refresh_ok": datetime.utcnow().isoformat()
    }
