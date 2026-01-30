# 🎨 Frontend - AgroData Nexus (Vercel)

Aplicação React com Vite, TypeScript e Supabase.

## 📦 Setup

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # Produção
```

## 🌐 Deployment (Vercel)

**Env vars** (adicionar em Vercel Dashboard):
```env
VITE_SUPABASE_URL=https://fulklwarlfbttvbjubmw.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_API_URL=https://seu-backend.railway.app
```

**URL Produção**: `https://seu-app.vercel.app`

## 📁 Estrutura

```
src/
├── components/      # Componentes React (UI, Charts, etc)
├── contexts/        # Auth, Theme contexts
├── hooks/           # Custom hooks
├── pages/           # Páginas (Dashboard, Admin, etc)
├── lib/             # Utilities (API client, types, etc)
├── integrations/    # Supabase client
└── App.tsx
```

## 🔗 Conecta ao Backend

API Client em `src/lib/api-client.ts` auto-detecta:
- **Dev**: `http://localhost:8000`
- **Prod**: URL do Railway (via `VITE_API_URL`)

## 🚀 Quick Start

```bash
cd frontend
npm install
npm run dev
```

Acessa em http://localhost:5173
