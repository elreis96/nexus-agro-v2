/**
 * Hook para buscar dados de mercado do Supabase
 * 
 * Este hook centraliza todas as queries de dados para o dashboard,
 * garantindo que o calendário (dim_calendario) seja usado como
 * tabela mestre para manter a integridade das séries temporais.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subMonths, subDays, format } from 'date-fns';
import type {
  FactMercado,
  FactClima,
  ViewVolatilidadeMensal,
  ViewCorrelacaoDolarJbs,
  ViewLagChuva60dBoi,
  ExecutiveStats,
  CurrentMarketData,
  PeriodFilter,
  DateRange,
} from '@/lib/types';

/**
 * Calcula o range de datas baseado no filtro de período
 */
export function getDateRange(filter: PeriodFilter, customRange?: DateRange): DateRange {
  const endDate = new Date();
  let startDate: Date;
  
  switch (filter) {
    case '3m':
      startDate = subMonths(endDate, 3);
      break;
    case '6m':
      startDate = subMonths(endDate, 6);
      break;
    case '1y':
      startDate = subMonths(endDate, 12);
      break;
    case 'custom':
      return customRange || { startDate: subMonths(endDate, 6), endDate };
    default:
      startDate = subMonths(endDate, 6);
  }
  
  return { startDate, endDate };
}

/**
 * Hook para estatísticas executivas (cards do topo)
 */
export function useExecutiveStats() {
  return useQuery({
    queryKey: ['executive-stats'],
    queryFn: async (): Promise<ExecutiveStats> => {
      // Buscar último dado de mercado
      const { data: mercadoData, error: mercadoError } = await supabase
        .from('fact_mercado')
        .select('*')
        .order('data_fk', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (mercadoError) throw mercadoError;
      
      // Buscar chuva acumulada dos últimos 30 dias
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const { data: climaData, error: climaError } = await supabase
        .from('fact_clima')
        .select('chuva_mm')
        .gte('data_fk', thirtyDaysAgo);
      
      if (climaError) throw climaError;
      
      const chuvaAcumulada = climaData?.reduce((sum, row) => sum + (row.chuva_mm || 0), 0) || 0;
      
      return {
        valorJbs: mercadoData?.valor_jbs || 0,
        valorBoiGordo: mercadoData?.valor_boi_gordo || 0,
        valorDolar: mercadoData?.valor_dolar || 0,
        chuvaAcumulada,
        dataObservacao: mercadoData?.data_fk || '',
      };
    },
    refetchInterval: 60000, // Atualiza a cada minuto
  });
}

/**
 * Hook para dados do painel IA Strategist
 */
export function useCurrentMarketData() {
  return useQuery({
    queryKey: ['current-market-data'],
    queryFn: async (): Promise<CurrentMarketData> => {
      // Buscar último dado de mercado
      const { data: mercadoData, error: mercadoError } = await supabase
        .from('fact_mercado')
        .select('*')
        .order('data_fk', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (mercadoError) throw mercadoError;
      
      // Buscar chuva acumulada dos últimos 30 dias
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const { data: climaData, error: climaError } = await supabase
        .from('fact_clima')
        .select('chuva_mm')
        .gte('data_fk', thirtyDaysAgo);
      
      if (climaError) throw climaError;
      
      const chuvaAcumulada = climaData?.reduce((sum, row) => sum + (row.chuva_mm || 0), 0) || 0;
      
      return {
        ultimoBoiGordo: mercadoData?.valor_boi_gordo || 0,
        ultimoJbs: mercadoData?.valor_jbs || 0,
        ultimoDolar: mercadoData?.valor_dolar || 0,
        chuvaAcumulada30d: chuvaAcumulada,
        dataUltimaObservacao: mercadoData?.data_fk || '',
      };
    },
    refetchInterval: 60000,
  });
}

/**
 * Hook para dados de volatilidade mensal (boxplots)
 */
export function useVolatilidadeMensal(period: PeriodFilter, customRange?: DateRange) {
  const { startDate, endDate } = getDateRange(period, customRange);
  
  return useQuery({
    queryKey: ['volatilidade-mensal', period, startDate, endDate],
    queryFn: async (): Promise<ViewVolatilidadeMensal[]> => {
      const { data, error } = await supabase
        .from('view_volatilidade_mensal')
        .select('*')
        .order('ano', { ascending: true })
        .order('mes', { ascending: true });
      
      if (error) throw error;
      
      // Filtrar por período
      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth() + 1;
      const endYear = endDate.getFullYear();
      const endMonth = endDate.getMonth() + 1;
      
      return (data || []).filter(row => {
        const rowDate = row.ano * 100 + row.mes;
        const startDateNum = startYear * 100 + startMonth;
        const endDateNum = endYear * 100 + endMonth;
        return rowDate >= startDateNum && rowDate <= endDateNum;
      });
    },
  });
}

/**
 * Hook para dados de correlação Dólar x JBS
 */
export function useCorrelacaoDolarJbs(period: PeriodFilter, customRange?: DateRange) {
  const { startDate, endDate } = getDateRange(period, customRange);
  
  return useQuery({
    queryKey: ['correlacao-dolar-jbs', period, startDate, endDate],
    queryFn: async (): Promise<ViewCorrelacaoDolarJbs[]> => {
      const { data, error } = await supabase
        .from('view_correlacao_dolar_jbs')
        .select('*')
        .gte('data_fk', format(startDate, 'yyyy-MM-dd'))
        .lte('data_fk', format(endDate, 'yyyy-MM-dd'))
        .order('data_fk', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });
}

/**
 * Hook para dados de lag de chuva 60 dias vs boi gordo
 * 
 * EXPLICAÇÃO DO LAG DE 60 DIAS:
 * A view view_lag_chuva_60d_boi implementa a hipótese de que
 * a chuva de hoje impacta o preço do boi gordo aproximadamente
 * 60 dias no futuro. Isso ocorre porque:
 * 
 * 1. Chuva adequada → Pastagem saudável
 * 2. Pastagem saudável → Menor custo de confinamento
 * 3. Menor custo → Maior oferta de boi
 * 4. Maior oferta → Possível pressão nos preços
 * 
 * O efeito leva ~60 dias para se materializar no mercado.
 */
export function useLagChuva60dBoi(period: PeriodFilter, customRange?: DateRange) {
  const { startDate, endDate } = getDateRange(period, customRange);
  
  return useQuery({
    queryKey: ['lag-chuva-60d-boi', period, startDate, endDate],
    queryFn: async (): Promise<ViewLagChuva60dBoi[]> => {
      const { data, error } = await supabase
        .from('view_lag_chuva_60d_boi')
        .select('*')
        .gte('data_preco', format(startDate, 'yyyy-MM-dd'))
        .lte('data_preco', format(endDate, 'yyyy-MM-dd'))
        .order('data_preco', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });
}

/**
 * Hook para dados de mercado filtrados por período
 */
export function useMarketData(period: PeriodFilter, customRange?: DateRange) {
  const { startDate, endDate } = getDateRange(period, customRange);
  
  return useQuery({
    queryKey: ['market-data', period, startDate, endDate],
    queryFn: async (): Promise<FactMercado[]> => {
      const { data, error } = await supabase
        .from('fact_mercado')
        .select('*')
        .gte('data_fk', format(startDate, 'yyyy-MM-dd'))
        .lte('data_fk', format(endDate, 'yyyy-MM-dd'))
        .order('data_fk', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });
}
