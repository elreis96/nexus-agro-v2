import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from "recharts";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AIRecommendation {
  id: string;
  date: Date;
  type: "compra" | "venda" | "aguardar" | "hedge";
  title: string;
  rationale: string;
  confidence: number;
  outcome?: "success" | "failure" | "pending";
  profitLoss?: number;
}

// Dados simulados de recomendações históricas
const generateHistoricalRecommendations = (): AIRecommendation[] => {
  const now = new Date();
  return [
    {
      id: "1",
      date: subDays(now, 45),
      type: "compra",
      title: "Compra Boi Gordo - Lag Climático Favorável",
      rationale: "Chuva acima de 90mm nos últimos 60 dias indica pasto favorável. Histórico mostra alta de 8% em 30 dias.",
      confidence: 78,
      outcome: "success",
      profitLoss: 5.2,
    },
    {
      id: "2",
      date: subDays(now, 38),
      type: "hedge",
      title: "Hedge Cambial - Correlação Dólar-JBS Invertida",
      rationale: "Correlação Dólar x JBS negativa (-0.62). Proteção contra volatilidade cambial recomendada.",
      confidence: 85,
      outcome: "success",
      profitLoss: 3.1,
    },
    {
      id: "3",
      date: subDays(now, 30),
      type: "venda",
      title: "Realização de Lucros - Volatilidade Alta",
      rationale: "Volatilidade mensal atingiu 15%. Recomendar saída parcial para proteger ganhos.",
      confidence: 72,
      outcome: "failure",
      profitLoss: -1.8,
    },
    {
      id: "4",
      date: subDays(now, 22),
      type: "aguardar",
      title: "Aguardar - Sinais Mistos",
      rationale: "Correlação positiva mas chuva abaixo da média. Aguardar confirmação climática.",
      confidence: 65,
      outcome: "success",
      profitLoss: 0,
    },
    {
      id: "5",
      date: subDays(now, 15),
      type: "compra",
      title: "Compra JBS - Correlação Positiva com Dólar",
      rationale: "Dólar em alta e correlação +0.85 com JBS. Tendência de valorização forte.",
      confidence: 88,
      outcome: "success",
      profitLoss: 6.7,
    },
    {
      id: "6",
      date: subDays(now, 8),
      type: "hedge",
      title: "Proteção Climática - Previsão de Seca",
      rationale: "Modelos climáticos indicam redução de chuvas. Hedge em commodities correlacionadas.",
      confidence: 80,
      outcome: "pending",
    },
    {
      id: "7",
      date: subDays(now, 3),
      type: "compra",
      title: "Compra Estratégica - Lag de 60 dias Atingido",
      rationale: "Chuvas de outubro impactam preço atual. Janela de oportunidade de 7-10 dias.",
      confidence: 92,
      outcome: "pending",
    },
  ];
};

