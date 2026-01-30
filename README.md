# 🚜 AgroData Nexus - Market Intelligence Platform

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-production-success.svg)

**Plataforma de inteligência de mercado para análise de commodities agropecuárias**

[Demo](https://seu-frontend.vercel.app) • [Documentação](#-documentação) • [API](#-api-backend) • [Roadmap](#-roadmap)

</div>

---

## 📋 Sobre o Projeto

**AgroData Nexus** é uma plataforma de inteligência de mercado desenvolvida para fundos de investimento no setor de agronegócio. O sistema integra dados climáticos, financeiros e de mercado para validar teses de investimento através de análises quantitativas robustas.

### 🎯 Caso de Uso Principal

Validação da tese: *"Eventos climáticos extremos no Mato Grosso impactam o preço da ação da JBS e do Boi Gordo com lag de 30-60 dias"*

**Cliente**: Verde Futuro Capital (Portfólio R$ 800M em ativos do agronegócio)

### ✨ Principais Funcionalidades

- 📊 **Dashboard Executivo** - KPIs em tempo real e análises visuais
- 🌡️ **Correlação Clima × Mercado** - Análise de impacto climático com lag temporal
- 📈 **Análise de Volatilidade** - Boxplots e distribuição de preços
- 💹 **Correlação Dólar × JBS** - Scatter plots e análise de correlação
- 🔔 **Alertas Inteligentes** - Notificações de eventos significativos
- 🔐 **Controle de Acesso** - RLS (Row Level Security) e autenticação via Supabase
- 📱 **Responsive Design** - Interface adaptativa para desktop e mobile

---

## 🏗️ Arquitetura

### Stack Tecnológica

#### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 6
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Charts**: Recharts
- **Deploy**: Vercel

#### Backend
- **API**: FastAPI + Uvicorn
- **Language**: Python 3.12
- **Database**: Supabase (PostgreSQL)
- **Caching**: Redis (opcional)
- **Deploy**: Railway

#### Data Warehouse
- **Schema**: Star Schema (Dimensional Modeling)
- **Database**: PostgreSQL + PostGIS
- **ETL**: Python (Pandas) + SQL Views
- **Security**: Row Level Security (RLS)

### Modelo de Dados (Star Schema)

```
┌─────────────────┐
│ DIM_CALENDARIO  │
│─────────────────│
│ data_pk (PK)    │◄────┐
│ ano             │     │
│ mes             │     │
│ is_business_day │     │
└─────────────────┘     │
                        │
┌─────────────────┐     │     ┌─────────────────┐
│  FACT_MERCADO   │     │     │   FACT_CLIMA    │
│─────────────────│     │     │─────────────────│
│ id (PK)         │     ├────►│ id (PK)         │
│ data_fk (FK)    │─────┘     │ data_fk (FK)    │
│ valor_dolar     │           │ chuva_mm        │
│ valor_jbs       │           │ temp_max        │
│ valor_boi_gordo │           │ localizacao     │
└─────────────────┘           └─────────────────┘
```

**Views Analíticas**:
- `vw_agro_daily` - Dados consolidados diários
- `view_volatilidade_mensal` - Estatísticas mensais (min, Q1, mediana, Q3, max)
- `view_correlacao_dolar_jbs` - Dados para scatter plot
- `view_lag_chuva_60d_boi` - Lag de 60 dias entre chuva e preço

---

## 📁 Estrutura do Projeto

```
agro-data-navigator/
├── frontend/                    # 🎨 Aplicação React (Vercel)
│   ├── src/
│   │   ├── components/          # Componentes reutilizáveis
│   │   │   ├── charts/          # Gráficos (Recharts)
│   │   │   ├── ExecutiveCard.tsx
│   │   │   └── MarketAlerts.tsx
│   │   ├── pages/               # Páginas da aplicação
│   │   │   └── Dashboard.tsx    # Dashboard principal
│   │   ├── hooks/               # Custom React Hooks
│   │   │   └── useMarketData.ts # Hook unificado de analytics
│   │   ├── integrations/        # Integrações externas
│   │   │   └── supabase/        # Cliente Supabase
│   │   ├── contexts/            # Contextos React
│   │   └── lib/                 # Utilitários
│   ├── public/                  # Assets estáticos
│   ├── package.json             # Dependências Node.js
│   ├── vercel.json              # Config Vercel
│   └── vite.config.ts           # Config Vite
│
├── api/                         # ⚡ Backend FastAPI (Railway)
│   ├── main.py                  # Aplicação FastAPI
│   ├── index.py                 # Entrypoint
│   ├── requirements.txt         # Dependências Python
│   ├── lib/
│   │   ├── security.py          # Validações e segurança
│   │   └── redis_client.py      # Cache Redis
│   └── tests/                   # Testes automatizados
│
├── supabase/                    # 🗄️ Database
│   ├── config.toml              # Config Supabase
│   └── migrations/              # Migrations SQL
│       └── 20260129_security_advisor_fixes.sql
│
├── scripts/                     # 🔧 ETL & Data Processing
│   ├── etl_pipeline.py          # Pipeline completo de ETL
│   ├── import_csv.py            # Importador de dados
│   └── data_fetcher.py          # Coleta de dados externos
│
├── csv/                         # 📊 Datasets
│   ├── finance_data.csv         # Dados financeiros
│   ├── weather_data.csv         # Dados climáticos
│   └── dados_agro.csv           # Dados consolidados
│
├── Procfile                     # Config Railway
├── nixpacks.toml                # Build config
└── requirements.txt             # Dependências Python (root)
```

---

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js 18+ e npm/yarn
- Python 3.12+
- Conta Supabase
- Git

### 1️⃣ Clone o Repositório

```bash
git clone https://github.com/seu-usuario/agro-data-navigator.git
cd agro-data-navigator
```

### 2️⃣ Configurar Frontend

```bash
cd frontend
npm install

# Criar .env.local
cat > .env.local << EOF
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publishable
VITE_API_URL=http://localhost:8000
VITE_USE_FASTAPI=true
EOF

# Executar em desenvolvimento
npm run dev
```

Acesse: http://localhost:5173

### 3️⃣ Configurar Backend

```bash
# Voltar para raiz
cd ..

# Instalar dependências
pip install -r api/requirements.txt

# Criar .env
cat > .env << EOF
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
SUPABASE_ANON_KEY=sua-chave-anon
ALLOWED_ORIGINS=http://localhost:5173
ENVIRONMENT=development
EOF

# Executar API
python -m uvicorn api.index:app --reload --host 0.0.0.0 --port 8000
```

Acesse: http://localhost:8000/api/docs (Swagger UI)

### 4️⃣ Configurar Database (Supabase)

```bash
# Aplicar migrations
cd supabase/migrations

# Execute as migrations em ordem no Supabase SQL Editor
# ou use a CLI do Supabase:
supabase db push
```

### 5️⃣ Carregar Dados (ETL)

```bash
# Executar pipeline ETL
python scripts/etl_pipeline.py

# Ou importar CSVs diretamente
python scripts/import_csv.py
```

---

## 🌐 Deploy em Produção

### Deploy Frontend (Vercel)

1. **Conectar Repositório no Vercel**
   - Acesse [vercel.com](https://vercel.com)
   - Import Git Repository
   - Selecione a pasta `frontend` como Root Directory

2. **Configurar Variáveis de Ambiente**
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon
   VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publishable
   VITE_API_URL=https://seu-backend.railway.app
   VITE_USE_FASTAPI=true
   ```

3. **Deploy**
   ```bash
   git push origin main  # Deploy automático
   ```

### Deploy Backend (Railway)

1. **Criar Projeto no Railway**
   - Acesse [railway.app](https://railway.app)
   - New Project → Deploy from GitHub
   - Selecione o repositório

2. **Configurar Variáveis de Ambiente**
   ```env
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
   ALLOWED_ORIGINS=https://seu-frontend.vercel.app,https://seu-dominio.com
   ENVIRONMENT=production
   PORT=8000
   ```

3. **Configurar Build**
   - O Railway detectará automaticamente o `Procfile` e `nixpacks.toml`

4. **Deploy**
   ```bash
   git push origin main  # Deploy automático
   ```

---

## 🧪 Testes

### Frontend

```bash
cd frontend

# Executar testes unitários
npm test

# Executar testes em watch mode
npm run test:watch

# Lint
npm run lint
```

### Backend

```bash
# Executar testes
pytest api/tests/

# Com coverage
pytest --cov=api api/tests/
```

---

## 📊 API Backend

### Endpoints Principais

#### Health Check
```http
GET /api/health
```

#### Analytics

```http
GET /api/analytics/volatility
GET /api/analytics/correlation
GET /api/analytics/climate-lag
GET /api/analytics/combined
```

#### Data Warehouse

```http
GET /api/data/daily           # Dados diários consolidados
GET /api/data/market          # Dados de mercado
GET /api/data/weather         # Dados climáticos
```

### Documentação Interativa

- **Swagger UI**: https://seu-backend.railway.app/api/docs
- **ReDoc**: https://seu-backend.railway.app/api/redoc

---

## 🔐 Segurança

### Implementações de Segurança

- ✅ **Row Level Security (RLS)** em todas as tabelas
- ✅ **Autenticação JWT** via Supabase Auth
- ✅ **CORS configurado** com lista de origens permitidas
- ✅ **Validação de entrada** em todos os endpoints
- ✅ **Rate limiting** (em desenvolvimento)
- ✅ **Security headers** configurados
- ✅ **SQL Injection protection** via ORM/prepared statements
- ✅ **Secrets management** via variáveis de ambiente

### Conformidade

- [SECURITY.md](SECURITY.md) - Política de segurança
- [SECURITY_POLICY.md](SECURITY_POLICY.md) - Diretrizes de segurança

---

## 📚 Documentação

### Documentos do Projeto

- [PROJETO_CASE.md](PROJETO_CASE.md) - Case detalhado do projeto
- [RESUMO_EXECUTIVO.md](RESUMO_EXECUTIVO.md) - Resumo executivo
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Checklist de deploy
- [FAQ.md](FAQ.md) - Perguntas frequentes
- [COMPREHENSIVE_AUDIT.md](COMPREHENSIVE_AUDIT.md) - Auditoria completa

### Documentação Técnica

- [BACKEND_ANALYSIS_SÊNIOR.md](BACKEND_ANALYSIS_SÊNIOR.md) - Análise backend
- [MELHORIAS_IMPLEMENTADAS.md](MELHORIAS_IMPLEMENTADAS.md) - Melhorias aplicadas
- [SECURITY_ALERT.md](SECURITY_ALERT.md) - Alertas de segurança

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- [React](https://react.dev/) - Framework UI
- [TypeScript](https://www.typescriptlang.org/) - Type Safety
- [Vite](https://vitejs.dev/) - Build Tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - Component Library
- [TanStack Query](https://tanstack.com/query) - Data Fetching
- [Recharts](https://recharts.org/) - Charts

### Backend
- [FastAPI](https://fastapi.tiangolo.com/) - Web Framework
- [Uvicorn](https://www.uvicorn.org/) - ASGI Server
- [Pandas](https://pandas.pydata.org/) - Data Analysis
- [Supabase](https://supabase.com/) - Database & Auth
- [Redis](https://redis.io/) - Caching (opcional)

### DevOps
- [Vercel](https://vercel.com/) - Frontend Hosting
- [Railway](https://railway.app/) - Backend Hosting
- [GitHub Actions](https://github.com/features/actions) - CI/CD (futuro)

---

## 🗺️ Roadmap

### ✅ Concluído (v1.0)
- [x] Star Schema implementado
- [x] Dashboard executivo
- [x] Análises de volatilidade e correlação
- [x] Integração clima × mercado
- [x] Deploy em produção
- [x] RLS e autenticação

### 🚧 Em Desenvolvimento (v1.1)
- [ ] Machine Learning para previsões
- [ ] Alertas personalizáveis por usuário
- [ ] Exportação de relatórios PDF
- [ ] API pública com rate limiting
- [ ] Testes E2E automatizados

### 🔮 Futuro (v2.0)
- [ ] Integração com APIs de dados em tempo real
- [ ] Mobile app (React Native)
- [ ] Dashboard customizável (drag-and-drop)
- [ ] Análise de sentimento de notícias
- [ ] Backtesting de estratégias

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, siga estas diretrizes:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👥 Autores

**Equipe AgroData Nexus**

- **Desenvolvedor**: Eduardo
- **Cliente**: Verde Futuro Capital

---

## 📞 Suporte

Para suporte, entre em contato:

- 📧 Email: suporte@agrodatanexus.com
- 💬 Issues: [GitHub Issues](https://github.com/seu-usuario/agro-data-navigator/issues)
- 📖 Documentação: [Wiki](https://github.com/seu-usuario/agro-data-navigator/wiki)

---

## 🙏 Agradecimentos

- Verde Futuro Capital pela oportunidade
- Equipe Supabase pelo excelente produto
- Comunidade Open Source

---

<div align="center">

**[⬆ Voltar ao topo](#-agrodata-nexus---market-intelligence-platform)**

Made with ❤️ for the Agribusiness sector

</div>
