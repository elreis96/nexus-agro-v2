/**
 * IA Strategist - Módulo de Recomendação Estratégica
 * 
 * Este módulo implementa a lógica de recomendação para o painel IA Strategist.
 * A recomendação é baseada em regras configuráveis que analisam:
 * - Níveis de preço do boi gordo
 * - Taxa de câmbio (dólar)
 * - Condições climáticas (chuva acumulada)
 * - Preço das ações JBS
 * 
 * Thresholds são configuráveis para ajuste futuro pelo time de gestão.
 */

import { CurrentMarketData, RecommendationType, StrategistRecommendation } from './types';

// ============================================
// CONFIGURAÇÃO DE THRESHOLDS
// Estes valores podem ser ajustados pelo time de gestão
// ============================================

const THRESHOLDS = {
  // Preço do Boi Gordo (R$/@)
  boiGordo: {
    baixo: 270,    // Abaixo = preço atrativo para compra
    alto: 310,     // Acima = preço elevado, considerar venda
  },
  
  // Dólar (R$)
  dolar: {
    baixo: 5.2,    // Abaixo = dólar fraco, favorece exportação
    alto: 5.8,     // Acima = dólar forte, pode pressionar custos
  },
  
  // Chuva acumulada 30 dias (mm)
  chuva: {
    seca: 30,      // Abaixo = período seco, alerta para pastagem
    normal: 100,   // Entre seca e excesso = condição ideal
    excesso: 200,  // Acima = excesso de chuva, pode impactar logística
  },
  
  // JBS (R$)
  jbs: {
    baixo: 22,     // Abaixo = ação desvalorizada
    alto: 28,      // Acima = ação em alta
  },
};

/**
 * Gera a recomendação estratégica baseada nos dados atuais de mercado
 * 
 * @param dados - Dados atuais de mercado (preços, clima)
 * @returns Recomendação estruturada com tipo, título, racional e confiança
 * 
 * Lógica de decisão:
 * 1. Analisa cada variável individualmente
 * 2. Atribui pontuação para cada fator (positivo = aumentar, negativo = reduzir)
 * 3. Combina os fatores para decisão final
 */
export function gerarRecomendacaoEstrategica(
  dados: CurrentMarketData
): StrategistRecommendation {
  let score = 0; // Positivo = aumentar, Negativo = reduzir
  const fatores: string[] = [];
  
  // ============================================
  // Análise do Boi Gordo
  // ============================================
  if (dados.ultimoBoiGordo < THRESHOLDS.boiGordo.baixo) {
    score += 2;
    fatores.push(`Boi gordo em R$ ${dados.ultimoBoiGordo.toFixed(2)}/@ representa oportunidade de entrada`);
  } else if (dados.ultimoBoiGordo > THRESHOLDS.boiGordo.alto) {
    score -= 1;
    fatores.push(`Boi gordo elevado a R$ ${dados.ultimoBoiGordo.toFixed(2)}/@ sugere realização parcial`);
  }
  
  // ============================================
  // Análise do Dólar
  // Dólar forte favorece exportadores como JBS
  // ============================================
  if (dados.ultimoDolar > THRESHOLDS.dolar.alto) {
    score += 1;
    fatores.push(`Dólar forte a R$ ${dados.ultimoDolar.toFixed(2)} beneficia exportadores`);
  } else if (dados.ultimoDolar < THRESHOLDS.dolar.baixo) {
    score -= 1;
    fatores.push(`Dólar fraco a R$ ${dados.ultimoDolar.toFixed(2)} pode pressionar margens de exportação`);
  }
  
  // ============================================
  // Análise Climática
  // Chuva adequada = pastagem saudável = menor custo de confinamento
  // ============================================
  if (dados.chuvaAcumulada30d < THRESHOLDS.chuva.seca) {
    score -= 1;
    fatores.push(`Período seco (${dados.chuvaAcumulada30d.toFixed(0)}mm/30d) pode elevar custos de produção`);
  } else if (dados.chuvaAcumulada30d > THRESHOLDS.chuva.excesso) {
    score -= 1;
    fatores.push(`Excesso de chuva (${dados.chuvaAcumulada30d.toFixed(0)}mm/30d) pode afetar logística`);
  } else if (dados.chuvaAcumulada30d >= THRESHOLDS.chuva.seca && dados.chuvaAcumulada30d <= THRESHOLDS.chuva.normal) {
    score += 1;
    fatores.push(`Condições climáticas favoráveis com ${dados.chuvaAcumulada30d.toFixed(0)}mm de chuva`);
  }
  
  // ============================================
  // Análise JBS
  // ============================================
  if (dados.ultimoJbs < THRESHOLDS.jbs.baixo) {
    score += 1;
    fatores.push(`JBS a R$ ${dados.ultimoJbs.toFixed(2)} apresenta potencial de valorização`);
  } else if (dados.ultimoJbs > THRESHOLDS.jbs.alto) {
    fatores.push(`JBS em alta a R$ ${dados.ultimoJbs.toFixed(2)}, monitorar níveis de resistência`);
  }
  
  // ============================================
  // Determinação da Recomendação Final
  // ============================================
  let type: RecommendationType;
  let title: string;
  let confidence: number;
  
  if (score >= 2) {
    type = 'increase';
    title = 'Aumentar Exposição';
    confidence = Math.min(0.85, 0.6 + (score * 0.08));
  } else if (score <= -2) {
    type = 'decrease';
    title = 'Reduzir Exposição';
    confidence = Math.min(0.85, 0.6 + (Math.abs(score) * 0.08));
  } else {
    type = 'maintain';
    title = 'Manter Posição';
    confidence = 0.65;
  }
  
  // Construir racional executivo (máximo 3 fatores mais relevantes)
  const rationaleParts = fatores.slice(0, 2);
  const rationale = rationaleParts.length > 0 
    ? rationaleParts.join('. ') + '.'
    : 'Mercado em equilíbrio, sem sinais claros de direção. Manter posições atuais e aguardar novos dados.';
  
  return {
    type,
    title,
    rationale,
    confidence,
    updatedAt: new Date(),
  };
}

/**
 * Formata a confiança como porcentagem
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

/**
 * Retorna a classe CSS baseada no tipo de recomendação
 */
export function getRecommendationClass(type: RecommendationType): string {
  switch (type) {
    case 'increase':
      return 'strategist-recommendation increase';
    case 'decrease':
      return 'strategist-recommendation decrease';
    case 'maintain':
    default:
      return 'strategist-recommendation maintain';
  }
}
