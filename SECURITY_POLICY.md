# Política de Segurança - Agro Data Navigator

## 🔒 Implementações de Segurança

### 1. Autenticação e Autorização
- ✅ **Supabase Auth**: Autenticação JWT-based
- ✅ **Validação de Token**: Todos os endpoints protegidos validam JWT via `get_user_from_request()`
- ✅ **RLS (Row Level Security)**: Políticas do Supabase protegem dados no banco
- ✅ **Roles**: Sistema de roles (admin, gestor, analista) com controle de acesso

### 2. Validação de Entrada
- ✅ **Sanitização de Strings**: Remove SQL injection, XSS, null bytes
- ✅ **Validação de Email**: Regex RFC-compliant, normalização lowercase
- ✅ **Validação de Data**: Formato YYYY-MM-DD obrigatório
- ✅ **Validação de Range Numérico**: Min/max para parâmetros numéricos
- ✅ **Validação de Senha Forte**:
  - Mínimo 8 caracteres
  - Requer: maiúscula, minúscula, número
  - Bloqueia senhas comuns (password123, 12345678, etc.)

### 3. Headers de Segurança (HTTP)
- ✅ **X-Content-Type-Options**: nosniff
- ✅ **X-Frame-Options**: DENY (protege contra clickjacking)
- ✅ **X-XSS-Protection**: 1; mode=block
- ✅ **Content-Security-Policy**: Restrições de conteúdo
- ✅ **Strict-Transport-Security**: HTTPS obrigatório

### 4. Rate Limiting
- ✅ **100 requests / 60 segundos** por IP (padrão)
- ✅ **Redis-backed** quando disponível
- ✅ **In-memory fallback** para ambientes sem Redis
- ✅ **Headers de resposta**: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset

### 5. CORS (Cross-Origin Resource Sharing)
- ✅ **Origens configuráveis** via `ALLOWED_ORIGINS`
- ✅ **Credenciais permitidas**: `allow_credentials=True`
- ✅ **Métodos explícitos**: GET, POST, PUT, DELETE, OPTIONS
- ✅ **Headers específicos**: Content-Type, Authorization

### 6. Proteção de Credentials
- ✅ **Environment Variables**: Todas as chaves em variáveis de ambiente
- ✅ **Sem logging de secrets**: Credentials não aparecem em logs
- ✅ **Service Role Key**: Usado apenas no backend (NUNCA no frontend)
- ✅ **Publishable Key**: Frontend usa chave pública (anon key) com RLS

### 7. Endpoints Protegidos
Todos os endpoints requerem autenticação exceto:
- `/api/health` (healthcheck)
- `/api/` (root info)
- `/api/docs` (apenas em development)

## 🔐 Chaves e Secrets

### Backend (Python/FastAPI)
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # ⚠️ NUNCA exponha
```

### Frontend (React/Vite)
```env
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...  # ✅ Seguro para frontend (RLS protege)
```

## 🛡️ Melhores Práticas Aplicadas

1. **Princípio do Menor Privilégio**:
   - Frontend usa chave pública (anon key)
   - Backend usa service role apenas quando necessário
   - RLS policies protegem dados por usuário

2. **Defense in Depth**:
   - Validação no frontend (UX)
   - Validação no backend (segurança)
   - RLS no banco (última linha de defesa)

3. **Input Sanitization**:
   - Regex patterns para SQL injection
   - Remoção de tags HTML/JavaScript
   - Normalização de emails

4. **Output Encoding**:
   - JSON responses com tipos corretos
   - Headers de segurança em todas respostas

5. **Error Handling**:
   - Mensagens genéricas para usuário
   - Logs detalhados apenas no servidor
   - Stack traces apenas em development

## 📋 Checklist de Segurança

### Antes do Deploy
- [ ] Rotacionar SUPABASE_SERVICE_ROLE_KEY
- [ ] Configurar ALLOWED_ORIGINS com domínios específicos
- [ ] Desabilitar `/api/docs` em produção (ENVIRONMENT=production)
- [ ] Revisar políticas RLS no Supabase
- [ ] Testar rate limiting
- [ ] Validar CORS headers
- [ ] Verificar logs (sem secrets expostos)

### Após o Deploy
- [ ] Monitorar rate limit violations
- [ ] Auditar logs de autenticação
- [ ] Verificar uso de API
- [ ] Revisar policies de RLS periodicamente
- [ ] Testar endpoints com ferramentas de segurança

## 🚨 O Que NÃO Fazer

❌ **NUNCA commite arquivos .env no Git**
❌ **NUNCA exponha SUPABASE_SERVICE_ROLE_KEY no frontend**
❌ **NUNCA desabilite CORS em produção**
❌ **NUNCA desabilite validação de entrada**
❌ **NUNCA logue senhas ou tokens completos**

## 📞 Reportando Vulnerabilidades

Se encontrar uma vulnerabilidade de segurança, por favor:
1. **NÃO** crie uma issue pública
2. Entre em contato diretamente com a equipe
3. Forneça detalhes do problema
4. Aguarde confirmação antes de divulgar

## 🔄 Rotação de Chaves

Recomendado a cada 90 dias:
1. Gerar nova Service Role Key no Supabase
2. Atualizar variável `SUPABASE_SERVICE_ROLE_KEY`
3. Testar todos os endpoints
4. Revogar chave antiga

## 📚 Recursos

- [OWASP Top 10](https://owasp.org/Top10/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui#security)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
