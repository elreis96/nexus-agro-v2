"""
FastAPI Backend - AgroData Nexus
Endpoints para buscar dados de APIs públicas e atualizar banco
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import requests
from datetime import datetime, timedelta
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="AgroData Nexus API",
    description="API para atualização de dados de mercado e clima",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️ Warning: Supabase credentials not found in environment variables")
    print("Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file")
    supabase = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ============ DATA FETCHERS ============

def fetch_weather_data(lat: float = -15.6014, lon: float = -56.0979, days: int = 7):
    """Open-Meteo API - Sem API key"""
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        'latitude': lat,
        'longitude': lon,
        'daily': 'temperature_2m_max,precipitation_sum',
        'timezone': 'America/Sao_Paulo',
        'forecast_days': days
    }
    
    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    data = response.json()
    
    records = []
    daily = data.get('daily', {})
    
    for i in range(len(daily.get('time', []))):
        records.append({
            'data_fk': daily['time'][i],
            'temp_max': daily['temperature_2m_max'][i],
            'chuva_mm': daily['precipitation_sum'][i],
            'localizacao': 'Cuiabá'
        })
    
    return records


def fetch_stock_data(ticker: str = "JBSS3.SA", days: int = 30):
    """Yahoo Finance via yfinance"""
    import yfinance as yf
    
    stock = yf.Ticker(ticker)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    hist = stock.history(start=start_date, end=end_date)
    
    records = []
    for date, row in hist.iterrows():
        records.append({
            'data': date.strftime('%Y-%m-%d'),
            'valor_jbs': round(row['Close'], 2)
        })
    
    return records


def fetch_dollar_data(days: int = 30):
    """Banco Central do Brasil"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    url = "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)"
    params = {
        '@dataInicial': f"'{start_date.strftime('%m-%d-%Y')}'",
        '@dataFinalCotacao': f"'{end_date.strftime('%m-%d-%Y')}'",
        '$top': 100,
        '$format': 'json',
        '$select': 'cotacaoCompra,dataHoraCotacao'
    }
    
    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    data = response.json()
    
    records = []
    for item in data.get('value', []):
        try:
            date_str = item['dataHoraCotacao'].split(' ')[0]
            date_obj = datetime.strptime(date_str, '%Y-%m-%d')
            
            records.append({
                'data': date_obj.strftime('%Y-%m-%d'),
                'valor_dolar': round(float(item['cotacaoCompra']), 4)
            })
        except (KeyError, ValueError):
            continue
    
    return records


def fetch_cattle_price(days: int = 30):
    """Boi Gordo - Dados simulados (CEPEA não tem API pública)"""
    records = []
    for i in range(days):
        date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        price = 310 + (i % 20) - 10
        records.append({
            'data': date,
            'valor_boi_gordo': round(price, 2)
        })
    
    return records


# ============ ENDPOINTS ============

@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "ok",
        "service": "AgroData Nexus API",
        "version": "1.0.0"
    }


@app.get("/api/health")
async def health():
    """Health check detalhado"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": "connected" if SUPABASE_URL else "not configured"
    }


@app.post("/api/fetch-weather")
async def fetch_weather(background_tasks: BackgroundTasks):
    """
    Busca dados climáticos e atualiza banco
    """
    try:
        weather_data = fetch_weather_data(lat=-15.6014, lon=-56.0979, days=7)
        
        if weather_data:
            supabase.table('fact_clima').upsert(weather_data, on_conflict='data_fk').execute()
        
        return {
            "success": True,
            "records": len(weather_data),
            "message": f"{len(weather_data)} registros climáticos atualizados"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/fetch-market")
async def fetch_market():
    """
    Busca dados de mercado (Dólar, JBS, Boi) e atualiza banco
    """
    try:
        dollar_data = fetch_dollar_data(30)
        stock_data = fetch_stock_data("JBSS3.SA", 30)
        cattle_data = fetch_cattle_price(30)
        
        # Combinar dados
        df_dollar = pd.DataFrame(dollar_data)
        df_stock = pd.DataFrame(stock_data)
        df_cattle = pd.DataFrame(cattle_data)
        
        df_merged = df_dollar.merge(df_stock, on='data', how='outer')
        df_merged = df_merged.merge(df_cattle, on='data', how='outer')
        df_merged = df_merged.rename(columns={'data': 'data_fk'})
        
        records = df_merged.to_dict('records')
        
        if records:
            supabase.table('fact_mercado').upsert(records, on_conflict='data_fk').execute()
        
        return {
            "success": True,
            "records": len(records),
            "message": f"{len(records)} registros de mercado atualizados"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/fetch-all")
async def fetch_all():
    """
    Atualiza todos os dados (clima + mercado)
    """
    try:
        # Clima
        weather_data = fetch_weather_data(lat=-15.6014, lon=-56.0979, days=7)
        if weather_data:
            supabase.table('fact_clima').upsert(weather_data, on_conflict='data_fk').execute()
        
        # Mercado
        dollar_data = fetch_dollar_data(30)
        stock_data = fetch_stock_data("JBSS3.SA", 30)
        cattle_data = fetch_cattle_price(30)
        
        df_dollar = pd.DataFrame(dollar_data)
        df_stock = pd.DataFrame(stock_data)
        df_cattle = pd.DataFrame(cattle_data)
        
        df_merged = df_dollar.merge(df_stock, on='data', how='outer')
        df_merged = df_merged.merge(df_cattle, on='data', how='outer')
        df_merged = df_merged.rename(columns={'data': 'data_fk'})
        
        market_records = df_merged.to_dict('records')
        
        if market_records:
            supabase.table('fact_mercado').upsert(market_records, on_conflict='data_fk').execute()
        
        return {
            "success": True,
            "weather_records": len(weather_data),
            "market_records": len(market_records),
            "message": "Todos os dados atualizados com sucesso"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
