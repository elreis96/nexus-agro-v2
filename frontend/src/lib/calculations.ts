/**
 * Módulo de Cálculos Estatísticos
 * 
 * Contém funções para cálculo de correlação e outras estatísticas
 * usadas na análise de ativos do agronegócio.
 */

/**
 * Calcula o coeficiente de correlação de Pearson entre dois arrays
 * 
 * Fórmula: r = Σ[(xi - x̄)(yi - ȳ)] / √[Σ(xi - x̄)² × Σ(yi - ȳ)²]
 * 
 * @param x - Primeiro array de valores
 * @param y - Segundo array de valores
 * @returns Coeficiente de correlação (-1 a 1) ou null se cálculo inválido
 * 
 * Interpretação:
 * - r > 0.7: Correlação forte positiva
 * - 0.4 < r < 0.7: Correlação moderada positiva
 * - 0.2 < r < 0.4: Correlação fraca positiva
 * - -0.2 < r < 0.2: Sem correlação significativa
 * - r < -0.7: Correlação forte negativa
 */
export function calculatePearsonCorrelation(x: number[], y: number[]): number | null {
  if (x.length !== y.length || x.length < 2) {
    return null;
  }

  const n = x.length;
  
  // Calcular médias
  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;
  
  // Calcular numerador e denominador
  let numerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;
  
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    sumSqX += diffX * diffX;
    sumSqY += diffY * diffY;
  }
  
  const denominator = Math.sqrt(sumSqX * sumSqY);
  
  if (denominator === 0) {
    return null;
  }
  
  return numerator / denominator;
}

/**
 * Classifica a força da correlação
 */
export function classifyCorrelation(r: number): {
  strength: 'forte' | 'moderada' | 'fraca' | 'insignificante';
  direction: 'positiva' | 'negativa' | 'nenhuma';
  description: string;
} {
  const absR = Math.abs(r);
  
  let strength: 'forte' | 'moderada' | 'fraca' | 'insignificante';
  let direction: 'positiva' | 'negativa' | 'nenhuma';
  
  if (absR >= 0.7) {
    strength = 'forte';
  } else if (absR >= 0.4) {
    strength = 'moderada';
  } else if (absR >= 0.2) {
    strength = 'fraca';
  } else {
    strength = 'insignificante';
  }
  
  if (r > 0.2) {
    direction = 'positiva';
  } else if (r < -0.2) {
    direction = 'negativa';
  } else {
    direction = 'nenhuma';
  }
  
  const description = direction === 'nenhuma' 
    ? 'Não há correlação significativa entre os ativos.'
    : `Correlação ${strength} ${direction} (r = ${r.toFixed(3)}). ${
        direction === 'positiva' 
          ? 'Quando o dólar sobe, JBS tende a valorizar.' 
          : 'Quando o dólar sobe, JBS tende a desvalorizar.'
      }`;
  
  return { strength, direction, description };
}

/**
 * Formata valor em Real brasileiro
 */
export function formatBRL(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formata porcentagem
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formata data no padrão brasileiro
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Formata período ano-mês para exibição
 */
export function formatYearMonth(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, '0')}`;
}
