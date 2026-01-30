# 🚨 GUIA DE REMEDIAÇÃO - SECURITY INCIDENT

**Data do Incidente**: 30 de Janeiro de 2026  
**Tipo**: Supabase Service Role JWT exposta no GitHub  
**Gravidade**: 🔴 CRÍTICA  
**Status**: 🚧 Em Remediação

---

## ⚠️ O QUE ACONTECEU

A **Service Role Key** do Supabase foi exposta no repositório público `elreis96/nexus-agro-v2`:
- **Arquivo**: `check_user.py` (linha 5)
- **Commit**: Pushed em 23 Jan 2026, 06:26:50 UTC
- **Detectado por**: GitGuardian

**Impacto**: Esta chave dá acesso administrativo total ao banco de dados, incluindo:
- ✅ Bypass de Row Level Security (RLS)
- ✅ Leitura/escrita em todas as tabelas
- ✅ Modificação de schemas
- ✅ Acesso a dados de usuários

---

## ✅ CORREÇÕES APLICADAS

### 1. Código Corrigido ✅
- [x] Removida credencial hardcoded de `check_user.py`
- [x] Implementado carregamento via variáveis de ambiente
- [x] Adicionada validação de credenciais

### 2. .gitignore Atualizado ✅
- [x] Adicionados padrões `.env*`
- [x] Adicionadas pastas de virtual environments
- [x] Proteção contra futuros commits de credenciais

### 3. Template de Ambiente Criado ✅
- [x] Criado `.env.example` com variáveis necessárias

---

## 🚨 AÇÕES URGENTES NECESSÁRIAS (FAÇA AGORA!)

### 1️⃣ **REVOGAR A CHAVE COMPROMETIDA** (Mais Urgente!)

**⏱️ Faça isso IMEDIATAMENTE!**

1. Acesse: https://supabase.com/dashboard/project/fulklwarlfbttvbjubmw/settings/api
2. Vá em **Settings** → **API**
3. Role até **Service Role Key**
4. Clique em **Reset Service Role Key**
5. **Confirme** a revogação
6. **Copie a nova chave** gerada

> ⚠️ **IMPORTANTE**: Até fazer isso, qualquer pessoa pode acessar seu banco de dados!

---

### 2️⃣ **LIMPAR HISTÓRICO DO GIT**

A chave ainda está no histórico do repositório. Opções:

#### Opção A: BFG Repo-Cleaner (Recomendado)

```powershell
# 1. Baixar BFG
# https://rtyley.github.io/bfg-repo-cleaner/

# 2. Criar arquivo com a chave a ser removida
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1bGtsd2FybGZidHR2Ymp1Ym13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzU4MTYxNCwiZXhwIjoyMDUzMTU3NjE0fQ.zEpsjJbD4SObywgf1MgVzpJ-v14H9-cYE2zfmfWqnSo" > secrets.txt

# 3. Fazer backup
git clone --mirror git@github.com:elreis96/nexus-agro-v2.git backup-repo.git

# 4. Limpar repositório
java -jar bfg.jar --replace-text secrets.txt nexus-agro-v2.git

# 5. Garbage collection
cd nexus-agro-v2.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 6. Force push (CUIDADO!)
git push --force
```

#### Opção B: git filter-repo (Alternativa)

```powershell
# 1. Instalar
pip install git-filter-repo

# 2. Filtrar arquivo
git filter-repo --invert-paths --path check_user.py

# 3. Force push
git push --force --all
```

#### Opção C: Recriar Repositório (Mais Simples)

```powershell
# 1. Fazer backup do código atual
cd ..
cp -r agro-data-navigator agro-data-navigator-backup

# 2. Deletar .git
cd agro-data-navigator
Remove-Item -Recurse -Force .git

# 3. Inicializar novo repositório
git init
git add .
git commit -m "Initial commit - security remediation"

# 4. Criar novo repositório no GitHub (ou forçar push)
git remote add origin git@github.com:elreis96/nexus-agro-v2.git
git push -u --force origin main
```

---

### 3️⃣ **CONFIGURAR VARIÁVEIS DE AMBIENTE**

#### Local (.env)

Crie o arquivo `.env` na raiz:

```env
SUPABASE_URL=https://fulklwarlfbttvbjubmw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<NOVA_CHAVE_GERADA_NO_PASSO_1>
SUPABASE_ANON_KEY=<sua-anon-key>
```

#### Railway (Backend)

```env
SUPABASE_URL=https://fulklwarlfbttvbjubmw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<NOVA_CHAVE_GERADA_NO_PASSO_1>
ALLOWED_ORIGINS=https://seu-frontend.vercel.app
ENVIRONMENT=production
```

#### Vercel (Frontend) - NÃO PRECISA DE SERVICE ROLE!

```env
VITE_SUPABASE_URL=https://fulklwarlfbttvbjubmw.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-anon-key>
VITE_SUPABASE_PUBLISHABLE_KEY=<sua-publishable-key>
VITE_API_URL=https://seu-backend.railway.app
```

---

### 4️⃣ **VERIFICAR OUTROS ARQUIVOS**

Execute este comando para procurar por outras possíveis exposições:

```powershell
# Procurar por padrões de JWT
git grep -i "eyJ" --cached

# Procurar por padrões de service role
git grep -i "service.role" --cached
git grep -i "service_role" --cached
```

---

## 🔒 PREVENÇÃO FUTURA

### 1. Git Hooks (Pre-commit)

Instale o `pre-commit` para prevenir commits de secrets:

```powershell
pip install pre-commit

# Criar .pre-commit-config.yaml
```

```yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
```

```powershell
pre-commit install
```

### 2. GitGuardian (Já Instalado ✅)

Continue usando o GitGuardian para monitoramento contínuo.

### 3. Boas Práticas

- ✅ **NUNCA** faça hardcode de credenciais
- ✅ Sempre use variáveis de ambiente
- ✅ Mantenha `.env` no `.gitignore`
- ✅ Use `.env.example` para templates
- ✅ Rotacione credenciais regularmente
- ✅ Use diferentes credenciais para dev/prod

---

## 📋 CHECKLIST DE REMEDIAÇÃO

- [ ] **URGENTE**: Revogar Service Role Key no Supabase
- [ ] **URGENTE**: Gerar nova Service Role Key
- [x] Remover credencial do código
- [x] Atualizar .gitignore
- [x] Criar .env.example
- [ ] Limpar histórico do Git (BFG/filter-repo/recriar)
- [ ] Configurar .env local
- [ ] Atualizar variáveis no Railway
- [ ] Verificar se Vercel não tem Service Role Key
- [ ] Instalar pre-commit hooks
- [ ] Fazer audit de outros possíveis secrets
- [ ] Commit e push das correções
- [ ] Fechar alerta no GitGuardian
- [ ] Documentar lição aprendida

---

## 🆘 SUPORTE

Se precisar de ajuda:

1. **Supabase Support**: https://supabase.com/dashboard/support
2. **GitGuardian Docs**: https://docs.gitguardian.com/
3. **BFG Repo-Cleaner**: https://rtyley.github.io/bfg-repo-cleaner/

---

## 📝 LIÇÕES APRENDIDAS

1. ❌ **Erro**: Hardcodear Service Role Key em scripts de teste
2. ✅ **Solução**: Sempre usar variáveis de ambiente
3. ✅ **Melhoria**: Implementar pre-commit hooks
4. ✅ **Melhoria**: Revisar código antes de commits

---

**Data de Criação**: 30 Jan 2026  
**Última Atualização**: 30 Jan 2026  
**Status**: 🚧 Aguardando revogação de chave pelo usuário
