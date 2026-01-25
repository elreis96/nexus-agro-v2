import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Info, AlertCircle, TrendingUp, CloudRain } from 'lucide-react';
import { useAnalytics, useExecutiveStats } from '@/hooks/useMarketData';
import type { MarketAlert, AlertLevel } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Thresholds configuráveis para geração de alertas
const THRESHOLDS = {
  // Volatilidade do Boi Gordo (diferença entre max e min em %)
  boiVolatilityHigh: 10, // % de variação que indica alta volatilidade
  boiVolatilityCritical: 15,
  // Volatilidade do Dólar
  dolarVolatilityHigh: 5,
  dolarVolatilityCritical: 8,
  // Chuva acumulada 30 dias (mm)
  chuvaExcessiva: 300, // mm - muita chuva pode indicar problemas
  chuvaEscassa: 50, // mm - pouca chuva afeta pastagens
  // Média histórica de chuva para comparação (aproximada)
  chuvaMediaHistorica: 150,
};

function getAlertIcon(level: AlertLevel) {
  switch (level) {
    case 'critical':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
}

function getAlertBadgeVariant(level: AlertLevel): 'destructive' | 'secondary' | 'outline' {
  switch (level) {
    case 'critical':
      return 'destructive';
    case 'warning':
      return 'secondary';
    default:
      return 'outline';
  }
}

export function MarketAlerts() {
  const { volatilidade } = useAnalytics({ period: '6m' });
  const { data: stats } = useExecutiveStats();

  const alerts = useMemo<MarketAlert[]>(() => {
    const alertList: MarketAlert[] = [];
    const today = format(new Date(), 'yyyy-MM-dd');

    // Analisar volatilidade dos últimos meses
    if (volatilidade && volatilidade.length > 0) {
      // Pegar o último mês disponível
      const lastMonth = volatilidade[volatilidade.length - 1];
      
      // Calcular volatilidade do Boi Gordo (% de variação)
      if (lastMonth.max_boi && lastMonth.min_boi && lastMonth.mediana_boi) {
        const boiRange = ((lastMonth.max_boi - lastMonth.min_boi) / lastMonth.mediana_boi) * 100;
        
        if (boiRange >= THRESHOLDS.boiVolatilityCritical) {
          alertList.push({
            id: `boi-vol-critical-${lastMonth.ano}-${lastMonth.mes}`,
            title: 'Volatilidade Crítica - Boi Gordo',
            description: `Variação de ${boiRange.toFixed(1)}% no mês ${lastMonth.mes}/${lastMonth.ano}. Considere estratégias de hedge.`,
            level: 'critical',
            date: today,
            category: 'volatilidade',
          });
        } else if (boiRange >= THRESHOLDS.boiVolatilityHigh) {
          alertList.push({
            id: `boi-vol-warning-${lastMonth.ano}-${lastMonth.mes}`,
            title: 'Alta Volatilidade - Boi Gordo',
            description: `Variação de ${boiRange.toFixed(1)}% detectada. Monitore posições.`,
            level: 'warning',
            date: today,
            category: 'volatilidade',
          });
        }
      }

      // Calcular volatilidade do Dólar
      if (lastMonth.max_dolar && lastMonth.min_dolar && lastMonth.mediana_dolar) {
        const dolarRange = ((lastMonth.max_dolar - lastMonth.min_dolar) / lastMonth.mediana_dolar) * 100;
        
        if (dolarRange >= THRESHOLDS.dolarVolatilityCritical) {
          alertList.push({
            id: `dolar-vol-critical-${lastMonth.ano}-${lastMonth.mes}`,
            title: 'Volatilidade Crítica - Dólar',
            description: `Variação cambial de ${dolarRange.toFixed(1)}% no mês. Alto risco para exposição internacional.`,
            level: 'critical',
            date: today,
            category: 'volatilidade',
          });
        } else if (dolarRange >= THRESHOLDS.dolarVolatilityHigh) {
          alertList.push({
            id: `dolar-vol-warning-${lastMonth.ano}-${lastMonth.mes}`,
            title: 'Alta Volatilidade - Dólar',
            description: `Variação cambial de ${dolarRange.toFixed(1)}% detectada.`,
            level: 'warning',
            date: today,
            category: 'volatilidade',
          });
        }
      }

      // Identificar mês de maior volatilidade histórica
      let maxVolMonth = volatilidade[0];
      let maxVol = 0;
      
      volatilidade.forEach(month => {
        if (month.max_boi && month.min_boi && month.mediana_boi) {
          const vol = (month.max_boi - month.min_boi) / month.mediana_boi;
          if (vol > maxVol) {
            maxVol = vol;
            maxVolMonth = month;
          }
        }
      });

      if (maxVol > 0) {
        alertList.push({
          id: `max-vol-info`,
          title: 'Análise: Mês de Maior Volatilidade',
          description: `${maxVolMonth.mes}/${maxVolMonth.ano} apresentou a maior dispersão de preços do boi gordo no período.`,
          level: 'info',
          date: today,
          category: 'mercado',
        });
      }
    }

    // Analisar chuva acumulada
    if (stats?.chuvaAcumulada !== undefined) {
      const chuva = stats.chuvaAcumulada;
      const desvio = ((chuva - THRESHOLDS.chuvaMediaHistorica) / THRESHOLDS.chuvaMediaHistorica) * 100;

      if (chuva >= THRESHOLDS.chuvaExcessiva) {
        alertList.push({
          id: 'chuva-excessiva',
          title: 'Chuva Excessiva',
          description: `${chuva.toFixed(0)}mm acumulados em 30 dias (${desvio.toFixed(0)}% acima da média). Pode impactar logística e qualidade de pastagem.`,
          level: 'warning',
          date: stats.dataObservacao || today,
          category: 'clima',
        });
      } else if (chuva <= THRESHOLDS.chuvaEscassa) {
        alertList.push({
          id: 'chuva-escassa',
          title: 'Déficit Hídrico',
          description: `Apenas ${chuva.toFixed(0)}mm em 30 dias (${Math.abs(desvio).toFixed(0)}% abaixo da média). Impacto esperado no preço do boi em ~60 dias.`,
          level: 'critical',
          date: stats.dataObservacao || today,
          category: 'clima',
        });
      } else if (Math.abs(desvio) > 30) {
        alertList.push({
          id: 'chuva-desvio',
          title: 'Chuva Fora da Média',
          description: `${chuva.toFixed(0)}mm acumulados - ${desvio > 0 ? 'acima' : 'abaixo'} da média histórica.`,
          level: 'info',
          date: stats.dataObservacao || today,
          category: 'clima',
        });
      }
    }

    return alertList.sort((a, b) => {
      const levelOrder = { critical: 0, warning: 1, info: 2 };
      return levelOrder[a.level] - levelOrder[b.level];
    });
  }, [volatilidade, stats]);

  if (alerts.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Alertas de Mercado e Clima
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum alerta no momento. Mercado dentro dos parâmetros normais.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Alertas de Mercado e Clima
          <Badge variant="outline" className="ml-auto">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30"
              >
                <div className="mt-0.5">
                  {alert.category === 'clima' ? (
                    <CloudRain className={`h-4 w-4 ${
                      alert.level === 'critical' ? 'text-destructive' :
                      alert.level === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                    }`} />
                  ) : alert.category === 'volatilidade' ? (
                    <TrendingUp className={`h-4 w-4 ${
                      alert.level === 'critical' ? 'text-destructive' :
                      alert.level === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                    }`} />
                  ) : (
                    getAlertIcon(alert.level)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{alert.title}</span>
                    <Badge variant={getAlertBadgeVariant(alert.level)} className="text-xs">
                      {alert.level === 'critical' ? 'Crítico' :
                       alert.level === 'warning' ? 'Atenção' : 'Info'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{alert.description}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {format(new Date(alert.date), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
