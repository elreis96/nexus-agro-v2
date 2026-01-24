# 🔒 Segurança - AgroData Nexus

## Resumo das Implementações de Segurança

### 1. Autenticação e Autorização

#### JWT Token Authentication
- **Implementação**: Função `verify_token()` em `api/main.py`
- **Proteções**:
  - Validação obrigatória de header `Authorization`
  - Verificação de formato `Bearer {token}`
  - Validação de tamanho mínimo do token (>20 caracteres)
  - Integração com Supabase Auth para validação de usuário
  - Mensagens de erro genéricas para não expor detalhes do sistema

```python
def verify_token(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format")
    
    try:
        token = authorization.replace("Bearer ", "").strip()
        
        if not token or len(token) < 20:
            raise HTTPException(status_code=401, detail="Invalid token format")
        
        response = supabase.auth.get_user(token)
        if not response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return response.user
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [Auth] Token validation error: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")
```

### 2. Rate Limiting

#### Implementação com SlowAPI
- **Biblioteca**: `slowapi`
- **Configuração Global**: Limite por IP usando `get_remote_address`

**Limites por Endpoint**:
- `/api/notifications` (GET): **60 requisições/minuto**
- `/api/notifications/{id}` (DELETE): **60 requisições/minuto**
- `/api/import/climate` (POST): **10 requisições/hora**
- `/api/import/market` (POST): **10 requisições/hora**
- `/api/analytics/*` (GET): **600 requisições/minuto**
- `/api/realtime/weather` (GET): **30 requisições/minuto**
- `/api/realtime/market` (GET): **30 requisições/minuto**

### 3. CORS (Cross-Origin Resource Sharing)

#### Configuração Segura
```python
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:8080,http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Apenas origins específicas
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Métodos limitados
    allow_headers=["Content-Type", "Authorization"],  # Headers limitados
    expose_headers=["Content-Length", "Content-Type"],
    max_age=3600,  # Cache de preflight por 1 hora
)
```

**Configuração para Produção**:
```env
ALLOWED_ORIGINS=https://agro-data-navigator.vercel.app,https://www.seudomain.com
```

### 4. Validação de Inputs

#### Endpoints de Notificações
- **`GET /api/notifications`**:
  - Validação de limite: `1 <= limit <= 100`
  
- **`DELETE /api/notifications/{notification_id}`**:
  - Validação: `notification_id >= 1`

#### Endpoints de Analytics
- **`/api/analytics/volatility`**, **`/api/analytics/correlation`**, **`/api/analytics/lag`**:
  - Validação de formato de data (YYYY-MM-DD)
  - Validação de `lag_days`: `0 <= lag_days <= 365`

```python
# Validação de formato de data
if start_date:
    try:
        pd.to_datetime(start_date)
    except:
        raise HTTPException(status_code=400, detail="Invalid start_date format (use YYYY-MM-DD)")
```

#### Endpoints de Upload CSV
- **Validação de tipo de arquivo**: Apenas `.csv`
- **Validação de tamanho**: Máximo **10MB**
- **Validação de MIME type**: `text/csv`, `application/csv`, `text/plain`
- **Validação de tipo**: Apenas `'mercado'` ou `'clima'`

```python
# Validação de segurança: tipo de arquivo
if not file.filename or not file.filename.endswith('.csv'):
    raise HTTPException(status_code=400, detail="Only CSV files are allowed")

# Validação de segurança: tamanho do arquivo (máx 10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
contents = await file.read()
if len(contents) > MAX_FILE_SIZE:
    raise HTTPException(status_code=413, detail="File too large (max 10MB)")
```

### 5. Proteção contra SQL Injection

- **Supabase Client**: Todas as queries usam o client oficial do Supabase que sanitiza inputs automaticamente
- **Pandas DataFrame**: Dados CSV são processados via pandas antes de inserção
- **Parametrização**: Todas as queries usam parametrização ao invés de concatenação de strings

### 6. Headers de Segurança Recomendados

Para **produção**, adicione middleware de headers de segurança:

```python
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware

# Apenas HTTPS em produção
if os.getenv("ENV") == "production":
    app.add_middleware(HTTPSRedirectMiddleware)

# Apenas hosts confiáveis
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*.vercel.app", "seudomain.com"]
)
```

### 7. Variáveis de Ambiente Sensíveis

**Nunca commitar no Git**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `ALLOWED_ORIGINS`

**Usar arquivo `.env`** (ignorado pelo `.gitignore`):
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:5173
ENV=development
```

### 8. Row Level Security (RLS) no Supabase

**Implementado no banco de dados Supabase**:
- Políticas RLS configuradas para `fact_mercado`, `fact_clima`, `notifications`
- Apenas usuários autenticados podem ler/escrever dados
- Usuários só podem deletar suas próprias notificações

### 9. Proteção contra DDoS

- **Rate Limiting**: SlowAPI protege contra requisições excessivas
- **Timeouts**: APIs externas têm timeout de 5-10 segundos
- **Limites de tamanho**: Upload de CSV limitado a 10MB

### 10. Logging e Auditoria

- **Logs estruturados**: Todas as operações críticas são logadas
- **Não logar credenciais**: Tokens e senhas nunca aparecem nos logs
- **Tabela de auditoria**: `audit_logs` registra todas as importações de CSV

```python
print(f"📊 [Correlation] Query done. Rows: {len(data)}")
print(f"❌ [Auth] Token validation error: {str(e)}")
```

---

## ✅ Checklist de Segurança para Produção

- [x] JWT Authentication implementada
- [x] Rate Limiting configurado
- [x] CORS restrito a origins específicas
- [x] Validação de inputs em todos os endpoints
- [x] Proteção contra SQL Injection
- [x] Validação de upload de arquivos
- [x] Variáveis de ambiente separadas
- [x] RLS habilitado no Supabase
- [ ] HTTPS obrigatório (configurar no deploy)
- [ ] Trusted Host Middleware (configurar no deploy)
- [ ] Security Headers (X-Frame-Options, CSP, etc.)
- [ ] Monitoramento de logs (Sentry, LogDNA)
- [ ] Backup automático do banco de dados
- [ ] Testes de penetração

---

## 🚨 Recomendações Adicionais

### Para Deploy em Produção:

1. **Habilitar HTTPS obrigatório**
2. **Configurar firewall do Supabase** para aceitar apenas IPs da aplicação
3. **Implementar monitoramento de segurança** (ex: Sentry)
4. **Configurar backup automático** do banco de dados
5. **Revisar políticas RLS** periodicamente
6. **Implementar 2FA** para usuários admin
7. **Adicionar CAPTCHA** em endpoints de login/registro
8. **Implementar header X-Content-Type-Options: nosniff**
9. **Implementar Content Security Policy (CSP)**
10. **Realizar auditorias de segurança** trimestrais

---

## 📞 Contato de Segurança

Para reportar vulnerabilidades de segurança, entre em contato através de:
- Email: security@agrodatanexus.com
- GitHub Security Advisory: [Criar report privado]

**Nunca reporte vulnerabilidades em issues públicas!**
