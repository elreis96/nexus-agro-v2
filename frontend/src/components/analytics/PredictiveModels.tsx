import { useMemo } from "react";
import { useAnalytics } from "@/hooks/useMarketData";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ReferenceLine, ScatterChart, Scatter } from "recharts";
import { TrendingUp, AlertCircle, Target } from "lucide-react";
import { format, parseISO, addDays } from "date-fns";

interface Prediction {
  date: string;
  actual?: number;
  predicted: number;
  upperBound: number;
  lowerBound: number;
}

// Função para calcular regressão linear simples
function linearRegression(data: { x: number; y: number }[]) {
  const n = data.length;
  const sumX = data.reduce((sum, p) => sum + p.x, 0);
  const sumY = data.reduce((sum, p) => sum + p.y, 0);
  const sumXY = data.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = data.reduce((sum, p) => sum + p.x * p.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

export function PredictiveModels() {
  const analyticsData = useAnalytics({ period: "6m" });
  const lagChuva = analyticsData?.lagChuva || [];

  // Preparar dados para regressão
  const { predictions, regression, statistics } = useMemo(() => {
    if (!lagChuva || !Array.isArray(lagChuva) || lagChuva.length === 0) {
      return { predictions: [], regression: null, statistics: null };
    }

    // Preparar dados (x = index, y = preço)
    const points = lagChuva.map((item, index) => ({
      x: index,
      y: item.preco_boi,
    }));

    // Calcular regressão linear
    const { slope, intercept } = linearRegression(points);

    // Calcular erro padrão
    const predictions = points.map((p) => intercept + slope * p.x);
    const residuals = points.map((p, i) => p.y - predictions[i]);
    const mse = residuals.reduce((sum, r) => sum + r * r, 0) / points.length;
    const stdError = Math.sqrt(mse);

    // Gerar previsões (incluindo dados históricos + 30 dias futuros)
    const futureDays = 30;
    const allPredictions: Prediction[] = [];

    lagChuva.forEach((item, index) => {
      const predicted = intercept + slope * index;
      allPredictions.push({
        date: item.data_lag,
        actual: item.preco_boi,
        predicted,
        upperBound: predicted + 1.96 * stdError, // 95% intervalo de confiança
        lowerBound: predicted - 1.96 * stdError,
      });
    });

    // Adicionar previsões futuras
    const lastDate = parseISO(lagChuva[lagChuva.length - 1].data_lag);
    for (let i = 1; i <= futureDays; i++) {
      const futureIndex = lagChuva.length + i - 1;
      const predicted = intercept + slope * futureIndex;
      allPredictions.push({
        date: format(addDays(lastDate, i), "yyyy-MM-dd"),
        predicted,
        upperBound: predicted + 1.96 * stdError,
        lowerBound: predicted - 1.96 * stdError,
      });
    }

    // Calcular estatísticas
    const r2 = 1 - residuals.reduce((sum, r) => sum + r * r, 0) / 
              points.reduce((sum, p) => sum + Math.pow(p.y - points.reduce((s, pt) => s + pt.y, 0) / points.length, 2), 0);

    const lastActual = lagChuva[lagChuva.length - 1].preco_boi;
    const futurePrice = intercept + slope * (lagChuva.length + futureDays - 1);
    const priceChange = ((futurePrice - lastActual) / lastActual) * 100;

    return {
      predictions: allPredictions,
      regression: { slope, intercept, r2, stdError },
      statistics: {
        lastActual,
        futurePrice,
        priceChange,
        trend: slope > 0 ? "alta" : slope < 0 ? "baixa" : "estável",
      },
    };
  }, [lagChuva]);

  if (!lagChuva || lagChuva.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground">
        <p>Sem dados suficientes para gerar previsões</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas do Modelo */}
      {regression && statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-card/50">
            <div className="text-sm text-muted-foreground">R² (Qualidade do Modelo)</div>
            <div className="text-2xl font-bold mt-1">
              {(regression.r2 * 100).toFixed(1)}%
            </div>
            <Badge variant={regression.r2 > 0.7 ? "default" : regression.r2 > 0.5 ? "secondary" : "destructive"} className="mt-2">
              {regression.r2 > 0.7 ? "Excelente" : regression.r2 > 0.5 ? "Moderado" : "Fraco"}
            </Badge>
          </Card>

          <Card className="p-4 bg-card/50">
            <div className="text-sm text-muted-foreground">Tendência</div>
            <div className="flex items-center gap-2 mt-1">
              {statistics.trend === "alta" ? (
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              ) : (
                <TrendingUp className="h-6 w-6 text-red-400 rotate-180" />
              )}
              <span className="text-2xl font-bold capitalize">{statistics.trend}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {regression.slope > 0 ? "+" : ""}{regression.slope.toFixed(3)} R$/dia
            </div>
          </Card>

          <Card className="p-4 bg-card/50">
            <div className="text-sm text-muted-foreground">Preço Atual</div>
            <div className="text-2xl font-bold mt-1">R$ {statistics.lastActual.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-2">Último registro</div>
          </Card>

          <Card className={`p-4 ${statistics.priceChange >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`}>
            <div className="text-sm text-muted-foreground">Previsão 30 dias</div>
            <div className="text-2xl font-bold mt-1">R$ {statistics.futurePrice.toFixed(2)}</div>
            <div className={`text-xs mt-2 ${statistics.priceChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {statistics.priceChange > 0 ? "+" : ""}{statistics.priceChange.toFixed(1)}%
            </div>
          </Card>
        </div>
      )}

      {/* Gráfico de Previsão */}
      <Card className="p-4 bg-card/50">
        <h4 className="font-medium mb-4">Modelo Preditivo Linear</h4>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={predictions}>
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(parseISO(date), "dd/MM")}
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelFormatter={(date) => format(parseISO(date as string), "dd/MM/yyyy")}
              formatter={(value: number) => `R$ ${value.toFixed(2)}`}
            />
            <Legend />
            <ReferenceLine
              x={predictions.find((p) => !p.actual)?.date}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
              label="Início das Previsões"
            />
            <Line
              type="monotone"
              dataKey="upperBound"
              stroke="#10b981"
              strokeWidth={1}
              strokeDasharray="3 3"
              name="Limite Superior (95%)"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="lowerBound"
              stroke="#ef4444"
              strokeWidth={1}
              strokeDasharray="3 3"
              name="Limite Inferior (95%)"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Preço Real"
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#f59e0b"
              strokeWidth={2}
              name="Previsão"
              dot={{ r: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Insights */}
      <Card className="p-4 bg-blue-500/10 border-blue-500/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-medium text-blue-400">Como Interpretar</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>
                • <strong>R² = {regression && (regression.r2 * 100).toFixed(1)}%:</strong> {
                  regression && regression.r2 > 0.7 
                    ? "O modelo explica bem a variação dos preços" 
                    : "Preços têm alta volatilidade e são difíceis de prever"
                }
              </li>
              <li>
                • <strong>Intervalo de Confiança (95%):</strong> O preço futuro tem 95% de chance de estar entre as linhas pontilhadas
              </li>
              <li>
                • <strong>Limitações:</strong> Modelo linear simples não captura sazonalidade ou eventos extremos (geadas, secas)
              </li>
              <li>
                • <strong>Uso Recomendado:</strong> Combine com análise climática e cenários para decisões mais robustas
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Dispersão (Actual vs Predicted) */}
      <Card className="p-4 bg-card/50">
        <h4 className="font-medium mb-4">Qualidade do Ajuste (Real vs Previsto)</h4>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <XAxis
              type="number"
              dataKey="actual"
              name="Preço Real"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
              label={{ value: "Preço Real (R$)", position: "insideBottom", offset: -10 }}
            />
            <YAxis
              type="number"
              dataKey="predicted"
              name="Preço Previsto"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
              label={{ value: "Preço Previsto (R$)", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number) => `R$ ${value.toFixed(2)}`}
            />
            <ReferenceLine
              segment={[
                { x: 60, y: 60 },
                { x: 80, y: 80 },
              ]}
              stroke="#64748b"
              strokeDasharray="5 5"
              label="Ajuste Perfeito"
            />
            <Scatter
              data={predictions.filter((p) => p.actual !== undefined)}
              fill="#3b82f6"
              name="Pontos"
            />
          </ScatterChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Quanto mais próximo da linha diagonal, melhor o ajuste do modelo
        </p>
      </Card>
    </div>
  );
}
