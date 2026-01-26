# PLANO DE CORREÇÃO COMPLETO - Agro Data Navigator

**Data**: 25 de Janeiro de 2026  
**Urgência**: 🔴 CRÍTICO (Credenciais vazadas no Git)  
**Tempo estimado**: 2-3 horas

---

## 🚨 SITUAÇÃO CRÍTICA

### .env ESTÁ NO GIT COM CREDENCIAIS!

```
✅ ENCONTRADO:
TRACKED: .env
TRACKED: .env.railway.example

❌ PROBLEMA:
- SERVICE_ROLE_KEY visible em histórico Git
- VITE_SUPABASE_ANON_KEY visible em histórico
- Qualquer pessoa com acesso ao repo pode:
  - Ver as chaves
  - Acessar Supabase
  - Deletar dados
```

### ARQUIVOS DUPLICADOS ENCONTRADOS

```
src/ (raiz):                    116 arquivos ← DELETAR
backend/:                        17 arquivos ← DELETAR
├─ api/ (duplicação de api/)
└─ package.json (Python backend?)
```

---

## 📋 ORDEM DE EXECUÇÃO

### FASE 1: Remover do Git (Histórico)

```bash
# 1. Remover .env do histórico Git (PERMANENTE)
git filter-branch --force --tree-filter 'rm -f .env' -- --all

# 2. Remover .env.railway.example também
git filter-branch --force --tree-filter 'rm -f .env.railway.example' -- --all

# 3. Atualizar referencias
git reflog expire --expire=now --all
git gc --aggressive --prune=now

# 4. Verificar (não deve mostrar mais)
git ls-files | grep ".env"
```

### FASE 2: Regenerar Credenciais

```bash
# No Supabase Dashboard:
# 1. Settings → API Keys → Regenerate
# 2. Copiar novas chaves
# 3. Atualizar em Vercel e Railway secrets
```

### FASE 3: Reorganizar Estrutura

```bash
# 1. Deletar src/ da raiz (116 arquivos)
rm -r src/

# 2. Deletar backend/ (17 arquivos - duplicado)
rm -r backend/

# 3. Deletar documentação criada (user requested)
rm -f START_HERE.md FINAL_REPORT.md QUICK_SUMMARY.md REVIEW_SUMMARY.md
rm -f BUG_REPORT_VERCEL.md VERCEL_FIX_CHECKLIST.md TROUBLESHOOTING_GUIDE.md
rm -f ARCHITECTURE_DIAGRAM.md DOCUMENTATION_INDEX.md

# 4. Deletar backups e exemplos
rm -f package.json.bak index.html old-backend-backup.zip

# 5. Manter .env.example (sem credenciais reais)
```

### FASE 4: Corrigir Código

```typescript
// 1. Corrigir frontend/src/lib/api-client.ts
// 2. Corrigir imports @/
// 3. Corrigir CORS headers
// 4. Implementar HTTP/2
```

### FASE 5: Criar .env Correto

```env
# .env (LOCAL - NÃO COMMITAR)
SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

VITE_API_URL=http://localhost:8000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8000

ENVIRONMENT=development
DEBUG=true
```

### FASE 6: Atualizar Plataformas

```bash
# Vercel:
# Settings → Environment Variables
# - VITE_SUPABASE_URL (regenerada)
# - VITE_SUPABASE_ANON_KEY (regenerada)
# - VITE_API_URL=https://seu-railway-url

# Railway:
# Variables
# - SUPABASE_URL (regenerada)
# - SUPABASE_SERVICE_ROLE_KEY (regenerada)
# - ALLOWED_ORIGINS=https://seu-vercel-url
```

---

## 🔧 ARQUIVOS A DELETAR

### Pasta `src/` (116 arquivos)

```
src/
├─ App.tsx
├─ App.css
├─ main.tsx
├─ index.css
├─ components/ (duplicado)
├─ contexts/ (duplicado)
├─ hooks/ (duplicado)
├─ integrations/ (duplicado)
├─ lib/ (duplicado)
├─ pages/ (duplicado)
├─ test/ (duplicado)
├─ assets/ (duplicado)
└─ vite-env.d.ts

DELETAR TUDO!
```

