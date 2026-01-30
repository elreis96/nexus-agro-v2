import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertTriangle,
  TrendingDown,
  Target,
  Zap,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskCalculation {
  production: number;
  currentPrice: number;
  volatility: number;
  confidence: number;
  var95: number;
  var99: number;
  breakeven: number;
  potentialLoss: number;
  potentialGain: number;
  riskReward: number;
  recommendation: string;
}

const DEFAULT_PRICE = 65.50;
const DEFAULT_VOLATILITY = 18.3;

export default function RiskTerminal() {
  const [production, setProduction] = useState<number>(1000); // sacas
  const [currentPrice, setCurrentPrice] = useState<number>(DEFAULT_PRICE);
  const [volatility, setVolatility] = useState<number>(DEFAULT_VOLATILITY);
  const [confidence, setConfidence] = useState<number>(95);

  const calculations = useMemo<RiskCalculation>(() => {
    // VaR Calculation using historical volatility and normal distribution approximation
    // VaR = Price * Volatility * Z-score * sqrt(days/252)
    
    // Z-scores for different confidence levels
    const zScores: Record<number, number> = {
      90: 1.28,
      95: 1.645,
      99: 2.33,
    };

    const zScore = zScores[confidence] || 1.645;
    const dailyVolatility = volatility / Math.sqrt(252); // Convert annual to daily
    const priceChange = currentPrice * dailyVolatility * zScore;

    // VaR at different confidence levels
    const var95 = currentPrice - currentPrice * dailyVolatility * 1.645;
    const var99 = currentPrice - currentPrice * dailyVolatility * 2.33;

    // Break-even: price at which profit = 0
    const breakeven = currentPrice;

    // Loss/Gain scenarios (1-day horizon)
    const potentialLoss = production * priceChange;
    const potentialGain = production * priceChange;

    // Risk/Reward ratio
    const riskReward =
      potentialGain > 0 ? Math.abs(potentialLoss) / potentialGain : 0;

    // Recommendation logic
    let recommendation = "NEUTRO";
    if (riskReward < 1) {
      recommendation = "COMPRAR PROTEÇÃO";
    } else if (riskReward > 2) {
      recommendation = "ACEITAR RISCO";
    }

    return {
      production,
      currentPrice,
      volatility,
      confidence,
      var95,
      var99,
      breakeven,
      potentialLoss,
      potentialGain,
      riskReward,
      recommendation,
    };
  }, [production, currentPrice, volatility, confidence]);

  const portfolioValue = production * currentPrice;
  const maxLoss95 = portfolioValue * ((DEFAULT_VOLATILITY / 100) * 1.645);

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-gradient-green">
              Terminal de Gestão de Risco
            </h1>
            <p className="text-xs text-muted-foreground">
              Simulador de VaR, Break-even e Análise de Portfólio
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Input Section */}
          <div className="grid md:grid-cols-4 gap-4">
            {/* Production Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Produção (Sacas)
              </label>
              <input
                type="number"
                placeholder="Ex: 1000"
                value={production}
                onChange={(e) => setProduction(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border border-border/50 bg-card/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground">
                {production.toLocaleString()} sacas
              </p>
            </div>

            {/* Current Price Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Preço Atual (R$/Saca)
              </label>
              <input
                type="number"
                placeholder="Ex: 65.50"
                step="0.01"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border border-border/50 bg-card/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground">
                R$ {currentPrice.toFixed(2)}
              </p>
            </div>

            {/* Volatility Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Volatilidade Anualizada (%)
              </label>
              <input
                type="number"
                placeholder="Ex: 18.3"
                step="0.1"
                value={volatility}
                onChange={(e) => setVolatility(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border border-border/50 bg-card/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground">
                {volatility.toFixed(1)}% ao ano
              </p>
            </div>

            {/* Confidence Level */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Nível de Confiança
              </label>
              <select
                title="Selecione o nível de confiança"
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border border-border/50 bg-card/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={90}>90%</option>
                <option value={95}>95%</option>
                <option value={99}>99%</option>
              </select>
              <p className="text-xs text-muted-foreground">
                {confidence}% confiança
              </p>
            </div>
          </div>

          {/* KPI Results Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Portfolio Value */}
            <Card className="p-6 space-y-4 border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Valor do Portfólio
                </h3>
                <Zap className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-foreground">
                R$ {(portfolioValue / 1000).toFixed(1)}k
              </p>
              <p className="text-xs text-muted-foreground">
                {production.toLocaleString()} sacas @ R$ {currentPrice.toFixed(2)}
              </p>
            </Card>

            {/* VaR 95% */}
            <Card className="p-6 space-y-4 border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-yellow-500/10">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                  VaR 95%
                </h3>
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-3xl font-bold text-orange-500">
                R$ {(maxLoss95 / 1000).toFixed(1)}k
              </p>
              <p className="text-xs text-muted-foreground">
                Perda máxima esperada com 95% de confiança
              </p>
            </Card>

            {/* Risk/Reward */}
            <Card className="p-6 space-y-4 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Risco/Retorno
                </h3>
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-blue-500">
                {calculations.riskReward.toFixed(2)}:1
              </p>
              <p className="text-xs text-muted-foreground">
                Razão risco vs. oportunidade
              </p>
            </Card>
          </div>

          {/* Recommendation */}
          <Card className="p-6 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Recomendação
                </h3>
                <Target className="w-5 h-5 text-purple-500" />
              </div>

              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "px-4 py-2 rounded-lg font-bold text-white",
                    calculations.recommendation === "COMPRAR PROTEÇÃO"
                      ? "bg-red-500"
                      : calculations.recommendation === "ACEITAR RISCO"
                        ? "bg-green-500"
                        : "bg-yellow-500"
                  )}
                >
                  {calculations.recommendation}
                </div>

                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    Break-even: <strong>R$ {calculations.breakeven.toFixed(2)}</strong>
                  </p>
                  <p>
                    Volatilidade Esperada:{" "}
                    <strong>{volatility.toFixed(1)}%</strong>
                  </p>
                </div>
              </div>

              {/* Explanation */}
              <div className="p-4 rounded-lg bg-card/50 border border-border/30 text-sm text-muted-foreground space-y-2">
                <p>
                  Com {production.toLocaleString()} sacas ao preço de R${" "}
                  {currentPrice.toFixed(2)}, seu portfólio está exposto a uma
                  volatilidade de {volatility.toFixed(1)}% ao ano.
                </p>
                <p>
                  A máxima perda esperada em um dia com 95% de confiança é de R${" "}
                  {(maxLoss95 / 1000).toFixed(1)}k ({((maxLoss95 / portfolioValue) * 100).toFixed(2)}% do portfólio).
                </p>
                <p>
                  {calculations.recommendation === "COMPRAR PROTEÇÃO"
                    ? "Considere implementar strategies de hedge (futuros ou opções) para reduzir sua exposição."
                    : calculations.recommendation === "ACEITAR RISCO"
                      ? "Seu perfil de risco/retorno é favorável. Mantenha a exposição."
                      : "Monitore continuamente as mudanças de volatilidade."}
                </p>
              </div>
            </div>
          </Card>

          {/* Scenario Analysis */}
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Análise de Cenários
            </h3>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  label: "Melhor Caso (+2σ)",
                  change: volatility * 2,
                  color: "text-green-500",
                },
                {
                  label: "Caso Base",
                  change: 0,
                  color: "text-yellow-500",
                },
                {
                  label: "Pior Caso (-2σ)",
                  change: -(volatility * 2),
                  color: "text-red-500",
                },
              ].map((scenario, idx) => {
                const priceChange = (currentPrice * scenario.change) / 100;
                const newPrice = currentPrice + priceChange;
                const totalValue = production * newPrice;
                const plDifference = totalValue - portfolioValue;

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border border-border/50 bg-card/30 space-y-3"
                  >
                    <p className="text-sm font-medium text-muted-foreground">
                      {scenario.label}
                    </p>
                    <div>
                      <p className={cn("text-2xl font-bold", scenario.color)}>
                        R$ {newPrice.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {scenario.change > 0 ? "+" : ""}{scenario.change.toFixed(1)}%
                      </p>
                    </div>
                    <div className="pt-2 border-t border-border/30">
                      <p className="text-xs text-muted-foreground mb-1">
                        Portfólio:
                      </p>
                      <p
                        className={cn(
                          "text-lg font-bold",
                          plDifference > 0
                            ? "text-green-500"
                            : plDifference < 0
                              ? "text-red-500"
                              : "text-foreground"
                        )}
                      >
                        R$ {(totalValue / 1000).toFixed(1)}k
                      </p>
                      <p
                        className={cn(
                          "text-xs",
                          plDifference > 0
                            ? "text-green-500"
                            : plDifference < 0
                              ? "text-red-500"
                              : "text-muted-foreground"
                        )}
                      >
                        {plDifference > 0 ? "+" : ""}
                        R$ {(plDifference / 1000).toFixed(1)}k
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </main>
    </DashboardLayout>
  );
}
