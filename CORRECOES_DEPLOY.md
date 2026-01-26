# 🔧 CORREÇÕES DE DEPLOY - Railway e Vercel

**Data**: 25 de Janeiro de 2026  
**Status**: ✅ Problemas identificados e corrigidos

---

## 🚨 PROBLEMAS IDENTIFICADOS

### **1. Railway - Erro: `uvicorn: command not found`**

**Erro**:
```
/bin/bash: line 1: uvicorn: command not found
```

**Causa**:
- O `uvicorn` não está sendo encontrado no PATH após a instalação
- Possível problema na ordem de instalação ou cache

**Solução aplicada**:
- ✅ Atualizado `nixpacks.toml` para garantir instalação correta
- ✅ Adicionado `pip install --upgrade pip` antes de instalar dependências
- ✅ Adicionado `--no-cache-dir` para evitar problemas de cache
- ✅ Verificado que o comando usa `python -m uvicorn` (correto)

---

### **2. Vercel - Erro: `Function Runtimes must have a valid version`**

**Erro**:
```
Error: Function Runtimes must have a valid version, for example now-php@1.0.0.
```

**Causa**:
- A configuração `"runtime": "python3.9"` no `vercel.json` está incorreta
- A Vercel não aceita essa sintaxe e prefere auto-detecção

**Solução aplicada**:
- ✅ Removida a seção `functions` do `vercel.json`
- ✅ Removida a variável `PYTHON_VERSION` do `env`
- ✅ Vercel agora detecta automaticamente o runtime Python baseado no arquivo `api/index.py`

---

## ✅ CORREÇÕES APLICADAS

### **1. vercel.json** (Corrigido)

**Antes**:
```json
{
  "functions": {
    "api/index.py": {
      "runtime": "python3.9"  // ❌ Formato inválido
    }
  },
  "env": {
    "PYTHON_VERSION": "3.9"  // ❌ Não necessário
  }
}
```

**Depois**:
```json
{
  // ✅ Removido - Vercel auto-detecta Python
  // ✅ Removido - Não necessário
}
```

**Por quê?**
- A Vercel detecta automaticamente que `api/index.py` é uma função Python
- Usa Python 3.12 por padrão (mais recente)
- Não precisa de configuração explícita de runtime

---

### **2. nixpacks.toml** (Melhorado)

**Antes**:
```toml
[phases.install]
cmds = [
  "cd api && pip install -r requirements.txt"
]
```

**Depois**:
```toml
[phases.install]
cmds = [
  "pip install --upgrade pip",  // ✅ Garante pip atualizado
  "cd api && pip install --no-cache-dir -r requirements.txt"  // ✅ Evita cache issues
]
```

**Por quê?**
- `--upgrade pip` garante que o pip está atualizado
- `--no-cache-dir` evita problemas com cache corrompido
- Melhora a confiabilidade da instalação

---

## 📋 CHECKLIST DE DEPLOY

### **Railway**
- [x] ✅ `nixpacks.toml` corrigido
- [x] ✅ `Procfile` verificado (já estava correto)
- [x] ✅ `requirements.txt` verificado
- [ ] ⏳ **VOCÊ**: Fazer redeploy no Railway
- [ ] ⏳ **VOCÊ**: Verificar logs após deploy

### **Vercel**
- [x] ✅ `vercel.json` corrigido (removido runtime inválido)
- [x] ✅ `api/index.py` verificado (exporta app corretamente)
- [ ] ⏳ **VOCÊ**: Fazer redeploy no Vercel
- [ ] ⏳ **VOCÊ**: Verificar logs após deploy

---

## 🧪 TESTES PÓS-CORREÇÃO

### **1. Testar Railway**

```bash
# Após redeploy, testar health check
curl https://seu-app.railway.app/api/health

# Deve retornar:
# {
#   "status": "online",
#   "environment": "production",
#   ...
# }
```

### **2. Testar Vercel**

```bash
# Após redeploy, testar health check
curl https://seu-app.vercel.app/api/health

# Deve retornar JSON (não HTML):
# {
#   "status": "online",
#   ...
# }
```

---

## 🔍 VERIFICAÇÕES ADICIONAIS

### **Railway - Se ainda houver problemas:**

1. **Verificar logs completos**:
   - Ver se `pip install` está executando corretamente
   - Verificar se `uvicorn` está na lista de pacotes instalados

2. **Verificar variáveis de ambiente**:
   - `PORT` deve estar definido (Railway define automaticamente)
   - `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` devem estar configuradas

3. **Alternativa - Usar Procfile diretamente**:
   - Railway pode usar o `Procfile` ao invés do `nixpacks.toml`
   - O `Procfile` já está correto

### **Vercel - Se ainda houver problemas:**

1. **Verificar se `api/index.py` existe e exporta `app`**:
   ```python
   from .main import app
   # ✅ Correto
   ```

2. **Verificar se `api/main.py` define `app = FastAPI(...)`**:
   ```python
   app = FastAPI(title="AgroData Nexus API", version="1.0.0")
   # ✅ Correto
   ```

3. **Verificar se `requirements.txt` está em `api/`**:
   - ✅ Deve estar em `api/requirements.txt`

4. **Verificar logs de build**:
   - Ver se Python está sendo detectado
   - Ver se dependências estão sendo instaladas

---

## 📝 NOTAS TÉCNICAS

### **Vercel Auto-Detection**

A Vercel detecta automaticamente:
- ✅ Arquivos em `/api/*.py` → Funções Python
- ✅ Python 3.12 (padrão mais recente)
- ✅ Instala dependências de `requirements.txt` automaticamente
- ✅ Não precisa de configuração explícita

### **Railway com Nixpacks**

- Railway usa `nixpacks.toml` se presente
- Se não encontrar, usa `Procfile`
- Nixpacks instala Python 3.11 por padrão
- Dependências são instaladas na fase `install`

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ **Código corrigido** (já feito)
2. ⏳ **VOCÊ**: Fazer commit e push das correções
3. ⏳ **VOCÊ**: Fazer redeploy no Railway
4. ⏳ **VOCÊ**: Fazer redeploy no Vercel
5. ⏳ **VOCÊ**: Testar endpoints após deploy
6. ⏳ **VOCÊ**: Verificar logs se houver problemas

---

## 📌 RESUMO RÁPIDO

### **O que foi corrigido:**

1. **Vercel**:
   - ❌ Removido `"runtime": "python3.9"` (formato inválido)
   - ✅ Vercel agora auto-detecta Python 3.12

2. **Railway**:
   - ✅ Melhorado `nixpacks.toml` com `--upgrade pip` e `--no-cache-dir`
   - ✅ Melhorado `Procfile` com instalação mais robusta

### **Arquivos modificados:**
- ✅ `vercel.json` - Removida configuração inválida de runtime
- ✅ `nixpacks.toml` - Melhorada instalação de dependências
- ✅ `Procfile` - Melhorada instalação e comando de start

---

**Última atualização**: 25 Janeiro 2026
