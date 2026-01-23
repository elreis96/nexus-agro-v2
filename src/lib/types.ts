/**
 * Tipos de dados do AgroData Nexus
 * Representam as estruturas das tabelas e views do banco de dados
 */

// Tabela dim_calendario - Calendário mestre de datas
export interface DimCalendario {
  data_pk: string;
  ano: number;
  mes: number;
  is_business_day: boolean;
}

// Tabela fact_mercado - Dados de mercado financeiro
export interface FactMercado {
  id: string;
  data_fk: string;
  valor_dolar: number | null;
  valor_jbs: number | null;
  valor_boi_gordo: number | null;
}

// Tabela fact_clima - Dados climáticos
export interface FactClima {
  id: string;
  data_fk: string;
  chuva_mm: number | null;
  temp_max: number | null;
  localizacao: string | null;
}

// View view_volatilidade_mensal - Dados para boxplot de volatilidade
export interface ViewVolatilidadeMensal {
  ano: number;
  mes: number;
  min_boi: number;
  q1_boi: number;
  mediana_boi: number;
  q3_boi: number;
  max_boi: number;
  min_dolar: number;
  q1_dolar: number;
  mediana_dolar: number;
  q3_dolar: number;
  max_dolar: number;
}

// View view_correlacao_dolar_jbs - Dados para scatter plot
export interface ViewCorrelacaoDolarJbs {
  data_fk: string;
  ano: number;
  mes: number;
  valor_dolar: number;
  valor_jbs: number;
}

/**
 * View view_lag_chuva_60d_boi
 * 
 * Esta view implementa a tese climática do fundo:
 * - O clima (chuva) de hoje impacta o preço do boi gordo ~60 dias no futuro
 * - Para cada data_preco do boi, mostramos a chuva que ocorreu 60 dias ANTES
 * - Isso permite visualizar a correlação entre chuva passada e preço atual
 * 
 * O lag de 60 dias é aplicado assim:
 * data_chuva_original = data_preco - 60 dias
 */
export interface ViewLagChuva60dBoi {
  data_preco: string;
  ano_preco: number;
  mes_preco: number;
  valor_boi_gordo: number;
  chuva_mm_lag_60d: number | null;
  data_chuva_original: string | null;
}

// Período de filtro
export type PeriodFilter = '3m' | '6m' | '1y' | 'custom';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Recomendação do IA Strategist
export type RecommendationType = 'increase' | 'maintain' | 'decrease';

export interface StrategistRecommendation {
  type: RecommendationType;
  title: string;
  rationale: string;
  confidence: number;
  updatedAt: Date;
}

// Dados atuais para geração de recomendação
export interface CurrentMarketData {
  ultimoBoiGordo: number;
  ultimoJbs: number;
  ultimoDolar: number;
  chuvaAcumulada30d: number;
  dataUltimaObservacao: string;
}

// Estatísticas executivas
export interface ExecutiveStats {
  valorJbs: number;
  valorBoiGordo: number;
  valorDolar: number;
  chuvaAcumulada: number;
  dataObservacao: string;
}

// Tipos para controle de usuários
export type AppRole = 'admin' | 'gestor';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  nome: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

// Tipo para alertas de mercado
export type AlertLevel = 'info' | 'warning' | 'critical';

export interface MarketAlert {
  id: string;
  title: string;
  description: string;
  level: AlertLevel;
  date: string;
  category: 'volatilidade' | 'clima' | 'mercado';
}
