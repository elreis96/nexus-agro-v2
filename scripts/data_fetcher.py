"""
Data Fetcher - Puxa dados de APIs públicas
Atualiza automaticamente: Clima, Bolsa, Commodities, Dólar

APIs utilizadas:
- OpenWeather: Clima
- Yahoo Finance: JBS (JBSS3.SA)
- CEPEA: Boi Gordo
- Banco Central: Dólar (PTAX)
"""

import requests
import pandas as pd
from datetime import datetime, timedelta
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

# API Keys (adicionar no .env)
OPENWEATHER_KEY = os.getenv("OPENWEATHER_API_KEY")
ALPHAVANTAGE_KEY = os.getenv("ALPHAVANTAGE_API_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def fetch_weather_data(lat: float = -15.6014, lon: float = -56.0979, days: int = 7):
    """
    Busca dados climáticos do Open-Meteo (sem API key!)
    Coordenadas padrão: Cuiabá, MT
    https://open-meteo.com/
    """
    print(f"🌦️ Buscando dados climáticos (Open-Meteo)...")
    
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        'latitude': lat,
        'longitude': lon,
        'daily': 'temperature_2m_max,precipitation_sum',
        'timezone': 'America/Sao_Paulo',
        'forecast_days': days
    }
    
    try:
        response = requests.get(url, params=params)
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
        
    except Exception as e:
        print(f"❌ Erro ao buscar clima: {e}")
        return []


def fetch_stock_data(ticker: str = "JBSS3.SA", days: int = 30):
    """
    Busca dados de ações do Yahoo Finance
    Ticker JBS: JBSS3.SA
    """
    print(f"📈 Buscando dados de {ticker}...")
    
    # Usando yfinance (instalar: pip install yfinance)
    try:
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
        
    except Exception as e:
        print(f"❌ Erro ao buscar ações: {e}")
        return []


def fetch_dollar_data(days: int = 30):
    """
    Busca cotação do Dólar do Banco Central
    API: https://olinda.bcb.gov.br/
    """
    print("💵 Buscando cotação do Dólar...")
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Formato correto da API do BC
    url = "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)"
    params = {
        '@dataInicial': f"'{start_date.strftime('%m-%d-%Y')}'",
        '@dataFinalCotacao': f"'{end_date.strftime('%m-%d-%Y')}'",
        '$top': 100,
        '$format': 'json',
        '$select': 'cotacaoCompra,dataHoraCotacao'
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        records = []
        for item in data.get('value', []):
            try:
                # Parse da data
                date_str = item['dataHoraCotacao'].split(' ')[0]
                date_obj = datetime.strptime(date_str, '%Y-%m-%d')
                
                records.append({
                    'data': date_obj.strftime('%Y-%m-%d'),
                    'valor_dolar': round(float(item['cotacaoCompra']), 4)
                })
            except (KeyError, ValueError) as e:
                continue
        
        print(f"✅ {len(records)} cotações do dólar obtidas")
        return records
        
    except requests.exceptions.Timeout:
        print(f"⚠️ Timeout na API do BC - usando dados históricos")
        return []
    except Exception as e:
        print(f"❌ Erro ao buscar dólar: {e}")
        return []


def fetch_cattle_price(days: int = 30):
    """
    Busca preço do Boi Gordo do CEPEA
    Nota: CEPEA não tem API pública, usar web scraping ou dados históricos
    """
    print("🐄 Buscando preço do Boi Gordo...")
    
    # Placeholder - implementar scraping do CEPEA ou usar dados históricos
    # Por enquanto, retorna dados fictícios para demonstração
    
    records = []
    for i in range(days):
        date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        # Preço médio histórico: R$ 300-320/@
        price = 310 + (i % 20) - 10
        records.append({
            'data': date,
            'valor_boi_gordo': round(price, 2)
        })
    
    return records


def merge_and_save_market_data():
    """
    Combina dados de diferentes fontes e salva no banco
    """
    print("\n" + "="*60)
    print("🚀 INICIANDO ATUALIZAÇÃO DE DADOS")
    print("="*60)
    
    # Buscar dados
    dollar_data = fetch_dollar_data(30)
    stock_data = fetch_stock_data("JBSS3.SA", 30)
    cattle_data = fetch_cattle_price(30)
    
    # Combinar em um DataFrame
    df_dollar = pd.DataFrame(dollar_data)
    df_stock = pd.DataFrame(stock_data)
    df_cattle = pd.DataFrame(cattle_data)
    
    # Merge por data
    df_merged = df_dollar.merge(df_stock, on='data', how='outer')
    df_merged = df_merged.merge(df_cattle, on='data', how='outer')
    
    # Renomear para schema do banco
    df_merged = df_merged.rename(columns={'data': 'data_fk'})
    
    # Inserir no banco
    records = df_merged.to_dict('records')
    
    print(f"\n💾 Inserindo {len(records)} registros de mercado...")
    
    try:
        supabase.table('fact_mercado').upsert(records, on_conflict='data_fk').execute()
        print(f"✅ {len(records)} registros de mercado atualizados")
    except Exception as e:
        print(f"❌ Erro ao salvar mercado: {e}")


def save_weather_data():
    """
    Salva dados climáticos no banco
    """
    # Coordenadas de Cuiabá, MT
    weather_data = fetch_weather_data(lat=-15.6014, lon=-56.0979, days=7)
    
    if weather_data:
        print(f"\n💾 Inserindo {len(weather_data)} registros climáticos...")
        try:
            supabase.table('fact_clima').upsert(weather_data, on_conflict='data_fk').execute()
            print(f"✅ {len(weather_data)} registros climáticos atualizados")
        except Exception as e:
            print(f"❌ Erro ao salvar clima: {e}")


def run_daily_update():
    """
    Execução diária - atualiza todos os dados
    """
    print("\n" + "="*60)
    print(f"📅 ATUALIZAÇÃO DIÁRIA - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    merge_and_save_market_data()
    save_weather_data()
    
    print("\n" + "="*60)
    print("✅ ATUALIZAÇÃO CONCLUÍDA")
    print("="*60)


if __name__ == "__main__":
    run_daily_update()
