# ❓ FAQ - Perguntas Frequentes

## 📊 Power BI + Supabase

### ✅ SIM, você consegue usar o Supabase no Power BI!

Supabase é baseado em **PostgreSQL**, então você tem 3 opções para conectar:

#### **Opção 1: Conexão Direta PostgreSQL (Recomendada)**

1. No Power BI Desktop, vá em: **Obter Dados** > **Banco de Dados** > **PostgreSQL**

2. Configure a conexão:
   ```
   Servidor: db.seu-projeto.supabase.co
   Porta: 5432
   Banco de dados: postgres
   ```

3. Credenciais (encontre no Supabase Dashboard > Settings > Database):
   ```
   Usuário: postgres
   Senha: [sua senha do projeto]
   ```

4. **IMPORTANTE**: Configurar SSL/TLS:
   - Modo SSL: **Require**
   - Isso garante conexão segura

5. Selecione as tabelas:
   - ✅ `dim_calendario`
   - ✅ `fact_mercado`
   - ✅ `fact_clima`
   - ✅ Views analíticas (`view_volatilidade_mensal`, `view_correlacao_dolar_jbs`, `view_lag_chuva_60d_boi`)

#### **Opção 2: API REST (via Power Query)**

Se preferir usar a API REST do Supabase:

```powerquery
let
    Source = Json.Document(Web.Contents(
        "https://seu-projeto.supabase.co/rest/v1/fact_mercado",
        [
            Headers=[
                #"apikey"="sua-anon-key",
                #"Authorization"="Bearer sua-anon-key"
            ]
        ]
    )),
    ToTable = Table.FromList(Source, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    ExpandedRecords = Table.ExpandRecordColumn(ToTable, "Column1", 
        {"data_fk", "valor_dolar", "valor_jbs", "valor_boi_gordo"})
in
    ExpandedRecords
```

#### **Opção 3: Exportar para CSV e importar**

Menos ideal, mas funciona:
```sql
-- Execute no SQL Editor do Supabase
COPY (SELECT * FROM fact_mercado) TO '/tmp/mercado.csv' WITH CSV HEADER;
```

### 🎯 Modelagem no Power BI

Depois de conectar, criar relacionamentos:

```
DIM_CALENDARIO (1) ──────┬────── (*) FACT_MERCADO
    data_pk              └────── (*) FACT_CLIMA
                                     data_fk
```

**DAX para Volatilidade**:
```dax
Volatilidade Boi = 
VAR MaxBoi = MAX(fact_mercado[valor_boi_gordo])
VAR MinBoi = MIN(fact_mercado[valor_boi_gordo])
VAR MediaBoi = AVERAGE(fact_mercado[valor_boi_gordo])
RETURN
DIVIDE(MaxBoi - MinBoi, MediaBoi) * 100
```

---

## 🐍 Virtual Environment (venv) vs Global

### ✅ venv É A MELHOR PRÁTICA (você fez certo!)

#### **Por que usar venv?**

1. **Isolamento de Dependências**
   ```
   Projeto A: pandas 1.5.0
   Projeto B: pandas 2.0.0
   
   Com venv: ✅ Cada projeto tem sua versão
   Global:   ❌ Conflito! Só pode ter uma versão
   ```

2. **Evita "Dependency Hell"**
   - Cada projeto tem suas próprias bibliotecas
   - Não polui o Python global do sistema
   - Facilita deploy (basta copiar `requirements.txt`)

3. **Reprodutibilidade**
   ```bash
   # Outro dev pode recriar exatamente seu ambiente
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Segurança**
   - Python global geralmente requer permissões admin
   - venv roda como usuário normal

#### **Como gerenciar venv no seu projeto**

**Ativar ambiente:**
```powershell
# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# Se der erro de ExecutionPolicy:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Instalar pacotes:**
```bash
# Com venv ativo
pip install pandas supabase python-dotenv yfinance

# Salvar dependências
pip freeze > requirements.txt
```

**Desativar:**
```bash
deactivate
```

#### **Quando usar instalação global?**

Apenas para ferramentas CLI que você usa em todos os projetos:
```bash
# Instalar globalmente (sem venv)
pip install --user black flake8 pylint
```

---

## 📈 Plotly vs Recharts

### ❌ Não está usando Plotly

Seu projeto usa **Recharts** (biblioteca React):

```json
"recharts": "^2.15.4"
```

### Comparação:

| Feature | Recharts (atual) | Plotly |
|---------|------------------|--------|
| Framework | React nativo | React wrapper |
| Bundle size | ~400KB | ~3MB |
| Performance | ⚡ Rápido | 🐌 Mais pesado |
| Customização | 🎨 Excelente | 🎨 Excelente |
| Interatividade | ✅ Boa | ✅ Excelente |
| TypeScript | ✅ Nativo | ⚠️ Tipos via @types |

### Por que Recharts é melhor para este projeto:

1. **Mais leve**: 400KB vs 3MB do Plotly
2. **Integração React**: Componentes nativos React
3. **TypeScript**: Tipos nativos, não precisa de @types
4. **Suficiente para o caso**: Boxplot, Scatter, Line charts estão implementados

