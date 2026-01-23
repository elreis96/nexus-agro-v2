"""
Script Python para importar CSVs no AgroData Nexus
Usa Pandas para limpeza robusta de dados
"""

import pandas as pd
from supabase import create_client, Client
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def clean_and_import_finance(csv_path: str):
    """Importa dados de mercado (finance_data.csv)"""
    print(f"📊 Lendo {csv_path}...")
    
    # Ler CSV com Pandas
    df = pd.read_csv(csv_path)
    
    # Normalizar nomes de colunas
    df.columns = df.columns.str.strip().str.lower()
    
    # Mapear colunas
    column_map = {
        'date': 'data',
        'data_fk': 'data',
        'dolar': 'valor_dolar',
        'jbs': 'valor_jbs',
        'boi_gordo': 'valor_boi_gordo',
    }
    
    df = df.rename(columns=column_map)
    
    # Converter data para formato correto
    df['data'] = pd.to_datetime(df['data'], errors='coerce').dt.strftime('%Y-%m-%d')
    
    # Limpar e converter números
    for col in ['valor_dolar', 'valor_jbs', 'valor_boi_gordo']:
        if col in df.columns:
            df[col] = (
                df[col]
                .astype(str)
                .str.replace('.', '', regex=False)  # Remove separador de milhar
                .str.replace(',', '.', regex=False)  # Converte vírgula decimal
                .str.strip()
            )
            df[col] = pd.to_numeric(df[col], errors='coerce')
            df[col] = df[col].round(4)  # Arredondar para 4 casas decimais
    
    # Remover linhas com data inválida
    df = df.dropna(subset=['data'])
    
    # Preparar dados para inserção
    records = df[['data', 'valor_dolar', 'valor_jbs', 'valor_boi_gordo']].to_dict('records')
    
    # Renomear 'data' para 'data_fk'
    records = [
        {
            'data_fk': r['data'],
            'valor_dolar': r['valor_dolar'],
            'valor_jbs': r['valor_jbs'],
            'valor_boi_gordo': r['valor_boi_gordo']
        }
        for r in records
    ]
    
    print(f"✅ {len(records)} registros prontos para inserção")
    
    # Inserir em lotes de 100
    batch_size = 100
    success = 0
    errors = 0
    
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        try:
            response = supabase.table('fact_mercado').insert(batch).execute()
            success += len(batch)
            print(f"✅ Lote {i//batch_size + 1}: {len(batch)} registros inseridos")
        except Exception as e:
            errors += len(batch)
            print(f"❌ Erro no lote {i//batch_size + 1}: {e}")
    
    print(f"\n📊 Resultado: {success} sucesso, {errors} erros")


def clean_and_import_weather(csv_path: str):
    """Importa dados climáticos (weather_data.csv)"""
    print(f"🌦️ Lendo {csv_path}...")
    
    # Ler CSV com Pandas
    df = pd.read_csv(csv_path)
    
    # Normalizar nomes de colunas
    df.columns = df.columns.str.strip().str.lower()
    
    # Mapear colunas
    column_map = {
        'date': 'data',
        'data_fk': 'data',
        'chuva': 'chuva_mm',
        'temp': 'temp_max',
        'temperatura_max': 'temp_max',
        'local': 'localizacao',
        'cidade': 'localizacao',
    }
    
    df = df.rename(columns=column_map)
    
    # Converter data para formato correto
    df['data'] = pd.to_datetime(df['data'], errors='coerce').dt.strftime('%Y-%m-%d')
    
    # Limpar e converter números
    for col in ['chuva_mm', 'temp_max']:
        if col in df.columns:
            df[col] = (
                df[col]
                .astype(str)
                .str.replace('.', '', regex=False)
                .str.replace(',', '.', regex=False)
                .str.strip()
            )
            df[col] = pd.to_numeric(df[col], errors='coerce')
            df[col] = df[col].round(4)
    
    # Preencher localização padrão
    if 'localizacao' not in df.columns:
        df['localizacao'] = 'SP'
    else:
        df['localizacao'] = df['localizacao'].fillna('SP')
    
    # Remover linhas com data inválida
    df = df.dropna(subset=['data'])
    
    # Preparar dados para inserção
    records = df[['data', 'chuva_mm', 'temp_max', 'localizacao']].to_dict('records')
    
    # Renomear 'data' para 'data_fk'
    records = [
        {
            'data_fk': r['data'],
            'chuva_mm': r['chuva_mm'],
            'temp_max': r['temp_max'],
            'localizacao': r['localizacao']
        }
        for r in records
    ]
    
    print(f"✅ {len(records)} registros prontos para inserção")
    
    # Inserir em lotes de 100
    batch_size = 100
    success = 0
    errors = 0
    
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        try:
            response = supabase.table('fact_clima').insert(batch).execute()
            success += len(batch)
            print(f"✅ Lote {i//batch_size + 1}: {len(batch)} registros inseridos")
        except Exception as e:
            errors += len(batch)
            print(f"❌ Erro no lote {i//batch_size + 1}: {e}")
    
    print(f"\n🌦️ Resultado: {success} sucesso, {errors} erros")


if __name__ == "__main__":
    print("🚀 AgroData Nexus - Importador de CSV\n")
    
    # Importar dados de mercado
    if os.path.exists("csv/finance_data.csv"):
        clean_and_import_finance("csv/finance_data.csv")
    else:
        print("⚠️ Arquivo csv/finance_data.csv não encontrado")
    
    print("\n" + "="*50 + "\n")
    
    # Importar dados climáticos
    if os.path.exists("csv/weather_data.csv"):
        clean_and_import_weather("csv/weather_data.csv")
    else:
        print("⚠️ Arquivo csv/weather_data.csv não encontrado")
    
    print("\n✅ Importação concluída!")
