/**
 * API Client for FastAPI Backend
 * 
 * Provides typed methods for calling FastAPI endpoints
 * with automatic authentication token handling
 */

import { supabase } from '@/integrations/supabase/client';
import { performanceAnalytics } from '@/lib/performance';
import type { AppRole } from '@/lib/types';

// Auto-detect API URL with fallback
// Use Vite's env to determine production vs development
const isProduction = import.meta.env.PROD === true;

// ✅ FIXED: Always use VITE_API_URL (Railway backend URL)
// In production, MUST be set to avoid calling Vercel serverless
const API_BASE_URL = import.meta.env.VITE_API_URL || (isProduction ? '' : 'http://localhost:8000');

import { logger } from './logger';

// ✅ VALIDAÇÃO: Verificar se API_BASE_URL está configurado em produção
if (isProduction && !import.meta.env.VITE_API_URL) {
  logger.warn('VITE_API_URL não está definida em produção', {
    action: 'api_client_init',
    fallback: API_BASE_URL,
  });
}

logger.info('API Client Initialized', {
  action: 'api_client_init',
  API_BASE_URL,
  isProduction,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'SSR',
  envConfigured: !!import.meta.env.VITE_API_URL,
});

export interface Notification {
  id: number;
  user_id: string | null;
  title: string;
  body: string;
  created_at: string;
}

export interface AdminUser {
  user_id: string;
  email: string | null;
  nome: string | null;
  role: AppRole;
  created_at: string | null;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

export interface DeleteNotificationResponse {
  success: boolean;
  message: string;
}

class APIClient {
  private async getAuthToken(): Promise<string | null> {
    // ✅ Obtém o token Bearer da sessão Supabase
    // O token é extraído da sessão autenticada no cliente Supabase
    // e enviado como header Authorization para o backend Railway
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      logger.debug('No Supabase session token available', {
        action: 'get_auth_token',
        sessionExists: !!session,
      });
      return null;
    }
    
    return session.access_token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries: number = 3
  ): Promise<T> {
    return performanceAnalytics.measureAsyncFunction(
      `api_request_${endpoint.replace(/\//g, '_')}`,
      async () => {
        return this._requestInternal<T>(endpoint, options, retries);
      }
    );
  }

