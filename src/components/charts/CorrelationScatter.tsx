/**
 * Scatter Plot de Correlação Dólar x JBS
 * 
 * Visualiza a relação entre o preço do dólar e as ações da JBS,
 * calculando e exibindo o coeficiente de correlação de Pearson.
 * 
 * A correlação é calculada usando a fórmula:
 * r = Σ[(xi - x̄)(yi - ȳ)] / √[Σ(xi - x̄)² × Σ(yi - ȳ)²]
 */

import { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { ViewCorrelacaoDolarJbs } from '@/lib/types';
import { calculatePearsonCorrelation, classifyCorrelation, formatDate } from '@/lib/calculations';

interface CorrelationScatterProps {
  data: ViewCorrelacaoDolarJbs[];
  isLoading?: boolean;
}

export function CorrelationScatter({ data, isLoading }: CorrelationScatterProps) {
  const { chartData, correlation, analysis, stats } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], correlation: null, analysis: null, stats: null };
    }
    
    const chartData = data.map(row => ({
      x: Number(row.valor_dolar),
      y: Number(row.valor_jbs),
      date: row.data_fk,
    }));
    
    const xValues = chartData.map(d => d.x);
    const yValues = chartData.map(d => d.y);
    
    const correlation = calculatePearsonCorrelation(xValues, yValues);
    const analysis = correlation !== null ? classifyCorrelation(correlation) : null;
    
    // Calcular estatísticas para linhas de referência
    const stats = {
      meanX: xValues.reduce((a, b) => a + b, 0) / xValues.length,
      meanY: yValues.reduce((a, b) => a + b, 0) / yValues.length,
    };
    
    return { chartData, correlation, analysis, stats };
  }, [data]);
  
  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando dados...</div>
      </div>
    );
  }
  
  if (chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-muted-foreground">
        Sem dados para o período selecionado
      </div>
    );
  }
  
  const getCorrelationColor = () => {
    if (!correlation) return 'text-muted-foreground';
    if (Math.abs(correlation) >= 0.7) return correlation > 0 ? 'text-chart-green' : 'text-chart-red';
    if (Math.abs(correlation) >= 0.4) return 'text-chart-gold';
    return 'text-muted-foreground';
  };
  
  return (
    <div>
      {/* Badge de correlação */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Coeficiente de Pearson:</span>
          <span className={`font-display text-2xl font-bold ${getCorrelationColor()}`}>
            {correlation !== null ? correlation.toFixed(3) : 'N/A'}
          </span>
        </div>
        {analysis && (
          <div className="px-3 py-1 rounded-full bg-muted text-sm">
            <span className="font-medium capitalize">{analysis.strength}</span>
            {analysis.direction !== 'nenhuma' && (
              <span className="text-muted-foreground"> • {analysis.direction}</span>
            )}
          </div>
        )}
      </div>
      
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            
            <XAxis 
              type="number"
              dataKey="x"
              name="Dólar"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              label={{ 
                value: 'Dólar (R$)', 
                position: 'insideBottom',
                offset: -10,
                fill: 'hsl(var(--chart-gold))',
                fontSize: 12,
              }}
              domain={['dataMin - 0.1', 'dataMax + 0.1']}
            />
            
            <YAxis 
              type="number"
              dataKey="y"
              name="JBS"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              label={{ 
                value: 'JBS (R$)', 
                angle: -90, 
                position: 'insideLeft',
                fill: 'hsl(var(--chart-green))',
                fontSize: 12,
              }}
              domain={['dataMin - 1', 'dataMax + 1']}
            />
            
            {/* Linhas de referência nas médias */}
            {stats && (
              <>
                <ReferenceLine 
                  x={stats.meanX} 
                  stroke="hsl(var(--chart-gold))" 
                  strokeDasharray="5 5" 
                  opacity={0.5}
                />
                <ReferenceLine 
                  y={stats.meanY} 
                  stroke="hsl(var(--chart-green))" 
                  strokeDasharray="5 5" 
                  opacity={0.5}
                />
              </>
            )}
            
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'Dólar') return [`R$ ${value.toFixed(4)}`, 'Dólar'];
                if (name === 'JBS') return [`R$ ${value.toFixed(2)}`, 'JBS'];
                return [value, name];
              }}
              labelFormatter={(_, payload) => {
                if (payload?.[0]?.payload?.date) {
                  return `Data: ${formatDate(payload[0].payload.date)}`;
                }
                return '';
              }}
            />
            
            <Scatter 
              data={chartData}
              fill="hsl(var(--primary))"
              fillOpacity={0.7}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      {/* Interpretação para o gestor */}
      {analysis && (
        <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border/50">
          <h4 className="font-medium text-sm text-accent mb-2">Interpretação para o Gestor</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {analysis.description}
            {correlation && correlation > 0.4 && (
              <span className="block mt-2">
                Para o fundo, isso significa que movimentos no câmbio podem ser usados como 
                indicador antecedente para posicionamento em ações JBS.
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
