# Configuração de Variáveis de Ambiente - Vercel

## ⚠️ Variáveis CRÍTICAS para Produção

Configure estas variáveis em: **Vercel Dashboard → Project Settings → Environment Variables**

### 1. Supabase (Backend)
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Service Role Key)
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (mesmo que SERVICE_ROLE_KEY)
```

### 2. Supabase (Frontend)
```
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (mesmo valor da ANON_KEY)
```

### 3. CORS/Produção
```
ALLOWED_ORIGINS=https://seu-projeto.vercel.app,https://www.seu-dominio.com
```
**IMPORTANTE**: Adicione a URL pública da Vercel aqui, senão terá erros CORS.

### 4. API URL (Frontend)
```
VITE_API_URL=https://seu-projeto.vercel.app
```
**IMPORTANTE**: Aponta para a URL de produção, não localhost.

---

## 📋 Checklist de Deploy

- [ ] Renomeado `api/main.py` → `api/index.py`
- [ ] Atualizado `vercel.json` para apontar a `api/index.py`
- [ ] Configuradas TODAS as variáveis acima no painel da Vercel
- [ ] ALLOWED_ORIGINS inclui a URL da Vercel
- [ ] VITE_API_URL aponta para produção (não localhost)
- [ ] VITE_SUPABASE_ANON_KEY = VITE_SUPABASE_PUBLISHABLE_KEY (mesmo valor)
- [ ] SUPABASE_SERVICE_ROLE_KEY configurada (obrigatória para admin)

---

## 🔍 Testar Deploy

1. **Health Check da API**:
   ```
   https://seu-projeto.vercel.app/api/health
   ```
   Deve retornar: `{"status": "healthy", "database": "connected", ...}`

2. **Root da API**:
   ```
   https://seu-projeto.vercel.app/api/
   ```
   Deve retornar: `{"status": "ok", "service": "AgroData Nexus API", ...}`

3. **Frontend**:
   ```
   https://seu-projeto.vercel.app
   ```
   Deve carregar o dashboard sem erros 500.

---

## ❌ Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `Internal Server Error` | `api/main.py` não encontrado | ✓ Renomear para `api/index.py` |
| `Database not configured` | Variáveis Supabase ausentes | ✓ Configurar VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY |
| `CORS error` | ALLOWED_ORIGINS só tem localhost | ✓ Adicionar URL da Vercel |
| `Admin operations fail` | SERVICE_ROLE_KEY ausente | ✓ Configurar SUPABASE_SERVICE_ROLE_KEY |
| `Frontend não carrega dados` | VITE_API_URL aponta para localhost | ✓ Mudar para URL de produção |

---

## 🚀 Próximos Passos

Após configurar as variáveis:

1. **Commit e Push**:
   ```bash
   git add .
   git commit -m "fix: configure API for Vercel deployment"
   git push origin main
   ```

2. **Redeploy na Vercel** (automático após push)

3. **Verificar Logs** no painel da Vercel se houver erros

---

**Última atualização**: 24 Janeiro 2026
