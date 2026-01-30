import { useCurrentMarketData } from '@/hooks/useMarketData';
import { gerarRecomendacaoEstrategica, formatConfidence, getRecommendationClass } from '@/lib/strategist';
import { formatBRL, formatDate } from '@/lib/calculations';
import { Brain, TrendingUp, TrendingDown, Minus, RefreshCw, CloudRain, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function IAStrategistPanel() {
  const { data, isLoading, refetch, dataUpdatedAt } = useCurrentMarketData();
  
  const recommendation = data ? gerarRecomendacaoEstrategica(data) : null;
  
  const RecommendationIcon = recommendation?.type === 'increase' 
    ? TrendingUp 
    : recommendation?.type === 'decrease' 
    ? TrendingDown 
    : Minus;
  
  return (
    <div className="strategist-panel h-full w-80 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="h-5 w-5 text-accent" />
          <h2 className="font-display text-lg font-semibold text-gradient-gold">IA Strategist</h2>
        </div>
        <p className="text-xs text-muted-foreground">Recomendação automatizada</p>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-20 bg-muted/50 rounded-lg" />
            <div className="h-32 bg-muted/50 rounded-lg" />
          </div>
        ) : recommendation && data ? (
          <>
            {/* Recommendation Card */}
            <div className={`${getRecommendationClass(recommendation.type)} rounded-lg p-4`}>
              <div className="flex items-center gap-3 mb-3">
                <RecommendationIcon className="h-6 w-6" />
                <span className="font-display text-lg font-bold">{recommendation.title}</span>
              </div>
              <p className="text-sm leading-relaxed opacity-90">{recommendation.rationale}</p>
              <div className="mt-3 pt-3 border-t border-current/20 flex justify-between text-xs opacity-75">
                <span>Confiança: {formatConfidence(recommendation.confidence)}</span>
              </div>
            </div>
            
            {/* Current Data */}
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dados Atuais</h3>
              
              <div className="grid gap-2">
                <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                  <span className="text-xs text-muted-foreground">Boi Gordo</span>
                  <span className="font-mono text-sm">{formatBRL(data.ultimoBoiGordo)}/@ </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                  <span className="text-xs text-muted-foreground">JBS</span>
                  <span className="font-mono text-sm">{formatBRL(data.ultimoJbs)}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Dólar</span>
                  </div>
                  <span className="font-mono text-sm">{formatBRL(data.ultimoDolar, 4)}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                  <div className="flex items-center gap-1">
                    <CloudRain className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Chuva 30d</span>
                  </div>
                  <span className="font-mono text-sm">{data.chuvaAcumulada30d.toFixed(0)} mm</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground py-8">Sem dados disponíveis</div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-border/50">
        <Button variant="outline" size="sm" onClick={() => refetch()} className="w-full gap-2">
          <RefreshCw className="h-3 w-3" />
          Atualizar
        </Button>
        {dataUpdatedAt && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Atualizado: {new Date(dataUpdatedAt).toLocaleTimeString('pt-BR')}
          </p>
        )}
      </div>
    </div>
  );
}
