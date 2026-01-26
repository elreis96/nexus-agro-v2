import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logger } from "@/lib/logger";
import { Logo } from "@/components/Logo";
import { ExecutiveCard } from "@/components/ExecutiveCard";
import { PeriodSelector } from "@/components/PeriodSelector";
import { IAStrategistPanel } from "@/components/IAStrategistPanel";
import { MarketAlerts } from "@/components/MarketAlerts";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ClimateLagChart } from "@/components/charts/ClimateLagChart";
import { VolatilityBoxplot } from "@/components/charts/VolatilityBoxplot";
import { CorrelationScatter } from "@/components/charts/CorrelationScatter";
import {
  useExecutiveStats,
  useAnalytics, // NEW unified hook
} from "@/hooks/useMarketData";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  Beef,
  CloudRain,
  LogOut,
  Shield,
  User,
} from "lucide-react";
import type { PeriodFilter, DateRange } from "@/lib/types";
import {
  DashboardSkeleton,
  ChartSkeleton,
} from "@/components/DashboardSkeletons";
import { ErrorDisplay } from "@/components/ErrorDisplay";

export default function Dashboard() {
  const [period, setPeriod] = useState<PeriodFilter>("6m");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();

  const { data: stats, isLoading: statsLoading } = useExecutiveStats();

  // Use the new Unified hook to prevent infinite loops
  const {
    volatilidade,
    correlacao,
    lagChuva,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useAnalytics({
    period,
    customRange,
  });

  // Alias loading states to match existing variables
  const volLoading = analyticsLoading;
  const corrLoading = analyticsLoading;
  const lagLoading = analyticsLoading;

  const { profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  // Debug: Log data (only in development)
  useEffect(() => {
    logger.debug('Dashboard Data Updated', {
      component: 'Dashboard',
      stats: !!stats,
      volatilidade: volatilidade?.length || 0,
      correlacao: correlacao?.length || 0,
      lagChuva: lagChuva?.length || 0,
      period,
    });
  }, [stats, volatilidade, correlacao, lagChuva, period]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const isLoadingInitial = statsLoading || (volLoading && period !== "custom");

  // Show full page skeleton only on initial load
  if (isLoadingInitial && !stats) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="flex-1 flex flex-col">
          <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10 h-[73px]" />
          <main className="flex-1 p-6 overflow-auto">
            <DashboardSkeleton />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-2 md:gap-4">
              <span className="hidden md:inline text-sm text-muted-foreground">
                R$ 800M sob gestão
              </span>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />

              {/* User menu */}
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border/50">
                <NotificationCenter />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/profile")}
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {profile?.nome || profile?.email}
                  </span>
                </Button>

                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/admin")}
                    className="gap-1"
                  >
                    <Shield className="h-3 w-3" />
                    <span className="hidden sm:inline">Admin</span>
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  title="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Period Selector */}
          <div className="mb-6">
            <PeriodSelector
              value={period}
              onChange={setPeriod}
              customRange={customRange}
              onCustomRangeChange={setCustomRange}
            />
          </div>

          {/* Error Display */}
          {analyticsError && (
            <div className="mb-6">
              <ErrorDisplay
                title="Erro ao carregar dados"
                message={analyticsError}
                level="error"
                action={{
                  label: "Tentar novamente",
                  onClick: () => {
                    // Trigger refetch by changing period slightly
                    setPeriod(period === "6m" ? "3m" : "6m");
                    setTimeout(() => setPeriod(period), 100);
                  },
                }}
              />
            </div>
          )}

          {/* Executive Cards */}
          <section className="mb-8 animate-fade-in">
            <h2 className="font-display text-xl font-semibold mb-4 text-gradient-gold">
              Visão Geral
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ExecutiveCard
                title="JBS"
                value={stats?.valorJbs || 0}
                date={stats?.dataObservacao}
                icon={<TrendingUp className="h-4 w-4" />}
                format="currency"
              />
              <ExecutiveCard
                title="Boi Gordo"
                value={stats?.valorBoiGordo || 0}
                unit="/@"
                date={stats?.dataObservacao}
                icon={<Beef className="h-4 w-4" />}
                format="currency"
              />
              <ExecutiveCard
                title="Dólar"
                value={stats?.valorDolar || 0}
                date={stats?.dataObservacao}
                icon={<DollarSign className="h-4 w-4" />}
                variant="gold"
                format="number"
              />
              <ExecutiveCard
                title="Chuva 30 dias"
                value={stats?.chuvaAcumulada || 0}
                date={stats?.dataObservacao}
                icon={<CloudRain className="h-4 w-4" />}
                format="mm"
              />
            </div>
          </section>

          {/* Market Alerts */}
          <section className="mb-8 animate-fade-in">
            <MarketAlerts />
          </section>

          {/* Climate Thesis */}
          <section className="mb-8 animate-slide-up">
            <div className="chart-container h-[400px]">
              <h2 className="font-display text-xl font-semibold mb-2 text-gradient-gold">
                Tese Climática
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Relação entre chuva (lag 60 dias) e preço do Boi Gordo - A chuva
                de hoje impacta o preço em ~60 dias
              </p>
              {lagLoading && !lagChuva ? (
                <ChartSkeleton />
              ) : lagChuva && lagChuva.length > 0 ? (
                <ClimateLagChart data={lagChuva} isLoading={lagLoading} />
              ) : (
                <div className="h-[300px] flex items-center justify-center border border-dashed border-border rounded-lg bg-card/30">
                  {analyticsError ? (
                    <ErrorDisplay
                      title="Erro ao carregar dados climáticos"
                      message={analyticsError}
                      level="error"
                      className="max-w-md"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <CloudRain className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="text-lg font-medium mb-1">
                        Sem dados climáticos
                      </p>
                      <p className="text-sm opacity-70">
                        {analyticsLoading ? 'Carregando dados...' : 'Tente selecionar outro período'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Risk Analysis */}
          <section className="mb-8">
            <h2 className="font-display text-xl font-semibold mb-4 text-gradient-gold">
              Análise de Risco
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="chart-container h-[400px]">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Beef className="h-4 w-4 text-primary" />
                  Volatilidade Boi Gordo
                </h3>
                {volLoading && !volatilidade ? (
                  <ChartSkeleton />
                ) : volatilidade && volatilidade.length > 0 ? (
                  <VolatilityBoxplot
                    data={volatilidade}
                    asset="boi"
                    isLoading={volLoading}
                  />
                ) : (
                  <div className="h-[300px] flex items-center justify-center border border-dashed border-border rounded-lg bg-card/30">
                    <div className="text-center text-muted-foreground">
                      <p>📊 Sem dados de volatilidade</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="chart-container h-[400px]">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  Volatilidade Dólar
                </h3>
                {volLoading && !volatilidade ? (
                  <ChartSkeleton />
                ) : volatilidade && volatilidade.length > 0 ? (
                  <VolatilityBoxplot
                    data={volatilidade}
                    asset="dolar"
                    isLoading={volLoading}
                  />
                ) : (
                  <div className="h-[300px] flex items-center justify-center border border-dashed border-border rounded-lg bg-card/30">
                    <div className="text-center text-muted-foreground">
                      <p>📊 Sem dados de volatilidade</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Correlation */}
          <section className="mb-8">
            <div className="chart-container">
              <h2 className="font-display text-xl font-semibold mb-2 text-gradient-gold">
                Correlação de Ativos
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Dólar x JBS - Análise de dependência entre ativos
              </p>
              {corrLoading && !correlacao ? (
                <ChartSkeleton title="Correlação" />
              ) : correlacao && correlacao.length > 0 ? (
                <CorrelationScatter data={correlacao} isLoading={corrLoading} />
              ) : (
                <div className="h-[300px] flex items-center justify-center border border-dashed border-border rounded-lg bg-card/30">
                  <div className="text-center text-muted-foreground">
                    <p className="text-lg mb-2">📊 Sem dados de correlação</p>
                    <p className="text-sm">Período: {period}</p>
                    <p className="text-xs mt-2">
                      Dados: {correlacao?.length || 0} registros
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* IA Strategist Panel */}
      <IAStrategistPanel />
    </div>
  );
}