### Pasta `backend/` (17 arquivos)

```
backend/
├─ api/
│  ├─ main.py (duplicado com api/main.py)
│  ├─ index.py (duplicado com api/index.py)
│  ├─ requirements.txt (duplicado)
│  └─ tests/ (duplicado)
├─ package.json (❓ Por quê em backend Python?)
└─ README.md

DELETAR TUDO!
```

### Documentação (9 arquivos - user pediu para remover)

```
START_HERE.md
FINAL_REPORT.md
QUICK_SUMMARY.md
REVIEW_SUMMARY.md
BUG_REPORT_VERCEL.md
VERCEL_FIX_CHECKLIST.md
TROUBLESHOOTING_GUIDE.md
ARCHITECTURE_DIAGRAM.md
DOCUMENTATION_INDEX.md

DELETAR TUDO!
```

### Backups e Files Inutilizados

```
package.json.bak          ← Backup antigo
index.html (raiz)         ← Deve estar em frontend/
old-backend-backup.zip    ← Backup antigo
.env.railway.example      ← Example com dados
.env.vercel.example       ← Example com dados

DELETAR!
```

---

## ✅ ARQUIVOS A MANTER

### Essenciais

```
frontend/                  ← React + Vite (Vercel)
api/                       ← FastAPI (Vercel Python)
scripts/                   ← Utilitários
supabase/                  ← Migrations
vercel.json               ← Vercel config
.env                      ← Local (NÃO commitar)
.gitignore                ← Adicionar .env
.git/                     ← Histórico (após limpar)
tsconfig.json             ← Typescript (usar do frontend/)
package.json              ← Use o do frontend/
```

---

## 🔧 CÓDIGO A CORRIGIR

### 1. `frontend/src/lib/api-client.ts`

```typescript
// ANTES (ainda tem bug)
const API_BASE_URL = isProduction
  ? (typeof window !== 'undefined' ? window.location.origin : '')
  : (import.meta.env.VITE_API_URL || 'http://localhost:8000');

// DEPOIS
const API_BASE_URL = isProduction
  ? (import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : ''))
  : (import.meta.env.VITE_API_URL || 'http://localhost:8000');
```

### 2. `api/main.py` - CORS Headers Específicos

```python
# ANTES
allow_methods=["*"],
allow_headers=["*"],

# DEPOIS
allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
allow_headers=["Content-Type", "Authorization"],
```

### 3. Implementar HTTP/2 + httpx

```python
# Adicionar ao requirements.txt
httpx>=0.24.0  ← Client HTTP moderno com HTTP/2

# Em main.py:
import httpx
async_client = httpx.AsyncClient()  ← Para HTTP/2
```

---

## 🔒 SEGURANÇA PÓS-LIMPEZA

### RLS Policies a Verificar

```sql
-- Audit em Supabase Dashboard:
-- 1. audit_logs: apenas admin pode ler
-- 2. profiles: usuário vê só seu próprio
-- 3. fact_mercado: public read
-- 4. fact_clima: public read
```

### XSS Audit

```typescript
// Procurar em todo o código:
dangerouslySetInnerHTML  ← ❌ BANIDO

// Se encontrar, avisar!
```

---

## 📝 CHECKLIST FINAL

```
LIMPEZA:
[ ] Remover src/ (116 arquivos)
[ ] Remover backend/ (17 arquivos)
[ ] Remover 9 documentos MD
[ ] Remover backups e examples
[ ] Atualizar .gitignore
[ ] Remover .env do histórico Git
[ ] Regenerar credenciais Supabase

CORREÇÕES:
[ ] Corrigir API_BASE_URL
[ ] Corrigir CORS headers
[ ] Implementar HTTP/2
[ ] Audit XSS em componentes
[ ] Verify RLS policies

TESTES:
[ ] Build local funciona
[ ] Vercel build funciona
[ ] Railway build funciona
[ ] Login funciona
[ ] Dados carregam
[ ] Sem erros CORS

DEPLOY:
[ ] Push com limpeza
[ ] Redeploy Vercel
[ ] Redeploy Railway
[ ] Monitorar logs
```

---

**Próximo passo: Executar limpeza em ordem**

Este arquivo será usado como guia de execução.