export function AIInsightsHistory() {
  const recommendations = useMemo(() => generateHistoricalRecommendations(), []);

  // Estatísticas
  const statistics = useMemo(() => {
    const completed = recommendations.filter((r) => r.outcome !== "pending");
    const successful = recommendations.filter((r) => r.outcome === "success");
    const failed = recommendations.filter((r) => r.outcome === "failure");

    const winRate = completed.length > 0 ? (successful.length / completed.length) * 100 : 0;
    const avgConfidence = recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length;
    const totalPnL = recommendations.reduce((sum, r) => sum + (r.profitLoss || 0), 0);

    return {
      total: recommendations.length,
      completed: completed.length,
      successful: successful.length,
      failed: failed.length,
      winRate,
      avgConfidence,
      totalPnL,
    };
  }, [recommendations]);

  // Dados para gráfico de confiança ao longo do tempo
  const confidenceData = useMemo(() => {
    return recommendations.map((r) => ({
      date: format(r.date, "dd/MM"),
      confidence: r.confidence,
      type: r.type,
    }));
  }, [recommendations]);

  // Dados para gráfico de performance
  const performanceData = useMemo(() => {
    let cumulative = 0;
    return recommendations.map((r) => {
      cumulative += r.profitLoss || 0;
      return {
        date: format(r.date, "dd/MM"),
        pnl: r.profitLoss || 0,
        cumulative,
      };
    });
  }, [recommendations]);

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case "compra":
        return <TrendingUp className="h-4 w-4 text-emerald-400" />;
      case "venda":
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      case "hedge":
        return <AlertTriangle className="h-4 w-4 text-orange-400" />;
      default:
        return <Brain className="h-4 w-4 text-blue-400" />;
    }
  };

  const getOutcomeIcon = (outcome?: string) => {
    switch (outcome) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case "failure":
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-orange-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-card/50">
          <div className="text-sm text-muted-foreground">Total de Recomendações</div>
          <div className="text-2xl font-bold mt-1">{statistics.total}</div>
        </Card>
        <Card className="p-4 bg-emerald-500/10 border-emerald-500/20">
          <div className="text-sm text-muted-foreground">Taxa de Acerto</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{statistics.winRate.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground mt-1">
            {statistics.successful} de {statistics.completed} concluídas
          </div>
        </Card>
        <Card className="p-4 bg-card/50">
          <div className="text-sm text-muted-foreground">Confiança Média</div>
          <div className="text-2xl font-bold mt-1">{statistics.avgConfidence.toFixed(0)}%</div>
        </Card>
        <Card className={`p-4 ${statistics.totalPnL >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`}>
          <div className="text-sm text-muted-foreground">P&L Total</div>
          <div className={`text-2xl font-bold mt-1 ${statistics.totalPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {statistics.totalPnL > 0 ? "+" : ""}{statistics.totalPnL.toFixed(1)}%
          </div>
        </Card>
      </div>

      {/* Gráfico de Confiança */}
      <Card className="p-4 bg-card/50">
        <h4 className="font-medium mb-4">Evolução da Confiança da IA</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={confidenceData}>
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="confidence"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Confiança (%)"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Gráfico de Performance Acumulada */}
      <Card className="p-4 bg-card/50">
        <h4 className="font-medium mb-4">Performance Acumulada (P&L)</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={performanceData}>
            <XAxis
              dataKey="date"
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
            />
            <Legend />
            <Bar dataKey="cumulative" fill="#10b981" name="P&L Acumulado (%)" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Timeline de Recomendações */}
      <Card className="p-4 bg-card/50">
        <h4 className="font-medium mb-4">Timeline de Recomendações</h4>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="flex gap-4 p-4 rounded-lg bg-background/50 border border-border/50 hover:border-border transition-colors"
              >
                {/* Icon & Type */}
                <div className="flex flex-col items-center gap-2">
                  {getRecommendationIcon(rec.type)}
                  <Badge variant="outline" className="text-xs">
                    {rec.type.toUpperCase()}
                  </Badge>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-medium">{rec.title}</h5>
                      <p className="text-xs text-muted-foreground">
                        {format(rec.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getOutcomeIcon(rec.outcome)}
                      <Badge variant={rec.outcome === "success" ? "default" : rec.outcome === "failure" ? "destructive" : "secondary"}>
                        {rec.outcome === "success" ? "Acerto" : rec.outcome === "failure" ? "Erro" : "Pendente"}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">{rec.rationale}</p>

                  <div className="flex items-center gap-4">
                    <div className="text-xs">
                      <span className="text-muted-foreground">Confiança: </span>
                      <span className="font-mono font-medium">{rec.confidence}%</span>
                    </div>
                    {rec.profitLoss !== undefined && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">P&L: </span>
                        <span className={`font-mono font-medium ${rec.profitLoss >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {rec.profitLoss > 0 ? "+" : ""}{rec.profitLoss.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Insights sobre a IA */}
      <Card className="p-4 bg-blue-500/10 border-blue-500/20">
        <div className="flex items-start gap-3">
          <Brain className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-medium text-blue-400">Sobre o Motor de IA</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>
                • <strong>Modelo Híbrido:</strong> Combina análise de correlações, lag climático e volatilidade histórica
              </li>
              <li>
                • <strong>Aprendizado Contínuo:</strong> Confiança ajustada com base no histórico de acertos
              </li>
              <li>
                • <strong>Taxa de Acerto Atual:</strong> {statistics.winRate.toFixed(0)}% em {statistics.completed} recomendações concluídas
              </li>
              <li>
                • <strong>Próximos Passos:</strong> Integração com modelos climáticos avançados (ECMWF/NOAA)
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
