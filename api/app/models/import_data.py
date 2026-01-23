"""
Pydantic models for CSV Import
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class ImportResult(BaseModel):
    """Result of CSV import operation"""
    success: bool
    records_imported: int
    records_failed: int
    total_records: int
    errors: List[str] = Field(default_factory=list)
    message: str


class MarketDataRecord(BaseModel):
    """Single market data record"""
    data_fk: str
    valor_dolar: Optional[float] = None
    valor_jbs: Optional[float] = None
    valor_boi_gordo: Optional[float] = None


class ClimateDataRecord(BaseModel):
    """Single climate data record"""
    data_fk: str
    temp_max: Optional[float] = None
    chuva_mm: Optional[float] = None
    localizacao: str = "SP"
