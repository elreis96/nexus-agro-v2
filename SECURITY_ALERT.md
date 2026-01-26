# 🚨 SECURITY ALERT - CREDENTIAL LEAK DETECTED

## ⚠️ AÇÃO IMEDIATA NECESSÁRIA

### **CREDENCIAIS EXPOSTAS NO GIT HISTORY**

As seguintes credenciais do Supabase foram detectadas no arquivo `.env` que estava sendo rastreado pelo Git:

```
SUPABASE_SERVICE_ROLE_KEY=sb_secret_as6sj6YrIBd9rL9X3yt_PQ_VVTY7xgt
VITE_SUPABASE_ANON_KEY=sb_publishable_Fal2EB7kLLmB9JzCQCCxxQ_ThYyo98g
```

---

## 🔐 PASSOS CRÍTICOS DE RECUPERAÇÃO (EXECUTE AGORA)

### **1. REGENERE AS CREDENCIAIS DO SUPABASE**

1. Acesse: https://supabase.com/dashboard/project/fulklwarlfbttvbjubmw/settings/api
2. Clique em "Rotate Keys" para:
   - `anon/public` key
   - `service_role` key
3. Salve as novas chaves em arquivo seguro LOCAL (NÃO COMMITE)

---

### **2. ATUALIZE AS VARIÁVEIS DE AMBIENTE**

#### **Vercel (Frontend)**
```bash
vercel env add VITE_SUPABASE_URL production
# Cole: https://fulklwarlfbttvbjubmw.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Cole: [NOVA_ANON_KEY_GERADA]

vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production
# Cole: [NOVA_ANON_KEY_GERADA]

vercel env add VITE_API_URL production
# Cole: https://[SUA_URL_VERCEL]/api
```

#### **Railway (Backend - se usar)**
```bash
railway variables set SUPABASE_SERVICE_ROLE_KEY=[NOVA_SERVICE_ROLE_KEY]
railway variables set SUPABASE_URL=https://fulklwarlfbttvbjubmw.supabase.co
railway variables set ALLOWED_ORIGINS=https://[SUA_URL_VERCEL]
```

---

### **3. ATUALIZE SEU .env LOCAL (NÃO COMMITE)**

Crie um novo `.env` local com as novas credenciais:

```dotenv
# --- SUPABASE ---
SUPABASE_URL=https://fulklwarlfbttvbjubmw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[NOVA_SERVICE_ROLE_KEY]

# --- FRONTEND ---
VITE_SUPABASE_URL=https://fulklwarlfbttvbjubmw.supabase.co
VITE_SUPABASE_ANON_KEY=[NOVA_ANON_KEY]
VITE_SUPABASE_PUBLISHABLE_KEY=[NOVA_ANON_KEY]
VITE_API_URL=https://[SUA_URL_VERCEL]/api

# --- BACKEND ---
ALLOWED_ORIGINS=https://[SUA_URL_VERCEL],http://localhost:5173
ENVIRONMENT=production
DEBUG=False
```

---

### **4. VERIFIQUE QUE .env ESTÁ NO .gitignore**

✅ **VERIFICADO**: `.env` já está no `.gitignore`

---

## 📊 STATUS DA LIMPEZA

### ✅ Ações Completadas
- [x] Removido `.env` do Git history (via git filter-branch)
- [x] Executado `git reflog expire` e `git gc --aggressive`
- [x] Confirmado `.env` no `.gitignore`
- [x] Deletado duplicação de pastas (src/, backend/)
- [x] Corrigido API_BASE_URL em api-client.ts
- [x] Corrigido CORS headers em api/main.py
- [x] Adicionado suporte HTTP/2 (httpx, Procfile)
- [x] Atualizado dependencies (requirements.txt)

### ⏳ Ações Pendentes (VOCÊ DEVE FAZER)
- [ ] **REGENERAR credenciais no Supabase Dashboard**
- [ ] **ATUALIZAR variáveis de ambiente na Vercel**
- [ ] **ATUALIZAR variáveis de ambiente no Railway (se aplicável)**
- [ ] **CRIAR novo .env local com novas credenciais**
- [ ] **TESTAR build localmente com novas credenciais**
- [ ] **FAZER DEPLOY na Vercel/Railway**

---

## 🔍 PRÓXIMOS PASSOS

1. **AGORA**: Regenere as credenciais do Supabase
2. **AGORA**: Atualize Vercel/Railway com novas credenciais
3. **DEPOIS**: Teste localmente (`npm run dev` no frontend)
4. **DEPOIS**: Teste build (`npm run build` no frontend)
5. **DEPOIS**: Deploy para produção

---

## 📝 NOTAS IMPORTANTES

- **NUNCA** commite arquivos `.env` novamente
- Use `.env.example` ou `.env.local.example` para documentar variáveis necessárias (com valores FAKE)
- Para desenvolvimento local, use `.env.local` (ignorado pelo Git)
- Para produção, use variáveis de ambiente da plataforma (Vercel/Railway)

---

## 🔗 LINKS ÚTEIS

- Supabase API Settings: https://supabase.com/dashboard/project/fulklwarlfbttvbjubmw/settings/api
- Vercel Environment Variables: https://vercel.com/docs/projects/environment-variables
- Railway Variables: https://docs.railway.app/guides/variables
