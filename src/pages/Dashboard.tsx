import { DashboardSkeleton, ChartSkeleton } from "@/components/DashboardSkeletons";

// ... inside Dashboard component

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

  // ... inside return JSX

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
                  <div className="text-center text-muted-foreground">
                    <CloudRain className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-lg font-medium mb-1">Sem dados climáticos</p>
                    <p className="text-sm opacity-70">Tente selecionar outro período</p>
                  </div>
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
                <ChartSkeleton />
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
