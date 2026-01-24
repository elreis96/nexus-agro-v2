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
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ViewLagChuva60dBoi } from "@/lib/types";

interface ClimateLagChartProps {
  data: ViewLagChuva60dBoi[];
  isLoading?: boolean;
}

export function ClimateLagChart({ data, isLoading }: ClimateLagChartProps) {
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

    return Object.entries(weeklyData)
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
          margin={{ top: 20, right: 60, left: 20, bottom: 20 }}
        >
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
            tickLine={{ stroke: "hsl(var(--chart-green))" }}
            axisLine={{ stroke: "hsl(var(--chart-green))" }}
            label={{
              value: "Boi Gordo (R$/@)",
              angle: -90,
              position: "insideLeft",
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
            tickLine={{ stroke: "hsl(var(--chart-blue))" }}
            axisLine={{ stroke: "hsl(var(--chart-blue))" }}
            label={{
              value: "Chuva Lag 60d (mm)",
              angle: 90,
              position: "insideRight",
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
            labelStyle={{ color: "hsl(var(--foreground))" }}
            formatter={(value: number, name: string) => {
              if (name === "boiGordo")
                return [`R$ ${value.toFixed(2)}/@`, "Boi Gordo"];
              if (name === "chuvaLag60d")
                return [`${value.toFixed(1)} mm`, "Chuva (60d atrás)"];
              return [value, name];
            }}
            labelFormatter={(label) => `Semana: ${label}`}
          />

          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            formatter={(value) => {
              if (value === "boiGordo") return "Preço Boi Gordo";
              if (value === "chuvaLag60d") return "Chuva (Lag 60 dias)";
              return value;
            }}
          />

          {/* Barras de chuva (lag 60 dias) */}
          <Bar
            yAxisId="right"
            dataKey="chuvaLag60d"
            fill="hsl(var(--chart-blue))"
            opacity={0.6}
            radius={[2, 2, 0, 0]}
          />

          {/* Linha do preço do boi gordo */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="boiGordo"
            stroke="hsl(var(--chart-green))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "hsl(var(--chart-green))" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
