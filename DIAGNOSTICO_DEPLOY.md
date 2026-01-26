# 🔍 DIAGNÓSTICO COMPLETO - Problemas de Comunicação Supabase após Deploy

**Data**: 25 de Janeiro de 2026  
**Engenheiro**: Full Stack Sênior  
**Problema**: Dashboard não carrega dados do Supabase após deploy na Vercel/Railway

---

## 🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. ❌ **CLIENTE SUPABASE SEM VALIDAÇÃO DE VARIÁVEIS**

**Arquivo**: `frontend/src/integrations/supabase/client.ts`

**Problema**:
```typescript
// ❌ ATUAL - Sem validação
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {...});
```

**Consequência**:
- Se `VITE_SUPABASE_URL` ou `VITE_SUPABASE_PUBLISHABLE_KEY` forem `undefined` no deploy, o cliente será criado com valores `undefined`
- Todas as queries falharão silenciosamente ou retornarão erros genéricos
- O dashboard não mostrará dados, mas não haverá erro claro no console

**Solução**: Adicionar validação e erro explícito

---

### 2. ❌ **CONFIGURAÇÃO INCORRETA DO VERCEL.JSON**

**Arquivo**: `vercel.json`

**Problema**:
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "api/index.py"  // ← Assume API na Vercel
    }
  ]
}
```

**Consequência**:
- Se o backend está no **Railway** e não na Vercel, o rewrite não funciona
- O `VITE_API_URL` deve apontar para a URL do Railway, não para a Vercel
- Requests para `/api/*` serão redirecionados incorretamente

**Solução**: Verificar se a API está na Vercel ou Railway e ajustar configuração

---

### 3. ❌ **FEATURE FLAG USE_FASTAPI NÃO DEFINIDO**

**Arquivos**:
- `frontend/src/hooks/useMarketData.ts` (linha 23)
- `frontend/src/hooks/useNotifications.ts` (linha 16)
- `frontend/src/components/CSVImport.tsx` (linha 27)

**Problema**:
```typescript
const USE_FASTAPI = import.meta.env.VITE_USE_FASTAPI === 'true';
```

**Consequência**:
- Se `VITE_USE_FASTAPI` não estiver definido, será `false`
- O hook `useAnalytics()` retorna vazio sem tentar buscar dados
- O dashboard mostra "Sem dados" mesmo que os dados existam no Supabase

**Solução**: Definir `VITE_USE_FASTAPI=true` no Vercel OU usar Supabase direto como fallback

---

### 4. ❌ **CORS CONFIGURADO INCORRETAMENTE**

**Arquivo**: `api/main.py`

**Problema**:
```python
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", default_origins)
# default_origins só tem localhost
```

**Consequência**:
- Se `ALLOWED_ORIGINS` não estiver configurado no Railway/Vercel, só aceita localhost
- Requests do frontend (Vercel) para o backend (Railway) serão bloqueados por CORS
- Erro: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solução**: Garantir que `ALLOWED_ORIGINS` inclui a URL da Vercel no Railway

---

### 5. ❌ **API_BASE_URL FALLBACK INCORRETO**

**Arquivo**: `frontend/src/lib/api-client.ts`

**Problema**:
```typescript
const API_BASE_URL = isProduction
  ? (import.meta.env.VITE_API_URL || window.location.origin)  // ← Pode usar Vercel URL
  : (import.meta.env.VITE_API_URL || 'http://localhost:8000');
```

**Consequência**:
- Se `VITE_API_URL` não estiver definido na Vercel, usa `window.location.origin` (URL da Vercel)
- Mas a API está no Railway, não na Vercel
- Requests falharão com 404 ou erro de CORS

**Solução**: Garantir que `VITE_API_URL` está configurado corretamente OU melhorar fallback

---

### 6. ❌ **FALTA DE TRATAMENTO DE ERROS VISÍVEL**

**Problema**:
- Erros do Supabase são apenas logados no console
- Usuário não vê mensagem clara de erro
- Dashboard fica em loading infinito ou mostra "Sem dados"

**Solução**: Adicionar tratamento de erros e mensagens visíveis ao usuário

---

## ✅ CHECKLIST DE CORREÇÃO

### **FASE 1: Variáveis de Ambiente (Vercel)**

Configure no **Vercel Dashboard → Settings → Environment Variables**:

```env
# ✅ OBRIGATÓRIAS
VITE_SUPABASE_URL=https://fulklwarlfbttvbjubmw.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...  # Mesmo valor de ANON_KEY

# ✅ CRÍTICA: URL do backend (Railway)
VITE_API_URL=https://seu-backend.railway.app

# ✅ OPCIONAL: Feature flag
VITE_USE_FASTAPI=true  # Se usar FastAPI backend
```

### **FASE 2: Variáveis de Ambiente (Railway)**

Configure no **Railway Dashboard → Variables**:

```env
# ✅ OBRIGATÓRIAS
SUPABASE_URL=https://fulklwarlfbttvbjubmw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# ✅ CRÍTICA: CORS - URL do frontend (Vercel)
ALLOWED_ORIGINS=https://seu-frontend.vercel.app,https://www.seu-dominio.com

# ✅ OPCIONAL
ENVIRONMENT=production
DEBUG=false
```

### **FASE 3: Correções de Código**

1. ✅ Adicionar validação no cliente Supabase
2. ✅ Melhorar tratamento de erros
3. ✅ Adicionar fallback quando USE_FASTAPI não está definido
4. ✅ Melhorar logs de debug

---

## 🔧 CORREÇÕES IMPLEMENTADAS

Ver arquivos corrigidos:
- `frontend/src/integrations/supabase/client.ts` - Validação de variáveis
- `frontend/src/hooks/useMarketData.ts` - Melhor tratamento de erros
- `frontend/src/lib/api-client.ts` - Validação de API_BASE_URL

---

## 🧪 TESTES PÓS-CORREÇÃO

### 1. Testar Cliente Supabase
```javascript
// No console do navegador (produção)
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.substring(0, 20));
```

### 2. Testar API Backend
```bash
curl https://seu-backend.railway.app/api/health
# Deve retornar: {"status": "online", ...}
```

### 3. Testar CORS
```bash
curl -H "Origin: https://seu-frontend.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://seu-backend.railway.app/api/health
# Deve retornar headers CORS corretos
```

### 4. Testar Dashboard
1. Abrir https://seu-frontend.vercel.app
2. Fazer login
3. Verificar se dados carregam
4. Abrir DevTools → Console → Verificar erros
5. Abrir DevTools → Network → Verificar requests para Supabase

---

## 📊 DIAGNÓSTICO RÁPIDO

### Se o dashboard não carrega dados:

1. **Verificar Console do Navegador**:
   - ❌ `Supabase URL is not defined` → Variável `VITE_SUPABASE_URL` não configurada
   - ❌ `Supabase Key is not defined` → Variável `VITE_SUPABASE_PUBLISHABLE_KEY` não configurada
   - ❌ `CORS error` → `ALLOWED_ORIGINS` não inclui URL da Vercel
   - ❌ `404 Not Found` → `VITE_API_URL` aponta para URL incorreta

2. **Verificar Network Tab**:
   - Requests para `*.supabase.co` retornam 401/403? → Chave inválida
   - Requests para `*.supabase.co` retornam 404? → URL incorreta
   - Requests para backend retornam CORS? → `ALLOWED_ORIGINS` incorreto

3. **Verificar Logs do Railway**:
   - Erros de conexão com Supabase? → `SUPABASE_SERVICE_ROLE_KEY` incorreta
   - Erros CORS? → `ALLOWED_ORIGINS` não configurado

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Aplicar correções de código (já implementadas)
2. ⏳ Configurar variáveis de ambiente na Vercel
3. ⏳ Configurar variáveis de ambiente no Railway
4. ⏳ Fazer redeploy
5. ⏳ Testar em produção
6. ⏳ Monitorar logs

---

**Última atualização**: 25 Janeiro 2026
