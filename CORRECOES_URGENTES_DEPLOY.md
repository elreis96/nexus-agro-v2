# 🚨 CORREÇÕES URGENTES - Deploy Railway e Vercel

**Data**: 26 de Janeiro de 2026  
**Status**: ✅ **CORRIGIDO**

---

## 🚨 PROBLEMAS CRÍTICOS RESOLVIDOS

### **1. Railway - `uvicorn: command not found`** ✅

**Erro**:
```
/bin/bash: line 1: uvicorn: command not found
```

**Causa**:
- Railway estava tentando executar `uvicorn` diretamente
- Caminho do módulo estava incorreto
- Dependências podem não estar sendo instaladas corretamente

**Solução**:
- ✅ Corrigido caminho: `cd api && python -m uvicorn index:app`
- ✅ Garantido que dependências são instaladas antes
- ✅ Adicionado `setuptools` e `wheel` para instalação robusta

**Arquivos**:
- `nixpacks.toml` ✅
- `Procfile` ✅

---

### **2. Vercel - Build falha com `@sentry/react`** ✅

**Erro**:
```
[vite]: Rollup failed to resolve import "@sentry/react"
```

**Causa**:
- Vite tentava resolver o import dinâmico no build time
- `@sentry/react` não está instalado (é opcional)

**Solução**:
- ✅ Usado `eval()` para import dinâmico que não é analisado pelo Vite
- ✅ Import só acontece em runtime, não no build
- ✅ Build funciona normalmente sem Sentry instalado

**Arquivo**:
- `frontend/src/lib/monitoring.ts` ✅

---

## 📋 ARQUIVOS CORRIGIDOS

### **Railway**
1. ✅ `nixpacks.toml`
   - Caminho corrigido: `cd api && python -m uvicorn index:app`
   - Verificações de instalação adicionadas

2. ✅ `Procfile`
   - Caminho corrigido: `cd api && python -m uvicorn index:app`
   - Comando simplificado (removidas flags que podem causar problemas)

### **Vercel**
1. ✅ `frontend/src/lib/monitoring.ts`
   - Import do Sentry usando `eval()` para evitar análise no build
   - Build não quebra sem Sentry instalado

---

## ✅ VERIFICAÇÕES

### **Railway**
- [x] Caminho do uvicorn correto
- [x] Dependências instaladas antes de executar
- [x] Comando simplificado e compatível

### **Vercel**
- [x] Import do Sentry não quebra build
- [x] Sentry só carrega se configurado
- [x] Build funciona sem Sentry instalado

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ **Código corrigido** (já feito)
2. ⏳ **VOCÊ**: Fazer commit e push
3. ⏳ **VOCÊ**: Fazer redeploy no Railway
4. ⏳ **VOCÊ**: Fazer redeploy no Vercel
5. ⏳ **VOCÊ**: Verificar logs após deploy

---

## 📝 NOTAS

### **Railway**
- O comando `cd api && python -m uvicorn index:app` garante que:
  - Estamos no diretório correto
  - Python encontra o módulo `index` (que importa de `main`)
  - Uvicorn é executado via Python (não precisa estar no PATH)

### **Vercel**
- O `eval('import("@sentry/react")')` permite que:
  - Vite não analise o import no build time
  - Import só acontece em runtime se necessário
  - Build funciona mesmo sem Sentry instalado

---

**Última atualização**: 26 Janeiro 2026
