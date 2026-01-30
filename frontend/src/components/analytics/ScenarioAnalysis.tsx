import { useState, useMemo } from "react";
import { useAnalytics } from "@/hooks/useMarketData";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, Area, ComposedChart } from "recharts";
import { CloudRain, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";

interface ScenarioData {
  date: string;
  baseline: number;
  optimistic: number;
  pessimistic: number;
  rainfall: number;
}

export function ScenarioAnalysis() {
  const [rainfallChange, setRainfallChange] = useState(0); // % de mudança
  const [priceImpact, setPriceImpact] = useState(0.3); // Sensibilidade (0.3 = 30% de mudança em chuva = X% no preço)

  const analyticsData = useAnalytics({ period: "6m" });
  const lagChuva = analyticsData?.lagChuva || [];

  // Calcular cenários
  const scenarioData = useMemo<ScenarioData[]>(() => {
    if (!lagChuva || !Array.isArray(lagChuva) || lagChuva.length === 0) return [];

    return lagChuva.map((item) => {
      const baselinePrice = item.preco_boi;
      const baselineRainfall = item.chuva_lag;

      // Cenário otimista: chuva aumenta de forma ideal
      const optimisticRainfall = baselineRainfall * (1 + Math.abs(rainfallChange) / 100);
      const optimisticPrice = baselinePrice * (1 + (Math.abs(rainfallChange) / 100) * priceImpact);

      // Cenário pessimista: chuva diminui
      const pessimisticRainfall = baselineRainfall * (1 - Math.abs(rainfallChange) / 100);
      const pessimisticPrice = baselinePrice * (1 - (Math.abs(rainfallChange) / 100) * priceImpact);

      return {
        date: item.data_lag,
        baseline: baselinePrice,
        optimistic: rainfallChange >= 0 ? optimisticPrice : baselinePrice,
        pessimistic: rainfallChange < 0 ? pessimisticPrice : baselinePrice,
        rainfall: baselineRainfall,
      };
    });
  }, [lagChuva, rainfallChange, priceImpact]);

  // Estatísticas dos cenários
  const statistics = useMemo(() => {
    if (scenarioData.length === 0) return null;

    const avgBaseline = scenarioData.reduce((sum, item) => sum + item.baseline, 0) / scenarioData.length;
    const avgOptimistic = scenarioData.reduce((sum, item) => sum + item.optimistic, 0) / scenarioData.length;
    const avgPessimistic = scenarioData.reduce((sum, item) => sum + item.pessimistic, 0) / scenarioData.length;

    const optimisticGain = ((avgOptimistic - avgBaseline) / avgBaseline) * 100;
    const pessimisticLoss = ((avgPessimistic - avgBaseline) / avgBaseline) * 100;

    return {
      avgBaseline,
      avgOptimistic,
      avgPessimistic,
      optimisticGain,
      pessimisticLoss,
      priceRange: avgOptimistic - avgPessimistic,
    };
  }, [scenarioData]);

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Mudança na Chuva: {rainfallChange > 0 ? "+" : ""}{rainfallChange}%</Label>
          <Slider
            value={[rainfallChange]}
            onValueChange={(v) => setRainfallChange(v[0])}
            min={-50}
            max={50}
            step={5}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground">
            {rainfallChange > 0 ? "Cenário de aumento de chuvas" : rainfallChange < 0 ? "Cenário de seca" : "Cenário base"}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Sensibilidade do Preço: {(priceImpact * 100).toFixed(0)}%</Label>
          <Slider
            value={[priceImpact * 100]}
            onValueChange={(v) => setPriceImpact(v[0] / 100)}
            min={10}
            max={100}
            step={10}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground">
            Quanto o preço do boi reage à mudança climática
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-emerald-500/10 border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Cenário Otimista</span>
            </div>
            <div className="text-2xl font-bold">R$ {statistics.avgOptimistic.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Ganho: {statistics.optimisticGain > 0 ? "+" : ""}{statistics.optimisticGain.toFixed(1)}%
            </div>
          </Card>

          <Card className="p-4 bg-card/50">
            <div className="flex items-center gap-2 mb-2">
              <CloudRain className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Cenário Base</span>
            </div>
            <div className="text-2xl font-bold">R$ {statistics.avgBaseline.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-1">Média histórica</div>
          </Card>

          <Card className="p-4 bg-red-500/10 border-red-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">Cenário Pessimista</span>
            </div>
            <div className="text-2xl font-bold">R$ {statistics.avgPessimistic.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Perda: {statistics.pessimisticLoss.toFixed(1)}%
            </div>
          </Card>
        </div>
      )}

      {/* Gráfico de Cenários */}
      <Card className="p-4 bg-card/50">
        <h4 className="font-medium mb-4">Comparação de Cenários</h4>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={scenarioData}>
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(parseISO(date), "dd/MM")}
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
              label={{ value: "Preço (R$)", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelFormatter={(date) => format(parseISO(date as string), "dd/MM/yyyy")}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="optimistic"
              fill="#10b98140"
              stroke="#10b981"
              strokeWidth={0}
              name="Otimista"
            />
            <Area
              type="monotone"
              dataKey="pessimistic"
              fill="#ef444440"
              stroke="#ef4444"
              strokeWidth={0}
              name="Pessimista"
            />
            <Line
              type="monotone"
              dataKey="baseline"
              stroke="#64748b"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Base"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* Insights */}
      <Card className="p-4 bg-blue-500/10 border-blue-500/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-medium text-blue-400">Insights da Análise</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>
                • <strong>Amplitude de Risco:</strong> R$ {statistics?.priceRange.toFixed(2)} entre melhor e pior cenário
              </li>
              <li>
                • <strong>Correlação Climática:</strong> Cada {priceImpact * 100}% de mudança na chuva impacta o preço proporcionalmente
              </li>
              <li>
                • <strong>Uso Estratégico:</strong> {rainfallChange > 0 
                    ? "Aumento de chuvas favorece preços (melhor pasto)"
                    : rainfallChange < 0
                    ? "Redução de chuvas pressiona preços para baixo"
                    : "Utilize os sliders para simular diferentes cenários climáticos"
                }
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
