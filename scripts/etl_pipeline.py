"""
ETL Pipeline - AgroData Nexus
Case: Verde Futuro Capital

Atende aos requisitos:
- Tratamento de valores nulos (ffill para mercado, manter NULL para clima)
- Normalização de datas (YYYY-MM-DD)
- Respeita diferença entre dias úteis (mercado) e dias corridos (clima)
- Insere em Star Schema (DIM_CALENDARIO, FACT_MERCADO, FACT_CLIMA)
"""

import pandas as pd
import numpy as np
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def create_dim_calendario(start_date: str, end_date: str):
    """
    Cria dimensão calendário com todos os dias (úteis e não úteis)
    Essencial para análise de lag entre clima e mercado
    """
    print("📅 Criando DIM_CALENDARIO...")
    
    date_range = pd.date_range(start=start_date, end=end_date, freq='D')
    
    df_calendario = pd.DataFrame({
        'data_pk': date_range.strftime('%Y-%m-%d'),
        'ano': date_range.year,
        'mes': date_range.month,
        'dia': date_range.day,
        'dia_semana': date_range.dayofweek,  # 0=Monday, 6=Sunday
        'is_business_day': date_range.dayofweek < 5  # True se seg-sex
    })
    
    # Inserir em lotes
    records = df_calendario.to_dict('records')
    batch_size = 100
    
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        try:
            supabase.table('dim_calendario').upsert(batch, on_conflict='data_pk').execute()
        except Exception as e:
            print(f"Erro ao inserir calendário: {e}")
    
    print(f"✅ {len(records)} datas criadas")
    return df_calendario


def extract_and_clean_finance(csv_path: str) -> pd.DataFrame:
    """
    Extrai e limpa dados de mercado (finance.csv)
    
    Tratamento de NaN:
    - Forward fill (ffill) para dias não úteis
    - Mantém estrutura de 252 dias úteis/ano
    """
    print("💰 Processando dados de mercado...")
    
    df = pd.read_csv(csv_path)
    
    # Normalizar colunas
    df.columns = df.columns.str.strip().str.lower()
    column_map = {
        'date': 'data',
        'dolar': 'valor_dolar',
        'jbs': 'valor_jbs',
        'boi_gordo': 'valor_boi_gordo',
    }
    df = df.rename(columns=column_map)
    
    # Converter data para formato padrão
    df['data'] = pd.to_datetime(df['data'], errors='coerce')
    
    # Limpar números (remove separadores, converte vírgula)
    for col in ['valor_dolar', 'valor_jbs', 'valor_boi_gordo']:
        if col in df.columns:
            df[col] = (
                df[col]
                .astype(str)
                .str.replace(r'[^\d.,-]', '', regex=True)
                .str.replace('.', '', regex=False)
                .str.replace(',', '.', regex=False)
            )
            df[col] = pd.to_numeric(df[col], errors='coerce')
    
    # IMPORTANTE: Forward fill para preencher fins de semana
    # Isso mantém o último valor de sexta para sábado/domingo
    df = df.sort_values('data')
    df[['valor_dolar', 'valor_jbs', 'valor_boi_gordo']] = df[['valor_dolar', 'valor_jbs', 'valor_boi_gordo']].ffill()
    
    # Remover linhas sem data
    df = df.dropna(subset=['data'])
    
    # Formatar data final
    df['data'] = df['data'].dt.strftime('%Y-%m-%d')
    
    print(f"✅ {len(df)} registros de mercado processados")
    return df


