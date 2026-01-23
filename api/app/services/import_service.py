"""
Import Service - Business logic for CSV data import
Uses Pandas for robust data processing
"""

from supabase import Client
import pandas as pd
import io
from datetime import datetime
from typing import Tuple, List
from app.models.import_data import ImportResult


class ImportService:
    """Service for CSV import operations"""
    
    def __init__(self, supabase: Client):
        self.supabase = supabase
    
    def _clean_number(self, value) -> float | None:
        """Clean and parse number from CSV"""
        if pd.isna(value) or value == '' or value == 'null':
            return None
        
        try:
            # Handle Brazilian number format
            if isinstance(value, str):
                cleaned = value.replace('.', '').replace(',', '.')
                return round(float(cleaned), 4)
            return round(float(value), 4)
        except (ValueError, TypeError):
            return None
    
    def _clean_date(self, value) -> str | None:
        """Clean and parse date from CSV"""
        if pd.isna(value):
            return None
        
        try:
            # Try parsing different date formats
            date_obj = pd.to_datetime(value, errors='coerce')
            if pd.isna(date_obj):
                return None
            return date_obj.strftime('%Y-%m-%d')
        except:
            return None
    
    async def import_climate_data(
        self,
        file_content: bytes
    ) -> ImportResult:
        """
        Import climate data from CSV
        
        Expected columns: data, temp_max, chuva_mm, localizacao (optional)
        """
        try:
            # Read CSV with Pandas
            df = pd.read_csv(io.BytesIO(file_content))
            
            # Normalize column names
            df.columns = df.columns.str.strip().str.lower()
            
            # Map column aliases
            column_map = {
                'date': 'data',
                'temp': 'temp_max',
                'temperatura_max': 'temp_max',
                'chuva': 'chuva_mm',
                'precipitacao': 'chuva_mm',
                'local': 'localizacao',
                'cidade': 'localizacao'
            }
            df = df.rename(columns=column_map)
            
            # Validate required columns
            if 'data' not in df.columns:
                return ImportResult(
                    success=False,
                    records_imported=0,
                    records_failed=0,
                    total_records=0,
                    errors=["Column 'data' not found in CSV"],
                    message="Missing required column: data"
                )
            
            # Clean data
            df['data_fk'] = df['data'].apply(self._clean_date)
            df['temp_max'] = df.get('temp_max', pd.Series()).apply(self._clean_number)
            df['chuva_mm'] = df.get('chuva_mm', pd.Series()).apply(self._clean_number)
            df['localizacao'] = df.get('localizacao', 'Cuiabá').fillna('Cuiabá')
            
            # Remove rows with invalid dates
            df_valid = df[df['data_fk'].notna()].copy()
            
            # Prepare records for insertion
            records = df_valid[['data_fk', 'temp_max', 'chuva_mm', 'localizacao']].to_dict('records')
            
            # Insert in batches
            success_count = 0
            error_count = 0
            errors = []
            
            batch_size = 100
            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]
                try:
                    response = (self.supabase.from('fact_clima')
                        .upsert(batch, on_conflict='data_fk')
                        .execute())
                    success_count += len(batch)
                except Exception as e:
                    error_count += len(batch)
                    errors.append(f"Batch {i//batch_size + 1}: {str(e)}")
            
            return ImportResult(
                success=error_count == 0,
                records_imported=success_count,
                records_failed=error_count,
                total_records=len(df),
                errors=errors[:5],  # Limit to 5 errors
                message=f"Imported {success_count} climate records"
            )
            
        except Exception as e:
            return ImportResult(
                success=False,
                records_imported=0,
                records_failed=0,
                total_records=0,
                errors=[str(e)],
                message=f"Failed to process CSV: {str(e)}"
            )
    
    async def import_market_data(
        self,
        file_content: bytes
    ) -> ImportResult:
        """
        Import market data from CSV
        
        Expected columns: data, valor_dolar, valor_jbs, valor_boi_gordo
        """
        try:
            # Read CSV with Pandas
            df = pd.read_csv(io.BytesIO(file_content))
            
            # Normalize column names
            df.columns = df.columns.str.strip().str.lower()
            
            # Map column aliases
            column_map = {
                'date': 'data',
                'dolar': 'valor_dolar',
                'jbs': 'valor_jbs',
                'boi_gordo': 'valor_boi_gordo',
                'boi': 'valor_boi_gordo'
            }
            df = df.rename(columns=column_map)
            
            # Validate required columns
            required_cols = ['data', 'valor_dolar', 'valor_jbs', 'valor_boi_gordo']
            missing_cols = [col for col in required_cols if col not in df.columns]
            
            if missing_cols:
                return ImportResult(
                    success=False,
                    records_imported=0,
                    records_failed=0,
                    total_records=0,
                    errors=[f"Missing columns: {', '.join(missing_cols)}"],
                    message="Missing required columns"
                )
            
            # Clean data
            df['data_fk'] = df['data'].apply(self._clean_date)
            df['valor_dolar'] = df['valor_dolar'].apply(self._clean_number)
            df['valor_jbs'] = df['valor_jbs'].apply(self._clean_number)
            df['valor_boi_gordo'] = df['valor_boi_gordo'].apply(self._clean_number)
            
            # Remove rows with invalid dates
            df_valid = df[df['data_fk'].notna()].copy()
            
            # Prepare records for insertion
            records = df_valid[['data_fk', 'valor_dolar', 'valor_jbs', 'valor_boi_gordo']].to_dict('records')
            
            # Insert in batches
            success_count = 0
            error_count = 0
            errors = []
            
            batch_size = 100
            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]
                try:
                    response = (self.supabase.from('fact_mercado')
                        .upsert(batch, on_conflict='data_fk')
                        .execute())
                    success_count += len(batch)
                except Exception as e:
                    error_count += len(batch)
                    errors.append(f"Batch {i//batch_size + 1}: {str(e)}")
            
            return ImportResult(
                success=error_count == 0,
                records_imported=success_count,
                records_failed=error_count,
                total_records=len(df),
                errors=errors[:5],
                message=f"Imported {success_count} market records"
            )
            
        except Exception as e:
            return ImportResult(
                success=False,
                records_imported=0,
                records_failed=0,
                total_records=0,
                errors=[str(e)],
                message=f"Failed to process CSV: {str(e)}"
            )
