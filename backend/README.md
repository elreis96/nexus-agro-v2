# 🐍 Backend - AgroData Nexus (Railway)

API FastAPI com Python, Supabase e dados agrícolas.

## 📦 Setup

```bash
pip install -r api/requirements.txt
python -m uvicorn api.index:app --reload
```

Acessa em http://localhost:8000
API Docs: http://localhost:8000/docs

## 🌐 Deployment (Railway)

**Procfile**: 
```
web: python -m uvicorn api.index:app --host 0.0.0.0 --port $PORT
```

**Nixpacks**: Força Python (não Node)

**Env vars** (adicionar em Railway Dashboard):
```env
VITE_SUPABASE_URL=https://fulklwarlfbttvbjubmw.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
ALLOWED_ORIGINS=https://seu-app.vercel.app
```

**URL Produção**: `https://seu-backend.railway.app`

## 📁 Estrutura

```
api/
├── index.py         # Entrypoint (importa app de main)
├── main.py          # FastAPI app + endpoints
├── requirements.txt  # Dependências Python
└── tests/
```

## 🔌 Endpoints

```
GET  /api/health          # Status da API
GET  /api/market-data     # Dados de mercado
GET  /api/climate-data    # Dados climáticos
POST /api/import/market   # Upload CSV mercado
POST /api/import/climate  # Upload CSV clima
```

## 🚀 Quick Start

```bash
cd backend
pip install -r api/requirements.txt
python -m uvicorn api.index:app --reload
```

Acessa http://localhost:8000/docs
