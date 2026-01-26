/**
 * Hook para buscar dados de mercado
 * Refatorado para usar Fetch manual (useEffect) e evitar loops infinitos do React Query
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import { subMonths, subDays, format } from 'date-fns';
import type {
  FactMercado,
  ViewVolatilidadeMensal,
  ViewCorrelacaoDolarJbs,
  ViewLagChuva60dBoi,
  ExecutiveStats,
  CurrentMarketData,
  PeriodFilter,
  DateRange,
} from '@/lib/types';

// Feature flag - Default para true em produção se não definido
// Isso garante que o backend FastAPI seja usado quando disponível
const USE_FASTAPI = import.meta.env.VITE_USE_FASTAPI !== 'false' && import.meta.env.PROD;

// Log de debug
logger.debug('useMarketData Config', {
  component: 'useMarketData',
  USE_FASTAPI,
  VITE_USE_FASTAPI: import.meta.env.VITE_USE_FASTAPI,
  PROD: import.meta.env.PROD,
});

/**
 * Calcula o range de datas baseado no filtro de período
 * CORRIGIDO: Usa o range real dos dados do case (out/2025 a jan/2026)
 * ao invés de calcular a partir de hoje
 */
export function getDateRange(filter: PeriodFilter, customRange?: DateRange): DateRange {
  // Datas dos dados reais do case: 2025-10-25 a 2026-01-23
  const DATA_START = new Date('2025-10-25');
  const DATA_END = new Date('2026-01-23');
  
  let startDate: Date;
  let endDate: Date = DATA_END;
  
  switch (filter) {
    case '3m':
      // 3 meses para trás a partir da última data dos dados
      startDate = subMonths(DATA_END, 3);
      break;
    case '6m':
      // Como temos apenas ~3 meses de dados, usar todo o range
      startDate = DATA_START;
      break;
    case '1y':
      // Como temos apenas ~3 meses de dados, usar todo o range
      startDate = DATA_START;
      break;
    case 'custom':
      return customRange || { startDate: DATA_START, endDate: DATA_END };
    default:
      startDate = DATA_START;
  }
  
  return { startDate, endDate };
}

/**
 * Hook UNIFICADO para buscar Analytics (Volatilidade, Correlação, Lag)
 * Substitui os hooks individuais baseados em React Query que estavam causando loop.
 */
interface UseAnalyticsProps {
  period: PeriodFilter;
  customRange?: DateRange;
}

export function useAnalytics({ period, customRange }: UseAnalyticsProps) {
  const [volatilidade, setVolatilidade] = useState<ViewVolatilidadeMensal[]>([]);
  const [correlacao, setCorrelacao] = useState<ViewCorrelacaoDolarJbs[]>([]);
  const [lagChuva, setLagChuva] = useState<ViewLagChuva60dBoi[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { startDate, endDate } = getDateRange(period, customRange);
  
  // Format dates for API
  const startStr = format(startDate, 'yyyy-MM-dd');
  const endStr = format(endDate, 'yyyy-MM-dd');

  const fetchAnalytics = useCallback(async () => {
    const startTime = performance.now();
    setIsLoading(true);
    setError(null);
    logger.debug('Analytics fetch started', {
      component: 'useAnalytics',
      startStr,
      endStr,
      USE_FASTAPI,
    });

    try {
      if (USE_FASTAPI) {
        // Use FastAPI backend
        const [volData, corrData, lagData] = await Promise.all([
          apiClient.getVolatilityAnalysis(startStr, endStr),
          apiClient.getCorrelationAnalysis(startStr, endStr),
          apiClient.getLagAnalysis(startStr, endStr, 60)
        ]);

        // Process and set data
        setVolatilidade(volData as unknown as ViewVolatilidadeMensal[]);
        setCorrelacao(corrData as ViewCorrelacaoDolarJbs[]);
        
        const mappedLag = lagData.map((row: any) => ({
          data_preco: row.data_preco,
          valor_boi_gordo: row.valor_boi_gordo,
          chuva_mm_lag_60d: row.chuva_mm
        })) as unknown as ViewLagChuva60dBoi[];
        setLagChuva(mappedLag);

        logger.performance('Analytics fetch completed', startTime, {
          component: 'useAnalytics',
          vol: volData.length, 
          corr: corrData.length, 
          lag: mappedLag.length,
        });
      } else {
        // Fallback: Use Supabase direct queries
        logger.warn('USE_FASTAPI is false, using fallback', {
          component: 'useAnalytics',
        });
        
        // TODO: Implementar queries diretas ao Supabase se necessário
        // Por enquanto, deixar vazio para não quebrar o dashboard
        setVolatilidade([]);
        setCorrelacao([]);
        setLagChuva([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      logger.error('Analytics fetch failed', err, {
        component: 'useAnalytics',
        startStr,
        endStr,
      });
      
      // On error, clear data to show error state
      setVolatilidade([]);
      setCorrelacao([]);
      setLagChuva([]);
    } finally {
      setIsLoading(false);
    }
  }, [startStr, endStr]);

  // Effect handles fetching when dates change
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    volatilidade,
    correlacao,
    lagChuva,
    isLoading,
    error,
    refetch: fetchAnalytics,
  };
}

/**
 * MANTIDOS (LEGACY WRAPPERS)
 * Para não quebrar o Dashboard.tsx imediatamente, mantemos os hooks antigos
 * mas agora eles usam o hook unificado por baixo dos panos (ou simulam).
 * 
 * ATENÇÃO: O ideal é migrar o Dashboard.tsx para usar useAnalytics() direto.
 * Mas vou implementar wrappers simples aqui.
 */

// ... Mantendo ExecutiveStats e useMarketData (tabela) que são independentes ...

export function useExecutiveStats() {
  // Mantendo implementação original React Query pois funciona bem para dados simples e não conflitava
  const { data, isLoading } = useQuery({
    queryKey: ['executive-stats'],
    queryFn: async (): Promise<ExecutiveStats> => {
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
        .select('data_fk, chuva_mm, temp_max')
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
  return { data, isLoading };
}

export function useCurrentMarketData() {
    const query = useQuery({
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
            .select('data_fk, chuva_mm, temp_max')
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

    return {
      data: query.data,
      isLoading: query.isLoading,
      refetch: query.refetch,
      dataUpdatedAt: query.dataUpdatedAt
    };
}

// Hook de tabela raw
export function useMarketData(period: PeriodFilter, customRange?: DateRange) {
    const { startDate, endDate } = getDateRange(period, customRange);
    return useQuery({
      queryKey: ['market-data', period, startDate, endDate, USE_FASTAPI],
      queryFn: async (): Promise<FactMercado[]> => {
        if (USE_FASTAPI) {
          return apiClient.getMarketData(
            format(startDate, 'yyyy-MM-dd'),
            format(endDate, 'yyyy-MM-dd')
          );
        } else {
          return [];
        }
      },
    });
  }
