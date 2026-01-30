/**
 * Sistema de Alertas de Oscilações de Mercado
 * Monitora mudanças significativas nos valores e gera notificações
 */

import { supabase } from '@/integrations/supabase/client';

interface MarketData {
  data_fk: string;
  valor_dolar: number;
  valor_jbs: number;
  valor_boi_gordo: number;
}

interface MarketAlert {
  type: 'dolar' | 'jbs' | 'boi_gordo';
  changePercent: number;
  currentValue: number;
  previousValue: number;
  trend: 'up' | 'down';
}

/**
 * Analisa dados de mercado e identifica oscilações significativas
 */
export async function detectMarketOscillations(userId: string): Promise<MarketAlert[]> {
  try {
    // Buscar últimos 2 dias de dados
    const { data, error } = await supabase
      .from('fact_mercado')
      .select('data_fk, valor_dolar, valor_jbs, valor_boi_gordo')
      .order('data_fk', { ascending: false })
      .limit(2);

    if (error || !data || data.length < 2) {
      return [];
    }

    const [current, previous] = data as MarketData[];
    const alerts: MarketAlert[] = [];

    // Limiar de variação significativa (%)
    const THRESHOLD = 2.0; // 2% de variação

    // Análise do Dólar
    const dolarChange = ((current.valor_dolar - previous.valor_dolar) / previous.valor_dolar) * 100;
    if (Math.abs(dolarChange) >= THRESHOLD) {
      alerts.push({
        type: 'dolar',
        changePercent: dolarChange,
        currentValue: current.valor_dolar,
        previousValue: previous.valor_dolar,
        trend: dolarChange > 0 ? 'up' : 'down'
      });
    }

    // Análise JBS
    const jbsChange = ((current.valor_jbs - previous.valor_jbs) / previous.valor_jbs) * 100;
    if (Math.abs(jbsChange) >= THRESHOLD) {
      alerts.push({
        type: 'jbs',
        changePercent: jbsChange,
        currentValue: current.valor_jbs,
        previousValue: previous.valor_jbs,
        trend: jbsChange > 0 ? 'up' : 'down'
      });
    }

    // Análise Boi Gordo
    const boiChange = ((current.valor_boi_gordo - previous.valor_boi_gordo) / previous.valor_boi_gordo) * 100;
    if (Math.abs(boiChange) >= THRESHOLD) {
      alerts.push({
        type: 'boi_gordo',
        changePercent: boiChange,
        currentValue: current.valor_boi_gordo,
        previousValue: previous.valor_boi_gordo,
        trend: boiChange > 0 ? 'up' : 'down'
      });
    }

    return alerts;
  } catch (error) {
    console.error('Erro ao detectar oscilações:', error);
    return [];
  }
}

/**
 * Cria notificações para alertas de mercado
 */
export async function createMarketAlertNotifications(userId: string): Promise<void> {
  try {
    const alerts = await detectMarketOscillations(userId);

    if (alerts.length === 0) {
      return;
    }

    // Criar notificações para cada alerta
    const notifications = alerts.map(alert => {
      const icon = alert.trend === 'up' ? '📈' : '📉';
      const trendText = alert.trend === 'up' ? 'subiu' : 'caiu';
      const asset = {
        dolar: 'Dólar',
        jbs: 'JBS (JBSS3)',
        boi_gordo: 'Boi Gordo'
      }[alert.type];

      return {
        user_id: userId,
        title: `${icon} Oscilação detectada: ${asset}`,
        body: `${asset} ${trendText} ${Math.abs(alert.changePercent).toFixed(2)}% (de R$ ${alert.previousValue.toFixed(2)} para R$ ${alert.currentValue.toFixed(2)})`,
        created_at: new Date().toISOString()
      };
    });

    // Inserir notificações no banco
    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('Erro ao criar notificações:', error);
    }
  } catch (error) {
    console.error('Erro ao criar alertas de mercado:', error);
  }
}

/**
 * Verifica se há alertas climáticos importantes
 */
export async function detectClimateAlerts(userId: string): Promise<void> {
  try {
    // Buscar dados climáticos recentes
    const { data, error } = await supabase
      .from('fact_clima')
      .select('data_fk, chuva_mm, temp_max')
      .order('data_fk', { ascending: false })
      .limit(7);

    if (error || !data) {
      return;
    }

    const notifications: { user_id: string; title: string; body: string; created_at: string }[] = [];

    // Alerta: Chuva excessiva (>100mm em um dia)
    const heavyRain = data.find(d => d.chuva_mm > 100);
    if (heavyRain) {
      notifications.push({
        user_id: userId,
        title: '🌧️ Alerta: Chuva Intensa',
        body: `Precipitação de ${heavyRain.chuva_mm.toFixed(1)}mm registrada. Pode impactar logística e pastagens.`,
        created_at: new Date().toISOString()
      });
    }

    // Alerta: Seca prolongada (sem chuva por 7 dias)
    const totalRain = data.reduce((sum, d) => sum + (d.chuva_mm || 0), 0);
    if (totalRain < 5) {
      notifications.push({
        user_id: userId,
        title: '☀️ Alerta: Período de Seca',
        body: `Apenas ${totalRain.toFixed(1)}mm de chuva nos últimos 7 dias. Monitorar hidratação do gado.`,
        created_at: new Date().toISOString()
      });
    }

    // Alerta: Temperatura extrema (>35°C)
    const highTemp = data.find(d => d.temp_max > 35);
    if (highTemp) {
      notifications.push({
        user_id: userId,
        title: '🌡️ Alerta: Temperatura Elevada',
        body: `Temperatura de ${highTemp.temp_max.toFixed(1)}°C registrada. Aumentar fornecimento de água.`,
        created_at: new Date().toISOString()
      });
    }

    // Inserir notificações
    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }
  } catch (error) {
    console.error('Erro ao detectar alertas climáticos:', error);
  }
}
