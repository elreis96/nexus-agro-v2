/**
 * Hook para buscar dados de mercado
 * Usa FastAPI quando VITE_USE_FASTAPI=true, senão usa Supabase direto
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { apiClient } from '@/lib/api-client';
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

// Feature flag
const USE_FASTAPI = import.meta.env.VITE_USE_FASTAPI === 'true';

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
      // Sempre usa Supabase direto para stats (dados simples)
      const { data: mercadoData, error: mercadoError } = await supabase
        .from('fact_mercado')
        .select('*')
        .order('data_fk', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (mercadoError) throw mercadoError;
      
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
    refetchInterval: 60000,
  });
}

/**
 * Hook para dados do painel IA Strategist
 */
export function useCurrentMarketData() {
  return useQuery({
    queryKey: ['current-market-data'],
    queryFn: async (): Promise<CurrentMarketData> => {
      const { data: mercadoData, error: mercadoError } = await supabase
        .from('fact_mercado')
        .select('*')
        .order('data_fk', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (mercadoError) throw mercadoError;
      
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
    queryKey: ['volatilidade-mensal', period, startDate, endDate, USE_FASTAPI],
    queryFn: async (): Promise<ViewVolatilidadeMensal[]> => {
      if (USE_FASTAPI) {
        const data = await apiClient.getVolatilityAnalysis(
          format(startDate, 'yyyy-MM-dd'),
          format(endDate, 'yyyy-MM-dd')
        );
        // Data already matches the View interface mostly, just ensure types
        return data as unknown as ViewVolatilidadeMensal[]; // Cast safe due to our backend reshaping
      }
      return []; // No views in Supabase, fallback to empty
    },
  });
}

/**
 * Hook para dados de correlação Dólar x JBS
 */
export function useCorrelacaoDolarJbs(period: PeriodFilter, customRange?: DateRange) {
  const { startDate, endDate } = getDateRange(period, customRange);
  
  return useQuery({
    queryKey: ['correlacao-dolar-jbs', period, startDate, endDate, USE_FASTAPI],
    queryFn: async (): Promise<ViewCorrelacaoDolarJbs[]> => {
      if (USE_FASTAPI) {
        const data = await apiClient.getCorrelationAnalysis(
          format(startDate, 'yyyy-MM-dd'),
          format(endDate, 'yyyy-MM-dd')
        );
        return data as ViewCorrelacaoDolarJbs[];
      }
      return []; 
    },
  });
}

/**
 * Hook para dados de lag de chuva 60 dias vs boi gordo
 */
export function useLagChuva60dBoi(period: PeriodFilter, customRange?: DateRange) {
  const { startDate, endDate } = getDateRange(period, customRange);
  
  return useQuery({
    queryKey: ['lag-chuva-60d-boi', period, startDate, endDate, USE_FASTAPI],
    queryFn: async (): Promise<ViewLagChuva60dBoi[]> => {
      if (USE_FASTAPI) {
        const data = await apiClient.getLagAnalysis(
          format(startDate, 'yyyy-MM-dd'),
          format(endDate, 'yyyy-MM-dd'),
          60 // 60 days lag
        );
        
        // Map backend response to component expectation
        return data.map((row: any) => ({
          data_preco: row.data_preco,
          valor_boi_gordo: row.valor_boi_gordo,
          chuva_mm_lag_60d: row.chuva_mm // Remap field name
        })) as unknown as ViewLagChuva60dBoi[];
      }
      return [];
    },
  });
}

/**
 * Hook para dados de mercado filtrados por período
 * USA FASTAPI quando feature flag está ativa
 */
export function useMarketData(period: PeriodFilter, customRange?: DateRange) {
  const { startDate, endDate } = getDateRange(period, customRange);
  
  return useQuery({
    queryKey: ['market-data', period, startDate, endDate, USE_FASTAPI],
    queryFn: async (): Promise<FactMercado[]> => {
      if (USE_FASTAPI) {
        // NEW: Usa FastAPI
        return apiClient.getMarketData(
          format(startDate, 'yyyy-MM-dd'),
          format(endDate, 'yyyy-MM-dd')
        );
      } else {
        // LEGACY: Usa Supabase direto
        const { data, error } = await supabase
          .from('fact_mercado')
          .select('*')
          .gte('data_fk', format(startDate, 'yyyy-MM-dd'))
          .lte('data_fk', format(endDate, 'yyyy-MM-dd'))
          .order('data_fk', { ascending: true });
        
        if (error) throw error;
        return data || [];
      }
    },
  });
}
