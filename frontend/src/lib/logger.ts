/**
 * Centralized logger utility with structured logging
 * In production, console.log will be stripped by Vite
 * Use this to ensure consistent logging behavior
 */

const isDevelopment = import.meta.env.DEV;

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: any;
}

export const logger = {
  log: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      console.log(`📝 ${message}`, context || '');
    }
  },
  
  error: (message: string, error?: Error | unknown, context?: LogContext) => {
    // Always log errors, even in production
    const errorDetails = error instanceof Error 
      ? { message: error.message, stack: error.stack, name: error.name }
      : error;
    
    console.error(`❌ ${message}`, {
      ...context,
      error: errorDetails,
      timestamp: new Date().toISOString(),
    });
  },
  
  warn: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      console.warn(`⚠️ ${message}`, context || '');
    }
  },
  
  info: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      console.info(`ℹ️ ${message}`, context || '');
    }
  },
  
  debug: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      console.debug(`🔍 ${message}`, context || '');
    }
  },
  
  success: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      console.log(`✅ ${message}`, context || '');
    }
  },
  
  // Performance logging
  performance: (label: string, startTime: number, context?: LogContext) => {
    const duration = performance.now() - startTime;
    if (isDevelopment) {
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`, context || '');
    }
  }
};
