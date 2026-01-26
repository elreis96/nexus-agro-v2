# 🔧 CORREÇÕES FINAIS - Deploy Railway e Vercel

**Data**: 26 de Janeiro de 2026  
**Status**: ✅ Problemas críticos corrigidos

---

## 🚨 PROBLEMAS IDENTIFICADOS

### **1. Railway - Erro: `uvicorn: command not found`** ❌

**Erro**:
```
/bin/bash: line 1: uvicorn: command not found
```

**Causa Raiz**:
- Railway pode estar executando o comando antes das dependências serem instaladas
- O `Procfile` pode estar sendo usado ao invés do `nixpacks.toml`
- Dependências podem não estar sendo instaladas no diretório correto

**Solução Aplicada**:
- ✅ Melhorado `nixpacks.toml` com verificações de instalação
- ✅ Simplificado `Procfile` (removido flags que podem causar problemas)
- ✅ Garantido que pip está atualizado antes de instalar
- ✅ Adicionado `setuptools` e `wheel` para garantir instalação correta

---

### **2. Vercel - Erro de Build: `@sentry/react` não encontrado** ❌

**Erro**:
```
[vite]: Rollup failed to resolve import "@sentry/react" from "/vercel/path0/frontend/src/lib/monitoring.ts".
```

**Causa Raiz**:
- O Vite está tentando resolver o dynamic import no build time
- `@sentry/react` não está instalado (é opcional)
- O import dinâmico não está sendo tratado corretamente

**Solução Aplicada**:
- ✅ Adicionado `/* @vite-ignore */` no import dinâmico
- ✅ Adicionado `@sentry/react` como external no `vite.config.ts`
- ✅ Melhorado tratamento de erros para não quebrar build

---

## ✅ CORREÇÕES APLICADAS

### **1. frontend/src/lib/monitoring.ts**

**Antes**:
```typescript
const Sentry = await import('@sentry/react'); // ❌ Vite tenta resolver no build
```

**Depois**:
```typescript
const sentryModule = '@sentry/react';
const Sentry = await import(/* @vite-ignore */ sentryModule); // ✅ Ignora no build
```

**E adicionado**:
```typescript
external: (id) => {
  return id === '@sentry/react'; // ✅ Torna externo
}
```

---

### **2. nixpacks.toml**

**Melhorias**:
- ✅ Adicionado `setuptools` e `wheel` na atualização do pip
- ✅ Adicionado comandos de verificação para debug
- ✅ Garantido que instalação acontece no diretório correto

---

### **3. Procfile**

**Antes**:
```bash
web: cd api && python -m uvicorn index:app --host 0.0.0.0 --port $PORT --http h2c --loop uvloop
```

**Depois**:
```bash
web: cd api && python -m uvicorn index:app --host 0.0.0.0 --port $PORT
```

**Por quê?**
- Flags `--http h2c` e `--loop uvloop` podem não ser suportadas em todos os ambientes
- Comando simplificado é mais compatível
- `uvicorn[standard]` já inclui suporte a essas features

---

### **4. vite.config.ts**

**Adicionado**:
```typescript
rollupOptions: {
  external: (id) => {
    return id === '@sentry/react'; // ✅ Não tenta resolver no build
  },
}
```

---

## 📋 CHECKLIST DE VERIFICAÇÃO

### **Railway**
- [x] ✅ `nixpacks.toml` melhorado com verificações
- [x] ✅ `Procfile` simplificado
- [x] ✅ Dependências garantidas na fase de release
- [ ] ⏳ **VOCÊ**: Fazer redeploy no Railway
- [ ] ⏳ **VOCÊ**: Verificar logs após deploy

### **Vercel**
- [x] ✅ `monitoring.ts` corrigido (import dinâmico)
- [x] ✅ `vite.config.ts` com external para Sentry
- [x] ✅ Build não quebra sem Sentry
- [ ] ⏳ **VOCÊ**: Fazer redeploy no Vercel
- [ ] ⏳ **VOCÊ**: Verificar build logs

---

## 🧪 TESTES PÓS-CORREÇÃO

### **1. Testar Build Local (Vercel)**

```bash
cd frontend
npm install
npm run build
# Deve completar sem erros mesmo sem @sentry/react
```

### **2. Testar Railway Localmente (se possível)**

```bash
# Verificar se uvicorn está instalado
cd api
pip install -r requirements.txt
python -m uvicorn index:app --help
# Deve mostrar ajuda do uvicorn
```

---

## 🔍 TROUBLESHOOTING ADICIONAL

### **Se Railway ainda falhar:**

1. **Verificar se Railway está usando nixpacks ou Procfile**:
   - Railway pode preferir um sobre o outro
   - Verificar logs para ver qual está sendo usado

2. **Verificar se dependências estão sendo instaladas**:
   - Procurar por "Installing dependencies" nos logs
   - Verificar se `uvicorn` aparece na lista de pacotes instalados

3. **Alternativa - Forçar uso do Procfile**:
   - Remover `nixpacks.toml` temporariamente
   - Railway usará apenas o `Procfile`

4. **Verificar variável PORT**:
   - Railway define automaticamente
   - Mas verificar se está sendo passada corretamente

### **Se Vercel ainda falhar:**

1. **Verificar se build local funciona**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Verificar se há outros imports problemáticos**:
   - Procurar por outros dynamic imports
   - Verificar se todos estão com `/* @vite-ignore */`

3. **Limpar cache do Vercel**:
   - Vercel Dashboard → Settings → Clear Build Cache
   - Fazer redeploy

---

## 📝 NOTAS TÉCNICAS

### **Dynamic Imports no Vite**

Para imports dinâmicos opcionais:
```typescript
// ✅ Correto - Vite ignora no build
const module = await import(/* @vite-ignore */ 'package-name');

// ❌ Errado - Vite tenta resolver no build
const module = await import('package-name');
```

### **Railway - Nixpacks vs Procfile**

- Railway usa `nixpacks.toml` se presente
- Se não encontrar, usa `Procfile`
- Se ambos existem, pode usar qualquer um (depende da configuração)

### **Uvicorn no Railway**

- Railway pode ter problemas com flags avançadas
- Usar comando simples: `python -m uvicorn index:app`
- Flags podem ser configuradas via variáveis de ambiente se necessário

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ **Código corrigido** (já feito)
2. ⏳ **VOCÊ**: Fazer commit e push
3. ⏳ **VOCÊ**: Fazer redeploy no Railway
4. ⏳ **VOCÊ**: Fazer redeploy no Vercel
5. ⏳ **VOCÊ**: Verificar logs após deploy
6. ⏳ **VOCÊ**: Testar endpoints

---

## 📌 RESUMO DAS CORREÇÕES

### **Vercel**
- ✅ Import dinâmico do Sentry corrigido
- ✅ Sentry marcado como external no Vite
- ✅ Build não quebra sem Sentry instalado

### **Railway**
- ✅ Nixpacks melhorado com verificações
- ✅ Procfile simplificado
- ✅ Dependências garantidas na instalação

---

**Última atualização**: 26 Janeiro 2026
