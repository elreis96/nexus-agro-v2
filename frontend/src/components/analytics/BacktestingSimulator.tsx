import { useState, useMemo } from "react";
import { useAnalytics, useExecutiveStats } from "@/hooks/useMarketData";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ReferenceLine } from "recharts";
import { PlayCircle, TrendingUp, TrendingDown } from "lucide-react";
import { format, parseISO } from "date-fns";

type Strategy = "clima-positivo" | "correlacao-inversa" | "volatilidade-alta";

interface BacktestResult {
  date: string;
  price: number;
  signal: "buy" | "sell" | "hold";
  position: number;
  pnl: number;
  cumulativePnl: number;
}

export function BacktestingSimulator() {
  const [strategy, setStrategy] = useState<Strategy>("clima-positivo");
  const [threshold, setThreshold] = useState(50);
  const [results, setResults] = useState<BacktestResult[]>([]);
  const [hasRun, setHasRun] = useState(false);

  const analyticsData = useAnalytics({ period: "6m" });
  const lagChuva = analyticsData?.lagChuva || [];
  const correlacao = analyticsData?.correlacao || [];
  const { data: stats } = useExecutiveStats() || {};

  // Executar backtest
  const runBacktest = () => {
    if (!lagChuva || !Array.isArray(lagChuva) || lagChuva.length === 0) return;

    const backtestResults: BacktestResult[] = [];
    let position = 0; // 0 = sem posição, 1 = comprado
    let entryPrice = 0;
    let cumulativePnl = 0;

    lagChuva.forEach((item, index) => {
      let signal: "buy" | "sell" | "hold" = "hold";

      // Estratégia: Clima Positivo
      if (strategy === "clima-positivo") {
        // Comprar quando chuva > threshold (mm)
        if (item.chuva_lag > threshold && position === 0) {
          signal = "buy";
          position = 1;
          entryPrice = item.preco_boi;
        }
        // Vender quando chuva < threshold
        else if (item.chuva_lag < threshold && position === 1) {
          signal = "sell";
          const pnl = item.preco_boi - entryPrice;
          cumulativePnl += pnl;
          position = 0;
        }
      }

      // Estratégia: Correlação Inversa (usar dólar vs JBS)
      else if (strategy === "correlacao-inversa") {
        const corrItem = correlacao?.[index];
        if (corrItem) {
          // Comprar quando correlação < -0.5 (negativa forte)
          if (corrItem.correlacao < -0.5 && position === 0) {
            signal = "buy";
            position = 1;
            entryPrice = item.preco_boi;
          }
          // Vender quando correlação > 0
          else if (corrItem.correlacao > 0 && position === 1) {
            signal = "sell";
            const pnl = item.preco_boi - entryPrice;
            cumulativePnl += pnl;
            position = 0;
          }
        }
      }

      // Estratégia: Volatilidade Alta
      else if (strategy === "volatilidade-alta") {
        // Simples: comprar em quedas > 2%, vender em altas > 2%
        if (index > 0) {
          const prevPrice = lagChuva[index - 1].preco_boi;
          const change = ((item.preco_boi - prevPrice) / prevPrice) * 100;

          if (change < -2 && position === 0) {
            signal = "buy";
            position = 1;
            entryPrice = item.preco_boi;
          } else if (change > 2 && position === 1) {
            signal = "sell";
            const pnl = item.preco_boi - entryPrice;
            cumulativePnl += pnl;
            position = 0;
          }
        }
      }

      backtestResults.push({
        date: item.data_lag,
        price: item.preco_boi,
        signal,
        position,
        pnl: position === 1 ? item.preco_boi - entryPrice : 0,
        cumulativePnl,
      });
    });

    setResults(backtestResults);
    setHasRun(true);
  };

  // Estatísticas do backtest
  const statistics = useMemo(() => {
    if (results.length === 0) return null;

    const trades = results.filter((r) => r.signal === "buy" || r.signal === "sell");
    const winningTrades = results.filter((r) => r.signal === "sell" && r.pnl > 0);
    const losingTrades = results.filter((r) => r.signal === "sell" && r.pnl < 0);

    const finalPnl = results[results.length - 1]?.cumulativePnl || 0;
    const winRate = trades.length > 0 ? (winningTrades.length / (winningTrades.length + losingTrades.length)) * 100 : 0;
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length) : 0;

    return {
      totalTrades: Math.floor(trades.length / 2), // Pares de buy/sell
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      finalPnl,
      avgWin,
      avgLoss,
      profitFactor: avgLoss > 0 ? avgWin / avgLoss : 0,
    };
  }, [results]);

  return (
    <div className="space-y-6">
      {/* Configurações */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Estratégia</Label>
          <Select value={strategy} onValueChange={(v) => setStrategy(v as Strategy)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="clima-positivo">Clima Positivo (Chuva)</SelectItem>
              <SelectItem value="correlacao-inversa">Correlação Inversa (Dólar-JBS)</SelectItem>
              <SelectItem value="volatilidade-alta">Volatilidade Alta (Mean Reversion)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Threshold: {threshold}mm</Label>
          <Slider
            value={[threshold]}
            onValueChange={(v) => setThreshold(v[0])}
            min={10}
            max={150}
            step={10}
            className="mt-2"
          />
        </div>

        <div className="flex items-end">
          <Button onClick={runBacktest} className="w-full gap-2" disabled={!lagChuva || !Array.isArray(lagChuva) || lagChuva.length === 0}>
            <PlayCircle className="h-4 w-4" />
            Executar Backtest
          </Button>
        </div>
      </div>

      {/* Resultados */}
      {hasRun && statistics && (
        <>
          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-card/50">
              <div className="text-sm text-muted-foreground">Total de Trades</div>
              <div className="text-2xl font-bold mt-1">{statistics.totalTrades}</div>
            </Card>
            <Card className="p-4 bg-card/50">
              <div className="text-sm text-muted-foreground">Win Rate</div>
              <div className={`text-2xl font-bold mt-1 ${statistics.winRate >= 50 ? "text-emerald-400" : "text-red-400"}`}>
                {statistics.winRate.toFixed(1)}%
              </div>
            </Card>
            <Card className="p-4 bg-card/50">
              <div className="text-sm text-muted-foreground">P&L Final</div>
              <div className={`text-2xl font-bold mt-1 ${statistics.finalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                R$ {statistics.finalPnl.toFixed(2)}
              </div>
            </Card>
            <Card className="p-4 bg-card/50">
              <div className="text-sm text-muted-foreground">Profit Factor</div>
              <div className="text-2xl font-bold mt-1">{statistics.profitFactor.toFixed(2)}</div>
            </Card>
          </div>

          {/* Gráfico de P&L */}
          <Card className="p-4 bg-card/50">
            <h4 className="font-medium mb-4">P&L Acumulado</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={results}>
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(parseISO(date), "dd/MM")}
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
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
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="cumulativePnl"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="P&L Acumulado (R$)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Detalhes dos Trades */}
          <Card className="p-4 bg-card/50">
            <h4 className="font-medium mb-4">Últimos Sinais</h4>
            <div className="space-y-2 max-h-[200px] overflow-auto">
              {results
                .filter((r) => r.signal !== "hold")
                .slice(-10)
                .reverse()
                .map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded bg-background/50">
                    <div className="flex items-center gap-3">
                      {result.signal === "buy" ? (
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-400" />
                      )}
                      <span className="text-sm">{format(parseISO(result.date), "dd/MM/yyyy")}</span>
                      <span className="text-sm font-medium">
                        {result.signal === "buy" ? "COMPRA" : "VENDA"}
                      </span>
                    </div>
                    <div className="text-sm font-mono">R$ {result.price.toFixed(2)}</div>
                  </div>
                ))}
            </div>
          </Card>
        </>
      )}

      {/* Placeholder quando não executou */}
      {!hasRun && (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
          <div className="text-center">
            <PlayCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Configure a estratégia e clique em "Executar Backtest"</p>
          </div>
        </div>
      )}
    </div>
  );
}
