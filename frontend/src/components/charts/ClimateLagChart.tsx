/**
 * Gráfico de Tese Climática - Lag de 60 Dias
 *
 * Este gráfico visualiza a relação entre chuva e preço do boi gordo
 * com um deslocamento temporal de 60 dias.
 *
 * COMO O LAG FOI APLICADO:
 * - A view view_lag_chuva_60d_boi já traz os dados com o lag calculado
 * - Para cada data_preco (eixo X), mostramos:
 *   - valor_boi_gordo: preço do boi naquela data
 *   - chuva_mm_lag_60d: chuva que ocorreu 60 dias ANTES
 *
 * Isso permite visualizar como a chuva passada se correlaciona
 * com o preço atual do boi gordo.
 */

import { useMemo } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  defs,
  linearGradient,
  stop,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ViewLagChuva60dBoi } from "@/lib/types";

interface ClimateLagChartProps {
  data: ViewLagChuva60dBoi[];
  isLoading?: boolean;
}

export function ClimateLagChart({ data, isLoading }: ClimateLagChartProps) {
  // Calcular média móvel de 7 dias
  const calculateMovingAverage = (
    values: (number | null)[],
    window: number = 7
  ) => {
    return values.map((_, idx) => {
      const start = Math.max(0, idx - Math.floor(window / 2));
      const end = Math.min(values.length, idx + Math.floor(window / 2) + 1);
      const subset = values.slice(start, end).filter((v) => v !== null) as number[];
      return subset.length > 0
        ? subset.reduce((a, b) => a + b, 0) / subset.length
        : null;
    });
  };

  // Processar dados para o gráfico (agrupar por semana para melhor visualização)
  const chartData = useMemo(() => {
    // Debug data reception
    console.log("📉 ClimateLagChart received data:", {
      length: data?.length,
      sample: data?.[0],
    });

    if (!data || data.length === 0) return [];

    // Agrupar por semana para reduzir ruído visual
    const weeklyData: Record<
      string,
      {
        date: string;
        boi: number[];
        chuva: number[];
        isExtremeRain: boolean;
      }
    > = {};

    data.forEach((row) => {
      const date = new Date(row.data_preco);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = format(weekStart, "yyyy-MM-dd");

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          date: weekKey,
          boi: [],
          chuva: [],
          isExtremeRain: false,
        };
      }

      if (row.valor_boi_gordo)
        weeklyData[weekKey].boi.push(row.valor_boi_gordo);
      if (row.chuva_mm_lag_60d) {
        weeklyData[weekKey].chuva.push(row.chuva_mm_lag_60d);
        // Marcar períodos de chuva extrema (> 40mm em um dia)
        if (row.chuva_mm_lag_60d > 40) {
          weeklyData[weekKey].isExtremeRain = true;
        }
      }
    });

    const sorted = Object.entries(weeklyData)
      .map(([date, values]) => ({
        date,
        displayDate: format(new Date(date), "dd/MM", { locale: ptBR }),
        boiGordo:
          values.boi.length > 0
            ? values.boi.reduce((a, b) => a + b, 0) / values.boi.length
            : null,
        chuvaLag60d:
          values.chuva.length > 0
            ? values.chuva.reduce((a, b) => a + b, 0) / values.chuva.length
            : null,
        isExtremeRain: values.isExtremeRain,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate 7-day moving averages
    const boiValues = sorted.map((d) => d.boiGordo);
    const boiMA7 = calculateMovingAverage(boiValues, 7);

    return sorted.map((item, idx) => ({
      ...item,
      boiMA7: boiMA7[idx], // 7-day moving average for price
    }));
  }, [data]);

  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Carregando dados...
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-muted-foreground">
        Sem dados para o período selecionado
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 100, left: 120, bottom: 20 }}
        >
          <defs>
            <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-blue))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-blue))" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.3}
          />

          <XAxis
            dataKey="displayDate"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            tickLine={{ stroke: "hsl(var(--border))" }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            interval="preserveStartEnd"
          />

          {/* Eixo Y esquerdo: Preço do Boi Gordo */}
          <YAxis
            yAxisId="left"
            orientation="left"
            tick={{ fill: "hsl(var(--chart-green))", fontSize: 11 }}
            tickMargin={10}
            tickFormatter={(value: number) => value.toFixed(2)}
            tickLine={{ stroke: "hsl(var(--chart-green))" }}
            axisLine={{ stroke: "hsl(var(--chart-green))" }}
            label={{
              value: "Boi Gordo (R$/@)",
              angle: -90,
              position: "left",
              offset: 0,
              fill: "hsl(var(--chart-green))",
              fontSize: 12,
            }}
            domain={["dataMin - 10", "dataMax + 10"]}
          />

          {/* Eixo Y direito: Chuva (lag 60 dias) */}
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: "hsl(var(--chart-blue))", fontSize: 11 }}
            tickMargin={10}
            tickFormatter={(value: number) => value.toFixed(2)}
            tickLine={{ stroke: "hsl(var(--chart-blue))" }}
            axisLine={{ stroke: "hsl(var(--chart-blue))" }}
            label={{
              value: "Chuva Lag 60d (mm)",
              angle: 90,
              position: "right",
              offset: 0,
              fill: "hsl(var(--chart-blue))",
              fontSize: 12,
            }}
            domain={[0, "dataMax + 10"]}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              boxShadow: "var(--shadow-lg)",
            }}
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
            cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;

              const data = payload[0].payload;
              const boiValue = data.boiGordo ? parseFloat(data.boiGordo).toFixed(2) : "—";
              const chuvaValue = data.chuvaLag60d ? parseFloat(data.chuvaLag60d).toFixed(1) : "—";
              const maValue = data.boiMA7 ? parseFloat(data.boiMA7).toFixed(2) : "—";

              // Calculate variation from previous point
              const prevBoi =
                data.boiGordo && payload[0].payload.boiMA7
                  ? ((parseFloat(data.boiMA7) - parseFloat(data.boiGordo)) /
                      parseFloat(data.boiGordo)) *
                    100
                  : null;

              return (
                <div className="space-y-2 p-3">
                  <p className="font-bold">{data.displayDate}</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-green-600 dark:text-green-400">
                      Boi Gordo: R$ {boiValue}/@
                    </p>
                    <p className="text-green-500/70 text-xs">
                      Média 7d: R$ {maValue}/{" "}
                      {prevBoi !== null
                        ? `${prevBoi > 0 ? "+" : ""}${prevBoi.toFixed(2)}%`
                        : ""}
                    </p>
                    <p className="text-blue-600 dark:text-blue-400">
                      Chuva (60d lag): {chuvaValue} mm
                    </p>
                    {data.isExtremeRain && (
                      <p className="text-orange-600 dark:text-orange-400 font-semibold">
                        ⚠️ Chuva Extrema
                      </p>
                    )}
                  </div>
                </div>
              );
            }}
          />

          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            formatter={(value) => {
              if (value === "boiGordo") return "Preço Boi Gordo";
              if (value === "chuvaLag60d") return "Chuva (Lag 60 dias)";
              return value;
            }}
          />

          {/* Barras de chuva (lag 60 dias) com gradient */}
          <Bar
            yAxisId="right"
            dataKey="chuvaLag60d"
            fill="url(#rainGradient)"
            fillOpacity={0.8}
            radius={[2, 2, 0, 0]}
          />

          {/* Linha do preço do boi gordo (preço real) */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="boiGordo"
            stroke="hsl(var(--chart-green))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "hsl(var(--chart-green))" }}
            name="Preço Diário"
          />

          {/* Linha de média móvel de 7 dias (suavizada) */}
          <Line
            yAxisId="left"
            type="natural"
            dataKey="boiMA7"
            stroke="hsl(var(--chart-green))"
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={false}
            isAnimationActive={false}
            opacity={0.7}
            name="Média 7 Dias"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
