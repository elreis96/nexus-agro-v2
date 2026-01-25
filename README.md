# 🚜 AgroData Nexus - Projeto Separado (Frontend + Backend)

Esta estrutura separa o projeto em **frontend** (Vercel) e **backend** (Railway) para melhor organização e deployment independente.

## 📁 Estrutura do Projeto

```
agro-data-navigator/
├── frontend/                    # Aplicação React/Vite (Vercel)
│   ├── src/                     # Código-fonte React
│   ├── public/                  # Assets estáticos
│   ├── package.json             # Dependências Frontend
│   ├── vercel.json              # Config Vercel
│   └── ...
│
├── backend/                     # API FastAPI (Railway)
│   ├── api/
│   │   ├── index.py             # Entrypoint
│   │   ├── main.py              # FastAPI app
│   │   ├── requirements.txt      # Dependências Python
│   ├── Procfile                 # Config Railway
│   ├── nixpacks.toml            # Nixpacks (Python)
│   └── .railwayignore
│
├── supabase/                    # Migrations
├── csv/                         # Dados
├── scripts/                     # ETL
└── .env                         # Env vars (não commitar)
```

## 🚀 Como Usar

### **Frontend (Vercel)**

```bash
cd frontend
npm install
npm run dev          # localhost:5173
npm run build        # produção
```

Env vars:
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_API_URL=https://seu-backend.railway.app
```

### **Backend (Railway)**

```bash
cd backend
pip install -r api/requirements.txt
python -m uvicorn api.index:app --reload
```

Env vars:
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
ALLOWED_ORIGINS=https://seu-app.vercel.app
```

## 🔄 Deploy

1. **Mudanças locais** → `git commit` → `git push`
2. **Vercel**: Detecta changes em `frontend/` → redeploy
3. **Railway**: Detecta changes em `backend/` → redeploy

## 📚 Refs

- [Vercel](https://vercel.com/docs)
- [Railway](https://docs.railway.app)
- [FastAPI](https://fastapi.tiangolo.com)
- [Supabase](https://supabase.com/docs)

- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
