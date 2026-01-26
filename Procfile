release: pip install --upgrade pip && pip install --no-cache-dir -r api/requirements.txt
web: cd api && python -m uvicorn index:app --host 0.0.0.0 --port $PORT --http h2c --loop uvloop
