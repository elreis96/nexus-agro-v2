import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, GitBranch, Sparkles, TrendingUp, Brain } from "lucide-react";
import { CorrelationMatrix } from "@/components/analytics/CorrelationMatrix";
import { BacktestingSimulator } from "@/components/analytics/BacktestingSimulator";
import { ScenarioAnalysis } from "@/components/analytics/ScenarioAnalysis";
import { PredictiveModels } from "@/components/analytics/PredictiveModels";
import { AIInsightsHistory } from "@/components/analytics/AIInsightsHistory";

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("correlation");

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-7xl space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-bold text-gradient-gold">
            Analytics Avançado
          </h1>
          <p className="text-muted-foreground">
            Análises profundas, backtesting de estratégias e predições baseadas em IA
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid bg-card/70 backdrop-blur-sm border border-border/40 rounded-lg px-3 py-2 gap-2">
            <TabsTrigger
              value="correlation"
              className="gap-2 px-3 py-2 rounded-md text-sm transition data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/30 data-[state=inactive]:text-muted-foreground hover:bg-muted/40"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Correlações</span>
            </TabsTrigger>
            <TabsTrigger
              value="backtest"
              className="gap-2 px-3 py-2 rounded-md text-sm transition data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/30 data-[state=inactive]:text-muted-foreground hover:bg-muted/40"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Backtesting</span>
            </TabsTrigger>
            <TabsTrigger
              value="scenarios"
              className="gap-2 px-3 py-2 rounded-md text-sm transition data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/30 data-[state=inactive]:text-muted-foreground hover:bg-muted/40"
            >
              <GitBranch className="h-4 w-4" />
              <span className="hidden sm:inline">Cenários</span>
            </TabsTrigger>
            <TabsTrigger
              value="predictions"
              className="gap-2 px-3 py-2 rounded-md text-sm transition data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/30 data-[state=inactive]:text-muted-foreground hover:bg-muted/40"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Predições</span>
            </TabsTrigger>
            <TabsTrigger
              value="ai-insights"
              className="gap-2 px-3 py-2 rounded-md text-sm transition data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/30 data-[state=inactive]:text-muted-foreground hover:bg-muted/40"
            >
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">IA Insights</span>
            </TabsTrigger>
          </TabsList>

          {/* Correlation Matrix */}
          <TabsContent value="correlation" className="space-y-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Matriz de Correlação Expandida</CardTitle>
                <CardDescription>
                  Visualização das correlações entre todos os ativos e variáveis climáticas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CorrelationMatrix />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backtesting */}
          <TabsContent value="backtest" className="space-y-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Simulador de Estratégias</CardTitle>
                <CardDescription>
                  Teste estratégias de trading baseadas em sinais climáticos e correlações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BacktestingSimulator />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scenarios */}
          <TabsContent value="scenarios" className="space-y-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Análise de Cenários</CardTitle>
                <CardDescription>
                  Simule diferentes cenários climáticos e veja o impacto nos ativos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScenarioAnalysis />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Predictions */}
          <TabsContent value="predictions" className="space-y-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Modelos Preditivos</CardTitle>
                <CardDescription>
                  Previsões baseadas em regressão linear e análise de tendências
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PredictiveModels />
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Insights */}
          <TabsContent value="ai-insights" className="space-y-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Histórico de Insights da IA</CardTitle>
                <CardDescription>
                  Timeline de recomendações, taxa de acerto e evolução da confiança
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AIInsightsHistory />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
