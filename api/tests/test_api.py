from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
import sys
import os
import pytest

# Add the parent directory to sys.path to allow importing main
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

client = TestClient(app)

# Mock Supabase client
@pytest.fixture
def mock_supabase():
    with patch("main.supabase") as mock:
        yield mock

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "AgroData Nexus API", "version": "1.0.0"}

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    # The database status might vary depending on mocking, but 'status' should be 'healthy'
    assert response.json()["status"] == "healthy"

def test_get_market_data_unauthorized(mock_supabase):
    # Should fail without token
    response = client.get("/api/market-data")
    assert response.status_code == 401
    assert response.json() == {"detail": "Missing authorization header"}

def test_get_market_data_success(mock_supabase):
    # Mock authentication
    mock_supabase.auth.get_user.return_value.user = {"id": "123", "email": "test@example.com"}
    
    # Mock data query
    mock_response = MagicMock()
    mock_response.data = [{"data_fk": "2023-01-01", "valor_dolar": 5.0}]
    mock_supabase.table.return_value.select.return_value.order.return_value.limit.return_value.execute.return_value = mock_response

    # Test with token
    headers = {"Authorization": "Bearer fake-token"}
    response = client.get("/api/market-data", headers=headers)
    
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["valor_dolar"] == 5.0

def test_get_climate_data_success(mock_supabase):
    # Mock authentication
    mock_supabase.auth.get_user.return_value.user = {"id": "123", "email": "test@example.com"}
    
    # Mock data query
    mock_response = MagicMock()
    mock_response.data = [{"data_fk": "2023-01-01", "temp_max": 30.0, "chuva_mm": 10.0}]
    mock_supabase.table.return_value.select.return_value.order.return_value.limit.return_value.execute.return_value = mock_response

    headers = {"Authorization": "Bearer fake-token"}
    response = client.get("/api/climate-data", headers=headers)
    
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["temp_max"] == 30.0

def test_get_correlation_analysis(mock_supabase):
    # Mock authentication
    mock_supabase.auth.get_user.return_value.user = {"id": "123", "email": "test"}
    
    # Mock data - Perfect correlation
    mock_response = MagicMock()
    mock_response.data = [
        {"data_fk": "2023-01-01", "valor_dolar": 1.0, "valor_jbs": 10.0, "valor_boi_gordo": 100.0},
        {"data_fk": "2023-01-02", "valor_dolar": 2.0, "valor_jbs": 20.0, "valor_boi_gordo": 200.0},
        {"data_fk": "2023-01-03", "valor_dolar": 3.0, "valor_jbs": 30.0, "valor_boi_gordo": 300.0}
    ]
    mock_supabase.table.return_value.select.return_value.order.return_value.limit.return_value.execute.return_value = mock_response

    headers = {"Authorization": "Bearer token"}
    response = client.get("/api/analytics/correlation", headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    assert "correlation_matrix" in data
    # Check perfect correlation (1.0)
    assert data["correlation_matrix"]["valor_dolar"]["valor_jbs"] > 0.99

def test_get_volatility_analysis(mock_supabase):
    # Mock authentication
    mock_supabase.auth.get_user.return_value.user = {"id": "123", "email": "test"}
    
    # Mock data
    mock_response = MagicMock()
    mock_response.data = [
        {"data_fk": "2023-01-01", "valor_dolar": 5.0, "valor_jbs": 20.0, "valor_boi_gordo": 200.0},
        {"data_fk": "2023-01-02", "valor_dolar": 5.5, "valor_jbs": 22.0, "valor_boi_gordo": 210.0},
        {"data_fk": "2023-01-03", "valor_dolar": 4.5, "valor_jbs": 18.0, "valor_boi_gordo": 190.0}
    ]
    mock_supabase.table.return_value.select.return_value.order.return_value.limit.return_value.execute.return_value = mock_response

    headers = {"Authorization": "Bearer token"}
    response = client.get("/api/analytics/volatility", headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    assert "volatility" in data
    assert "mean" in data
    assert data["data_points"] == 3