  private async _requestInternal<T>(
    endpoint: string,
    options: RequestInit = {},
    retries: number = 3
  ): Promise<T> {
    const startTime = performance.now();
    const token = await this.getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // ✅ Injetar token Bearer obtido do Supabase
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      logger.debug('Authorization header added', {
        action: 'api_request',
        endpoint,
        tokenLength: token.length,
      });
    } else {
      logger.warn('No authorization token available for API request', {
        action: 'api_request',
        endpoint,
      });
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });

        logger.performance(`API Request: ${endpoint}`, startTime, {
          attempt,
          status: response.status,
        });

        if (!response.ok) {
          // Don't retry on 4xx errors (client errors)
          if (response.status >= 400 && response.status < 500) {
            const error = await response.json().catch(() => ({ 
              detail: `HTTP ${response.status}` 
            }));
            // Detailed logging for developers - silent for users
            logger.debug(`Client Error on ${endpoint}`, {
              action: 'api_client_error',
              status: response.status,
              detail: error.detail,
              endpoint,
              timestamp: new Date().toISOString(),
            });
            throw new Error(error.detail || `HTTP ${response.status}`);
          }

          // Retry on 5xx errors (server errors)
          if (response.status >= 500 && attempt < retries) {
            const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            logger.warn(`API request failed, retrying...`, {
              endpoint,
              attempt,
              status: response.status,
              waitTime,
            });
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }

          const error = await response.json().catch(() => ({ 
            detail: `HTTP ${response.status}` 
          }));
          // Detailed logging for developers - silent for users
          logger.debug(`Server Error on ${endpoint}`, {
            action: 'api_client_error',
            status: response.status,
            detail: error.detail,
            endpoint,
            attempt,
            timestamp: new Date().toISOString(),
          });
          throw new Error(error.detail || `HTTP ${response.status}`);
        }

        return response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on network errors if it's the last attempt
        if (attempt === retries) {
          // Detailed console logging for developers only - silent user experience
          logger.debug(`API request failed after ${retries} attempts`, {
            action: 'api_client_exhausted_retries',
            endpoint,
            attempt,
            error: lastError.message,
            timestamp: new Date().toISOString(),
          });
        } else {
          // Log retry attempts in debug mode only
          logger.debug(`API request retry attempt ${attempt}/${retries}`, {
            action: 'api_client_retry',
            endpoint,
            attempt,
          });
        }
        
        // Wait before retry (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        if (attempt < retries) {
          logger.debug(`API request retry backoff`, {
            endpoint,
            attempt,
            waitTime,
            error: lastError.message,
          });
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  // ============ NOTIFICATIONS ============

  async getNotifications(limit: number = 50): Promise<Notification[]> {
    return this.request<Notification[]>(
      `/api/notifications?limit=${limit}`
    );
  }

  async deleteNotification(notificationId: number): Promise<DeleteNotificationResponse> {
    return this.request<DeleteNotificationResponse>(
      `/api/notifications/${notificationId}`,
      { method: 'DELETE' }
    );
  }

  // ============ ADMIN ============

  async getAdminUsers(): Promise<AdminUser[]> {
    return this.request<AdminUser[]>(`/api/admin/users`);
  }

  async getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
    return this.request<AuditLog[]>(`/api/admin/audit-logs?limit=${limit}`);
  }

  async updateUserRole(userId: string, role: AppRole): Promise<{ success: boolean; role: AppRole; }> {
    // Align with backend which expects PUT for role updates
    return this.request<{ success: boolean; role: AppRole; }>(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
  }

  // ============ CSV IMPORT ============

  async importClimateData(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const token = await this.getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/import/climate`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async importMarketData(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const token = await this.getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/import/market`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ============ ANALYTICS ============

  async getMarketData(startDate?: string, endDate?: string): Promise<unknown[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    return this.request<unknown[]>(
      `/api/market-data?${params.toString()}`
    );
  }

  async getClimateData(startDate?: string, endDate?: string, location?: string): Promise<unknown[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (location) params.append('location', location);

    return this.request<unknown[]>(
      `/api/climate-data?${params.toString()}`
    );
  }

  async getCorrelationAnalysis(startDate?: string, endDate?: string): Promise<unknown> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    return this.request<unknown>(
      `/api/analytics/correlation?${params.toString()}`
    );
  }

  async getVolatilityAnalysis(startDate?: string, endDate?: string): Promise<unknown> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    return this.request<unknown>(
      `/api/analytics/volatility?${params.toString()}`
    );
  }

  async getLagAnalysis(startDate?: string, endDate?: string, lagDays: number = 60): Promise<unknown[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    params.append('lag_days', lagDays.toString());

    return this.request<unknown[]>(
      `/api/analytics/lag?${params.toString()}`
    );
  }

  // ============ REALTIME DATA ============

  async getRealtimeWeather(lat: number = -15.6014, lon: number = -56.0979): Promise<unknown> {
    const params = new URLSearchParams();
    params.append('lat', lat.toString());
    params.append('lon', lon.toString());

    return this.request<unknown>(
      `/api/realtime/weather?${params.toString()}`
    );
  }

  async getRealtimeMarket(): Promise<unknown> {
    return this.request<unknown>('/api/realtime/market');
  }

  async refreshRealtime(lat: number = -15.6014, lon: number = -56.0979): Promise<{ weather: unknown; market: unknown; }> {
    const params = new URLSearchParams();
    params.append('lat', lat.toString());
    params.append('lon', lon.toString());
    return this.request<{ weather: unknown; market: unknown; }>(
      `/api/realtime/refresh?${params.toString()}`,
      { method: 'POST' }
    );
  }

  async getRealtimeStatus(): Promise<{ last_weather_at: string | null; last_market_at: string | null; last_refresh_ok: string | null; }> {
    return this.request<{ last_weather_at: string | null; last_market_at: string | null; last_refresh_ok: string | null; }>(`/api/realtime/status`);
  }
}

export interface ImportResult {
  success: boolean;
  records_imported: number;
  records_failed: number;
  total_records: number;
  errors: string[];
  message: string;
}

export const apiClient = new APIClient();
