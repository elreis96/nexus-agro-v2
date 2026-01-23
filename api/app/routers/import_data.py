"""
Import Router
Endpoints for CSV data import (climate and market data)
"""

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Request, status
from app.models.import_data import ImportResult
from app.services.import_service import ImportService
from app.database import get_supabase
from app.auth import require_admin, AuthUser
from app.rate_limit import rate_limit_import, rate_limit_by_ip
from supabase import Client


router = APIRouter(prefix="/api/import", tags=["import"])


@router.post("/climate", response_model=ImportResult)
async def import_climate_data(
    request: Request,
    file: UploadFile = File(...),
    current_user: AuthUser = Depends(require_admin),  # Admin only
    supabase: Client = Depends(get_supabase)
):
    """
    Import climate data from CSV
    
    **Expected CSV columns:**
    - data (or Date): Date in YYYY-MM-DD or DD/MM/YYYY format
    - temp_max (or Temp_Max): Maximum temperature
    - chuva_mm (or Chuva_mm): Precipitation in mm
    - localizacao (optional): Location (default: Cuiabá)
    
    **Authentication Required**
    
    **Rate Limit:** 10 imports per hour per user
    
    **File Requirements:**
    - Format: CSV
    - Max size: 10MB
    - Encoding: UTF-8
    """
    # Rate limiting - strict for imports
    await rate_limit_by_ip(request)
    await rate_limit_import(current_user.user_id)
    
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are allowed"
        )
    
    # Read file content
    content = await file.read()
    
    # Validate file size (10MB max)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large. Maximum size is 10MB"
        )
    
    # Process import
    service = ImportService(supabase)
    result = await service.import_climate_data(content)
    
    if not result.success and result.records_imported == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.message
        )
    
    return result


@router.post("/market", response_model=ImportResult)
async def import_market_data(
    request: Request,
    file: UploadFile = File(...),
    current_user: AuthUser = Depends(require_admin),  # Admin only
    supabase: Client = Depends(get_supabase)
):
    """
    Import market data from CSV
    
    **Expected CSV columns:**
    - data (or Date): Date in YYYY-MM-DD or DD/MM/YYYY format
    - valor_dolar (or Dolar): Dollar exchange rate
    - valor_jbs (or JBS): JBS stock price
    - valor_boi_gordo (or Boi_Gordo): Cattle price
    
    **Authentication Required**
    
    **Rate Limit:** 10 imports per hour per user
    
    **File Requirements:**
    - Format: CSV
    - Max size: 10MB
    - Encoding: UTF-8
    """
    # Rate limiting - strict for imports
    await rate_limit_by_ip(request)
    await rate_limit_import(current_user.user_id)
    
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are allowed"
        )
    
    # Read file content
    content = await file.read()
    
    # Validate file size (10MB max)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large. Maximum size is 10MB"
        )
    
    # Process import
    service = ImportService(supabase)
    result = await service.import_market_data(content)
    
    if not result.success and result.records_imported == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.message
        )
    
    return result


# TODO: Add endpoint for combined import (climate + market in one file)
# TODO: Add endpoint to get import history
# TODO: Add endpoint to validate CSV before import
