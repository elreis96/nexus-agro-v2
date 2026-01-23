"""
FastAPI backend para processar CSVs com Pandas
Recebe arquivo do frontend, limpa dados, e insere no Supabase
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import io
from typing import Literal

load_dotenv()

app = FastAPI(title="AgroData CSV Processor")

# CORS para permitir requisições do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173", "https://nexus-agro.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def clean_finance_data(df: pd.DataFrame) -> pd.DataFrame:
    """Limpa e normaliza dados de mercado"""
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
    
    # Converter data
    df['data'] = pd.to_datetime(df['data'], errors='coerce').dt.strftime('%Y-%m-%d')
    
    # Limpar números
    for col in ['valor_dolar', 'valor_jbs', 'valor_boi_gordo']:
        if col in df.columns:
            df[col] = (
                df[col]
                .astype(str)
                .str.replace(r'[^\d.,-]', '', regex=True)  # Remove tudo exceto números
                .str.replace('.', '', regex=False)  # Remove separador de milhar
                .str.replace(',', '.', regex=False)  # Converte vírgula decimal
                .str.strip()
            )
            df[col] = pd.to_numeric(df[col], errors='coerce')
            df[col] = df[col].round(4)
    
    # Remover linhas inválidas
    df = df.dropna(subset=['data'])
    
    # Renomear para schema do banco
    df = df.rename(columns={'data': 'data_fk'})
    
    return df[['data_fk', 'valor_dolar', 'valor_jbs', 'valor_boi_gordo']]


def clean_weather_data(df: pd.DataFrame) -> pd.DataFrame:
    """Limpa e normaliza dados climáticos"""
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
    
    # Converter data
    df['data'] = pd.to_datetime(df['data'], errors='coerce').dt.strftime('%Y-%m-%d')
    
    # Limpar números
    for col in ['chuva_mm', 'temp_max']:
        if col in df.columns:
            df[col] = (
                df[col]
                .astype(str)
                .str.replace(r'[^\d.,-]', '', regex=True)
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
        df['localizacao'] = df['localizacao'].fillna('SP').str.strip()
    
    # Remover linhas inválidas
    df = df.dropna(subset=['data'])
    
    # Renomear para schema do banco
    df = df.rename(columns={'data': 'data_fk'})
    
    return df[['data_fk', 'chuva_mm', 'temp_max', 'localizacao']]


@app.post("/api/import-csv")
async def import_csv(
    file: UploadFile = File(...),
    type: Literal["mercado", "clima"] = "mercado"
):
    """
    Endpoint para importar CSV
    - Recebe arquivo do frontend
    - Processa com Pandas
    - Insere no Supabase
    """
    try:
        # Ler arquivo CSV
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Limpar dados baseado no tipo
        if type == "mercado":
            df_clean = clean_finance_data(df)
            table_name = "fact_mercado"
        else:
            df_clean = clean_weather_data(df)
            table_name = "fact_clima"
        
        # Converter para lista de dicts
        records = df_clean.to_dict('records')
        
        if len(records) == 0:
            raise HTTPException(status_code=400, detail="Nenhum registro válido encontrado")
        
        # Inserir em lotes de 100
        batch_size = 100
        success = 0
        errors = 0
        error_messages = []
        
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            try:
                response = supabase.table(table_name).insert(batch).execute()
                success += len(batch)
            except Exception as e:
                errors += len(batch)
                error_messages.append(str(e))
        
        return {
            "success": success,
            "errors": errors,
            "total": len(records),
            "error_messages": error_messages[:5]  # Primeiros 5 erros
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar CSV: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "AgroData CSV Processor"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
