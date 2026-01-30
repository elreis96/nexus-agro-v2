import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { DollarSign, TrendingUp, Activity, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { Skeleton } from "@/components/ui/skeleton";

interface KPIData {
  preco: number;
  variacaoPercent: number;
  volatilidade: number;
  correlacao: number;
  pipelineStatus: "online" | "offline";
}

export function KPIGrid() {
  const [data, setData] = useState<KPIData>({
    preco: 65.50,
    variacaoPercent: 2.5,
    volatilidade: 18.3,
    correlacao: 0.72,
    pipelineStatus: "online",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchKPIData = async () => {
      try {
        setIsLoading(true);
        // Simular delay de carregamento
        await new Promise((resolve) => setTimeout(resolve, 500));
        // Usar dados default por enquanto
        logger.debug("KPI Data loaded", { data });
      } catch (error) {
        logger.error("Erro ao carregar KPI data", { error });
      } finally {
        setIsLoading(false);
      }
    };

    fetchKPIData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kpis = [
    {
      label: "Preço Atual (Saca)",
      value: `R$ ${data.preco.toFixed(2)}`,
      unit: "Soja CBOT",
      icon: DollarSign,
      variation: data.variacaoPercent,
      color: "from-green-500/20 to-emerald-500/20",
      borderColor: "border-green-500/30",
      iconColor: "text-green-500",
    },
    {
      label: "Volatilidade Anualizada",
      value: `${data.volatilidade.toFixed(1)}%`,
      unit: "Desvio Padrão",
      icon: TrendingUp,
      variation: -0.8, // Volatilidade diminuiu
      color: "from-orange-500/20 to-yellow-500/20",
      borderColor: "border-orange-500/30",
      iconColor: "text-orange-500",
    },
    {
      label: "Índice de Correlação",
      value: data.correlacao.toFixed(2),
      unit: "Clima-Preço (Pearson)",
      icon: Activity,
      variation: 0.05,
      color: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-500/30",
      iconColor: "text-blue-500",
    },
    {
      label: "Pipeline Status",
      value: data.pipelineStatus === "online" ? "Online" : "Offline",
      unit: "Railway Backend",
      icon: Zap,
      variation: 100,
      isStatus: true,
      color: "from-purple-500/20 to-pink-500/20",
      borderColor:
        data.pipelineStatus === "online"
          ? "border-green-500/30"
          : "border-red-500/30",
      iconColor:
        data.pipelineStatus === "online"
          ? "text-green-500"
          : "text-red-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {isLoading ? (
        // Skeleton Loading State
        [...Array(4)].map((_, idx) => (
          <div
            key={idx}
            className="p-6 rounded-xl border border-slate-800/50 bg-slate-900/50 backdrop-blur-xl shadow-2xl animate-pulse"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))
      ) : (
        kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          const isPositive = kpi.variation > 0 || kpi.isStatus === true;
          const isNegative = kpi.variation < 0;

          return (
            <div
              key={index}
              className={cn(
                "p-6 rounded-xl border border-slate-800/50 bg-slate-900/50 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:shadow-lg hover:scale-105",
                kpi.color,
                kpi.borderColor
              )}
            >
              {/* Header with Icon */}
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {kpi.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{kpi.unit}</p>
                </div>
                <div className={cn("p-2 rounded-lg bg-card/50", kpi.iconColor)}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              {/* Value */}
              <div className="space-y-2">
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>

                {/* Variation Badge */}
                {!kpi.isStatus && (
                  <div
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                      isPositive
                        ? "bg-green-500/20 text-green-600 dark:text-green-400"
                        : isNegative
                          ? "bg-red-500/20 text-red-600 dark:text-red-400"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    <span>{isPositive ? "↑" : isNegative ? "↓" : "→"}</span>
                    <span>
                      {Math.abs(kpi.variation).toFixed(2)}%{" "}
                      {isPositive ? "alta" : isNegative ? "baixa" : ""}
                    </span>
                  </div>
                )}

                {kpi.isStatus && (
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full animate-pulse",
                        data.pipelineStatus === "online"
                          ? "bg-green-500"
                          : "bg-red-500"
                      )}
                    />
                    <span className="text-xs text-muted-foreground">
                      {data.pipelineStatus === "online"
                        ? "Processando dados"
                        : "Indisponível"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
