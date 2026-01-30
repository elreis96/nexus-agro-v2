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

type SentryModule = {
  init?: (config: Record<string, unknown>) => void;
  browserTracingIntegration?: () => unknown;
  replayIntegration?: () => unknown;
};

type SentryWindow = Window & {
  Sentry?: {
    captureException?: (error: Error, context?: Record<string, unknown>) => void;
    captureMessage?: (message: string, level?: string) => void;
    setUser?: (user: Record<string, unknown> | null) => void;
  };
};

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
      // Import dinâmico seguro; @vite-ignore evita análise estática
      // Se o pacote não existir, o import falhará e será capturado abaixo.
      // Evitar resolução em build: obfuscar o specifier e manter @vite-ignore
      const modPath = '@' + 'sentry/react';
      const sentryModule: SentryModule = await import(/* @vite-ignore */ modPath);
      const Sentry = (sentryModule as Record<string, unknown>).default || sentryModule;
      
      if (Sentry && typeof (Sentry as SentryModule).init === 'function') {
        (Sentry as SentryModule).init?.({
          dsn: this.config.dsn,
          environment: this.config.environment || 'production',
          integrations: [
            (Sentry as SentryModule).browserTracingIntegration?.(),
            (Sentry as SentryModule).replayIntegration?.(),
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

  captureException(error: Error, context?: Record<string, unknown>) {
    if (!this.config.enabled) {
      console.error('Error (monitoring disabled):', error, context);
      return;
    }

    // Se Sentry estiver disponível, usar
    if (typeof window !== 'undefined' && (window as SentryWindow).Sentry) {
      (window as SentryWindow).Sentry?.captureException?.(error, { extra: context });
    }
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    if (!this.config.enabled) {
      console.log(`[${level}]`, message);
      return;
    }

    if (typeof window !== 'undefined' && (window as SentryWindow).Sentry) {
      (window as SentryWindow).Sentry?.captureMessage?.(message, level);
    }
  }

  setUser(userId: string, email?: string, username?: string) {
    if (!this.config.enabled) return;

    if (typeof window !== 'undefined' && (window as SentryWindow).Sentry) {
      (window as SentryWindow).Sentry?.setUser?.({
        id: userId,
        email,
        username,
      });
    }
  }

  clearUser() {
    if (!this.config.enabled) return;

    if (typeof window !== 'undefined' && (window as SentryWindow).Sentry) {
      (window as SentryWindow).Sentry?.setUser?.(null);
    }
  }
}

export const monitoring = new Monitoring();
