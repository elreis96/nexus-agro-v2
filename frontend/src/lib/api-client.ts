/**
 * API Client for FastAPI Backend
 * 
 * Provides typed methods for calling FastAPI endpoints
 * with automatic authentication token handling
 */

import { supabase } from '@/integrations/supabase/client';
import type { AppRole } from '@/lib/types';

// Auto-detect API URL with fallback
// Use Vite's env to determine production vs development
const isProduction = import.meta.env.PROD === true;

// ✅ FIXED: Prefer VITE_API_URL in production (Railway backend URL)
// Falls back to window.location.origin if VITE_API_URL not set
const API_BASE_URL = isProduction
  ? (import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : ''))
  : (import.meta.env.VITE_API_URL || 'http://localhost:8000');

// ✅ VALIDAÇÃO: Verificar se API_BASE_URL está configurado em produção
if (isProduction && !import.meta.env.VITE_API_URL) {
  console.warn(
    '⚠️ VITE_API_URL não está definida em produção. ' +
    'Configure no Vercel Dashboard → Environment Variables. ' +
    'Usando fallback:', API_BASE_URL
  );
}

console.log('🌐 API Client Initialized:', {
  API_BASE_URL,
  isProduction,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'SSR',
  env: import.meta.env.VITE_API_URL || '❌ NOT SET',
  warning: isProduction && !import.meta.env.VITE_API_URL ? '⚠️ Using fallback URL' : '✅ OK'
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
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
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
    return this.request<{ success: boolean; role: AppRole; }>(`/api/admin/users/${userId}/role`, {
      method: 'POST',
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

  async getMarketData(startDate?: string, endDate?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    return this.request<any[]>(
      `/api/market-data?${params.toString()}`
    );
  }

  async getClimateData(startDate?: string, endDate?: string, location?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (location) params.append('location', location);

    return this.request<any[]>(
      `/api/climate-data?${params.toString()}`
    );
  }

  async getCorrelationAnalysis(startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    return this.request<any>(
      `/api/analytics/correlation?${params.toString()}`
    );
  }

  async getVolatilityAnalysis(startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    return this.request<any>(
      `/api/analytics/volatility?${params.toString()}`
    );
  }

  async getLagAnalysis(startDate?: string, endDate?: string, lagDays: number = 60): Promise<any[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    params.append('lag_days', lagDays.toString());

    return this.request<any[]>(
      `/api/analytics/lag?${params.toString()}`
    );
  }

  // ============ REALTIME DATA ============

  async getRealtimeWeather(lat: number = -15.6014, lon: number = -56.0979): Promise<any> {
    const params = new URLSearchParams();
    params.append('lat', lat.toString());
    params.append('lon', lon.toString());

    return this.request<any>(
      `/api/realtime/weather?${params.toString()}`
    );
  }

  async getRealtimeMarket(): Promise<any> {
    return this.request<any>('/api/realtime/market');
  }

  async refreshRealtime(lat: number = -15.6014, lon: number = -56.0979): Promise<{ weather: any; market: any; }> {
    const params = new URLSearchParams();
    params.append('lat', lat.toString());
    params.append('lon', lon.toString());
    return this.request<{ weather: any; market: any; }>(
      `/api/realtime/refresh?${params.toString()}`,
      { method: 'POST' }
    );
  }

  async getRealtimeStatus(): Promise<{ last_weather_at: string | null; last_market_at: string | null; last_refresh_ok: string | null; }> {
    return this.request(`/api/realtime/status`);
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
