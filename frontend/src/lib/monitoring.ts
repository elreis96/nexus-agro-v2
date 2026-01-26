/**
 * Monitoring Setup (Sentry/LogRocket)
 * Preparado para integração futura
 * 
 * NOTA: Sentry é opcional e só será carregado se:
 * 1. VITE_SENTRY_DSN estiver configurado
 * 2. @sentry/react estiver instalado
 * 3. Estivermos em produção
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
  private sentryInitialized = false;

  constructor() {
    // Verificar se Sentry DSN está configurado
    const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
    if (sentryDsn && import.meta.env.PROD) {
      this.config.enabled = true;
      this.config.dsn = sentryDsn;
      // Inicializar apenas em runtime, não no construtor
      if (typeof window !== 'undefined') {
        // Defer initialization para não bloquear
        setTimeout(() => this.initializeSentry(), 0);
      }
    }
  }

  private async initializeSentry() {
    if (!this.config.enabled || !this.config.dsn || this.sentryInitialized) return;
    if (typeof window === 'undefined') return;

    try {
      // Usar eval para import dinâmico que não é analisado pelo Vite no build time
      // Isso permite que o build funcione mesmo sem @sentry/react instalado
      // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-eval
      const sentryModule = await eval('import("@sentry/react")');
      const Sentry = sentryModule.default || sentryModule;
      
      if (Sentry && typeof Sentry.init === 'function') {
        Sentry.init({
          dsn: this.config.dsn,
          environment: this.config.environment || 'production',
          integrations: [
            Sentry.browserTracingIntegration?.(),
            Sentry.replayIntegration?.(),
          ].filter(Boolean),
          tracesSampleRate: 0.1,
          replaysSessionSampleRate: 0.1,
          replaysOnErrorSampleRate: 1.0,
        });

        this.sentryInitialized = true;
        if (import.meta.env.DEV) {
          console.log('✅ Sentry inicializado');
        }
      }
    } catch (error) {
      // Silenciosamente falhar se Sentry não estiver disponível
      // Isso é esperado se @sentry/react não estiver instalado
      this.sentryInitialized = false;
      // Não logar em produção
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
