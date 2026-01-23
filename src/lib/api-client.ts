/**
 * API Client for FastAPI Backend
 * 
 * Provides typed methods for calling FastAPI endpoints
 * with automatic authentication token handling
 */

import { supabase } from '@/integrations/supabase/client';

// Auto-detect API URL: use env var if set, otherwise use current origin (for Vercel)
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.origin.includes('vercel.app') 
    ? window.location.origin 
    : 'http://localhost:8000');

export interface Notification {
  id: number;
  user_id: string | null;
  title: string;
  body: string;
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
