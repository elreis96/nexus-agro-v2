/**
 * Monitoring Setup (Sentry/LogRocket)
 * Preparado para integração futura
 */

interface MonitoringConfig {
  enabled: boolean;
  dsn?: string;
  environment?: string;
}

class Monitoring {
  private config: MonitoringConfig = {
    enabled: false,
    environment: import.meta.env.MODE,
  };

  constructor() {
    // Verificar se Sentry DSN está configurado
    const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
    if (sentryDsn && import.meta.env.PROD) {
      this.config.enabled = true;
      this.config.dsn = sentryDsn;
      this.initializeSentry();
    }
  }

  private async initializeSentry() {
    if (!this.config.enabled || !this.config.dsn) return;

    try {
      // Dynamic import para não incluir Sentry no bundle se não estiver configurado
      const Sentry = await import('@sentry/react');
      
      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment || 'production',
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration(),
        ],
        tracesSampleRate: 0.1, // 10% das transações
        replaysSessionSampleRate: 0.1, // 10% das sessões
        replaysOnErrorSampleRate: 1.0, // 100% dos erros
      });

      console.log('✅ Sentry inicializado');
    } catch (error) {
      console.warn('⚠️ Erro ao inicializar Sentry:', error);
    }
  }

  captureException(error: Error, context?: Record<string, any>) {
    if (!this.config.enabled) {
      console.error('Error (monitoring disabled):', error, context);
      return;
    }

    // Se Sentry estiver disponível, usar
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, { extra: context });
    }
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    if (!this.config.enabled) {
      console.log(`[${level}]`, message);
      return;
    }

    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureMessage(message, level);
    }
  }

  setUser(userId: string, email?: string, username?: string) {
    if (!this.config.enabled) return;

    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.setUser({
        id: userId,
        email,
        username,
      });
    }
  }

  clearUser() {
    if (!this.config.enabled) return;

    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.setUser(null);
    }
  }
}

export const monitoring = new Monitoring();
