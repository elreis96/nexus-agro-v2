/**
 * Boxplot de Volatilidade Mensal
 * 
 * Visualiza a dispersão dos preços mensais usando quartis:
 * - min: Valor mínimo do mês
 * - q1: Primeiro quartil (25%)
 * - mediana: Valor central (50%)
 * - q3: Terceiro quartil (75%)
 * - max: Valor máximo do mês
 * 
 * A "caixa" do boxplot vai de Q1 a Q3 (contém 50% dos dados),
 * com "whiskers" estendendo até min e max.
 */

import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ErrorBar,
  Cell,
} from 'recharts';
import type { ViewVolatilidadeMensal } from '@/lib/types';
import { formatYearMonth } from '@/lib/calculations';

interface VolatilityBoxplotProps {
  data: ViewVolatilidadeMensal[];
  asset: 'boi' | 'dolar';
  isLoading?: boolean;
}

export function VolatilityBoxplot({ data, asset, isLoading }: VolatilityBoxplotProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map(row => {
      const min = asset === 'boi' ? row.min_boi : row.min_dolar;
      const q1 = asset === 'boi' ? row.q1_boi : row.q1_dolar;
      const mediana = asset === 'boi' ? row.mediana_boi : row.mediana_dolar;
      const q3 = asset === 'boi' ? row.q3_boi : row.q3_dolar;
      const max = asset === 'boi' ? row.max_boi : row.max_dolar;
      
      // Calcular IQR (Interquartile Range) para medir volatilidade
      const iqr = Number(q3) - Number(q1);
      const volatility = iqr / Number(mediana); // Volatilidade relativa
      
      return {
        month: formatYearMonth(row.ano, row.mes),
        min: Number(min),
        q1: Number(q1),
        mediana: Number(mediana),
        q3: Number(q3),
        max: Number(max),
        iqr,
        volatility,
        // Para visualização do boxplot
        boxBottom: Number(q1),
        boxHeight: Number(q3) - Number(q1),
        whiskerLow: Number(q1) - Number(min),
        whiskerHigh: Number(max) - Number(q3),
      };
    });
  }, [data, asset]);
  
  // Identificar meses com maior e menor volatilidade
  const volatilityAnalysis = useMemo(() => {
    if (chartData.length === 0) return null;
    
    const sorted = [...chartData].sort((a, b) => b.volatility - a.volatility);
    return {
      highest: sorted.slice(0, 3).map(d => d.month),
      lowest: sorted.slice(-3).reverse().map(d => d.month),
    };
  }, [chartData]);
  
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando dados...</div>
      </div>
    );
  }
  
  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Sem dados para o período selecionado
      </div>
    );
  }
  
  const color = asset === 'boi' ? 'hsl(var(--chart-green))' : 'hsl(var(--chart-gold))';
  const title = asset === 'boi' ? 'Boi Gordo (R$/@)' : 'Dólar (R$)';
  
  return (
    <div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 60, left: 120, bottom: 52 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            
            <XAxis 
              dataKey="month"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickMargin={10}
              tickFormatter={(value: number) => value.toFixed(2)}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              label={{ 
                value: title, 
                angle: -90, 
                position: 'left',
                offset: 0,
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 12,
              }}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  min: 'Mínimo',
                  q1: 'Q1 (25%)',
                  mediana: 'Mediana',
                  q3: 'Q3 (75%)',
                  max: 'Máximo',
                };
                return [asset === 'boi' ? `R$ ${value.toFixed(2)}/@` : `R$ ${value.toFixed(4)}`, labels[name] || name];
              }}
            />
            
            {/* Caixa do boxplot (Q1 a Q3) */}
            <Bar
              dataKey="boxHeight"
              fill={color}
              opacity={0.7}
              stackId="box"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={volatilityAnalysis?.highest.includes(entry.month) ? 'hsl(var(--chart-red))' : color}
                  opacity={0.7}
                />
              ))}
              <ErrorBar
                dataKey="whiskerLow"
                width={4}
                strokeWidth={1}
                stroke={color}
                direction="y"
              />
            </Bar>
            
            {/* Linha da mediana */}
            <Line
              type="monotone"
              dataKey="mediana"
              stroke="hsl(var(--foreground))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--foreground))', r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Resumo de volatilidade */}
      {volatilityAnalysis && (
        <div className="mt-4 p-3 rounded-lg bg-muted/30 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-chart-red font-medium">Maior volatilidade: </span>
              <span className="text-muted-foreground">{volatilityAnalysis.highest.join(', ')}</span>
            </div>
            <div>
              <span className="text-chart-green font-medium">Menor volatilidade: </span>
              <span className="text-muted-foreground">{volatilityAnalysis.lowest.join(', ')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
