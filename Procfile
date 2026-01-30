release: pip install --upgrade pip setuptools wheel && pip install --no-cache-dir -r api/requirements.txt && python -c "import uvicorn; print('uvicorn installed successfully')"
web: cd api && python -m uvicorn index:app --host 0.0.0.0 --port ${PORT:-8000}