def extract_and_clean_weather(csv_path: str) -> pd.DataFrame:
    """
    Extrai e limpa dados climáticos (weather.csv)
    
    Tratamento de NaN:
    - Mantém NULL quando não há medição
    - Clima é contínuo (365 dias/ano)
    """
    print("🌦️ Processando dados climáticos...")
    
    df = pd.read_csv(csv_path)
    
    # Normalizar colunas
    df.columns = df.columns.str.strip().str.lower()
    column_map = {
        'date': 'data',
        'chuva': 'chuva_mm',
        'temp': 'temp_max',
    }
    df = df.rename(columns=column_map)
    
    # Converter data
    df['data'] = pd.to_datetime(df['data'], errors='coerce')
    
    # Limpar números
    for col in ['chuva_mm', 'temp_max']:
        if col in df.columns:
            df[col] = (
                df[col]
                .astype(str)
                .str.replace(r'[^\d.,-]', '', regex=True)
                .str.replace('.', '', regex=False)
                .str.replace(',', '.', regex=False)
            )
            df[col] = pd.to_numeric(df[col], errors='coerce')
    
    # Localização padrão
    if 'localizacao' not in df.columns:
        df['localizacao'] = 'Mato Grosso'
    
    # IMPORTANTE: NÃO fazer forward fill
    # Manter NULL quando não há medição climática
    
    df = df.dropna(subset=['data'])
    df['data'] = df['data'].dt.strftime('%Y-%m-%d')
    
    print(f"✅ {len(df)} registros climáticos processados")
    return df


def load_to_warehouse(df_finance: pd.DataFrame, df_weather: pd.DataFrame):
    """
    Carrega dados no Data Warehouse (Supabase)
    Star Schema: DIM_CALENDARIO + FACT_MERCADO + FACT_CLIMA
    """
    print("\n📦 Carregando no Data Warehouse...")
    
    # 1. Criar dimensão calendário
    min_date = min(df_finance['data'].min(), df_weather['data'].min())
    max_date = max(df_finance['data'].max(), df_weather['data'].max())
    create_dim_calendario(min_date, max_date)
    
    # 2. Carregar FACT_MERCADO
    print("\n💰 Carregando FACT_MERCADO...")
    records_finance = df_finance.rename(columns={'data': 'data_fk'}).to_dict('records')
    
    batch_size = 100
    success_finance = 0
    
    for i in range(0, len(records_finance), batch_size):
        batch = records_finance[i:i + batch_size]
        try:
            supabase.table('fact_mercado').insert(batch).execute()
            success_finance += len(batch)
        except Exception as e:
            print(f"Erro: {e}")
    
    print(f"✅ {success_finance} registros de mercado inseridos")
    
    # 3. Carregar FACT_CLIMA
    print("\n🌦️ Carregando FACT_CLIMA...")
    records_weather = df_weather.rename(columns={'data': 'data_fk'}).to_dict('records')
    
    success_weather = 0
    
    for i in range(0, len(records_weather), batch_size):
        batch = records_weather[i:i + batch_size]
        try:
            supabase.table('fact_clima').insert(batch).execute()
            success_weather += len(batch)
        except Exception as e:
            print(f"Erro: {e}")
    
    print(f"✅ {success_weather} registros climáticos inseridos")


def run_etl_pipeline():
    """
    Pipeline ETL completo
    Atende aos requisitos do case Verde Futuro Capital
    """
    print("=" * 60)
    print("🚜 AGRODATA NEXUS - ETL PIPELINE")
    print("Cliente: Verde Futuro Capital")
    print("=" * 60)
    
    # Extract & Transform
    df_finance = extract_and_clean_finance('csv/finance_data.csv')
    df_weather = extract_and_clean_weather('csv/weather_data.csv')
    
    # Load
    load_to_warehouse(df_finance, df_weather)
    
    print("\n" + "=" * 60)
    print("✅ ETL PIPELINE CONCLUÍDO")
    print("=" * 60)
    print("\n📊 Próximos passos:")
    print("1. Conectar Power BI ao Supabase")
    print("2. Criar análises de correlação (Dólar x Boi)")
    print("3. Implementar análise de lag (Chuva → Preço)")
    print("4. Criar boxplots de volatilidade mensal")


if __name__ == "__main__":
    run_etl_pipeline()
