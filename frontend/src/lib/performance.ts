/**
 * Performance Analytics
 * Coleta métricas de performance do app
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'navigation' | 'resource' | 'measure' | 'paint';
}

class PerformanceAnalytics {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 100; // Limitar quantidade de métricas em memória

  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // Observar métricas de navegação
    try {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric({
              name: 'page_load',
              value: navEntry.loadEventEnd - navEntry.fetchStart,
              timestamp: Date.now(),
              type: 'navigation',
            });

            this.recordMetric({
              name: 'dom_content_loaded',
              value: navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
              timestamp: Date.now(),
              type: 'navigation',
            });

            this.recordMetric({
              name: 'first_byte',
              value: navEntry.responseStart - navEntry.fetchStart,
              timestamp: Date.now(),
              type: 'navigation',
            });
          }
        }
      });

      navObserver.observe({ entryTypes: ['navigation'] });
    } catch (e) {
      console.warn('PerformanceObserver not supported', e);
    }

    // Observar métricas de paint
    try {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint') {
            this.recordMetric({
              name: entry.name === 'first-contentful-paint' ? 'fcp' : 'lcp',
              value: entry.startTime,
              timestamp: Date.now(),
              type: 'paint',
            });
          }
        }
      });

      paintObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      // Paint observer pode não estar disponível
    }
  }

  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Limitar quantidade de métricas
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Em produção, você pode enviar para um serviço de analytics
    if (import.meta.env.PROD) {
      // Exemplo: enviar para analytics service
      // this.sendToAnalytics(metric);
    }
  }

  // Medir tempo de execução de uma função
  measureFunction<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    this.recordMetric({
      name,
      value: end - start,
      timestamp: Date.now(),
      type: 'measure',
    });

    return result;
  }

  // Medir tempo de execução de uma função async
  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    this.recordMetric({
      name,
      value: end - start,
      timestamp: Date.now(),
      type: 'measure',
    });

    return result;
  }

  // Obter métricas coletadas
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Obter métricas por tipo
  getMetricsByType(type: PerformanceMetric['type']): PerformanceMetric[] {
    return this.metrics.filter(m => m.type === type);
  }

  // Obter métrica específica
  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.find(m => m.name === name);
  }

  // Limpar métricas
  clearMetrics() {
    this.metrics = [];
  }

  // Obter resumo de performance
  getSummary() {
    const navigation = this.getMetricsByType('navigation');
    const paint = this.getMetricsByType('paint');
    const measures = this.getMetricsByType('measure');

    return {
      pageLoad: this.getMetric('page_load')?.value,
      domContentLoaded: this.getMetric('dom_content_loaded')?.value,
      firstByte: this.getMetric('first_byte')?.value,
      fcp: this.getMetric('fcp')?.value,
      lcp: this.getMetric('lcp')?.value,
      customMeasures: measures.map(m => ({ name: m.name, value: m.value })),
      totalMetrics: this.metrics.length,
    };
  }
}

export const performanceAnalytics = new PerformanceAnalytics();