### Gráficos implementados com Recharts:

```tsx
// 1. Volatilidade (Boxplot)
<VolatilityBoxplot data={volatilidade} />

// 2. Correlação (Scatter)
<CorrelationScatter data={correlacao} />

// 3. Lag Climático (Line Chart)
<ClimateLagChart data={lagChuva} />
```

### Se realmente precisar de Plotly:

```bash
npm install react-plotly.js plotly.js
npm install -D @types/react-plotly.js
```

Mas **não recomendado** - Recharts já atende perfeitamente! ✨

---

## 🌡️ APIs em Tempo Real Implementadas

### ✅ OpenMeteo (Clima)

**Endpoint**: `GET /api/realtime/weather`

```typescript
// Exemplo de uso
const weather = await apiClient.getRealtimeWeather();
console.log(weather);
// {
//   current: { temperature: 32.5, precipitation: 2.1 },
//   location: { name: "Mato Grosso" }
// }
```

**Features**:
- ✅ Grátis, sem API key
- ✅ Dados em tempo real
- ✅ Previsão de 7 dias
- ✅ Salva automaticamente no banco

### ✅ Yahoo Finance (JBS)

**Endpoint**: `GET /api/realtime/market`

```typescript
const market = await apiClient.getRealtimeMarket();
console.log(market.market.jbs);
// { value: 38.45, ticker: "JBSS3.SA", source: "Yahoo Finance" }
```

**Features**:
- ✅ Cotação B3 em tempo real
- ✅ Ticker: JBSS3.SA
- ✅ Atualização automática

### ✅ Banco Central (Dólar)

**API**: PTAX oficial

```typescript
console.log(market.market.dolar);
// { value: 5.3829, currency: "BRL", source: "Banco Central" }
```

**Features**:
- ✅ Cotação oficial PTAX
- ✅ API pública do BCB
- ✅ Fallback se API estiver offline

### ⚠️ CEPEA (Boi Gordo)

**Status**: Não tem API pública

**Solução atual**: Usa última cotação do cache (banco de dados)

**Alternativas**:
1. Web scraping do site CEPEA (complexo, pode quebrar)
2. Atualização manual diária
3. Usar dados históricos + projeção

---

## 🔄 Auto-Refresh no Dashboard

### Como funciona:

1. **Componente RealtimeDataPanel** criado
2. **Botão "Auto (5min)"** ativa refresh automático
3. **APIs são chamadas** a cada 5 minutos
4. **Dados são salvos** automaticamente no banco

### Usar no Dashboard:

```tsx
import { RealtimeDataPanel } from '@/components/RealtimeDataPanel';

// No seu Dashboard ou Admin:
<RealtimeDataPanel />
```

### Configuração do intervalo:

```tsx
// Em RealtimeDataPanel.tsx, linha ~40
const interval = setInterval(() => {
  fetchRealtimeData();
}, 5 * 60 * 1000); // 5 minutos (ajuste aqui)
```

---

## 🚀 Deploy e Produção

### Vercel (Frontend)
```bash
npm run build
vercel --prod
```

### Variáveis de ambiente:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica
VITE_USE_FASTAPI=true
VITE_API_URL=https://sua-api.com
```

### FastAPI (Backend)
```bash
# Opção 1: Railway.app (grátis)
railway up

# Opção 2: Render.com (grátis)
# Adicionar arquivo render.yaml

# Opção 3: Fly.io
fly deploy
```

---

## 📚 Recursos Adicionais

### Documentação útil:
- 📘 [Supabase Docs](https://supabase.com/docs)
- 📊 [Power BI PostgreSQL](https://learn.microsoft.com/pt-br/power-bi/connect-data/desktop-connect-postgresql)
- 🌦️ [OpenMeteo API](https://open-meteo.com/en/docs)
- 💹 [Yahoo Finance API](https://finance.yahoo.com/)
- 📈 [Recharts Docs](https://recharts.org/)
- 🐍 [venv Tutorial](https://docs.python.org/3/tutorial/venv.html)

### Scripts úteis:

**Atualizar dados manualmente:**
```bash
python scripts/data_fetcher.py
```

**Rodar ETL completo:**
```bash
python scripts/etl_pipeline.py
```

**Ver logs do backend:**
```bash
cd api
uvicorn main:app --reload --log-level debug
```

---

## ✅ Checklist de Produção

- [ ] Variáveis de ambiente configuradas
- [ ] SSL/TLS habilitado no Supabase
- [ ] Rate limiting configurado na API
- [ ] Backup automático do banco (Supabase faz automaticamente)
- [ ] Monitoramento de erros (Sentry, Rollbar)
- [ ] CORS configurado corretamente
- [ ] Autenticação JWT funcionando
- [ ] Row Level Security (RLS) ativado no Supabase
- [ ] API keys em variáveis de ambiente (nunca no código)
- [ ] Build otimizado (`npm run build`)

---

**Dúvidas?** Verifique os logs do backend e frontend. A maioria dos erros está documentada no console! 🐛
