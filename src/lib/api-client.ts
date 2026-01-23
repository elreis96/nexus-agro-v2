/**
 * API Client for FastAPI Backend
 * 
 * Provides typed methods for calling FastAPI endpoints
 * with automatic authentication token handling
 */

import { supabase } from '@/integrations/supabase/client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

  // TODO: Add more endpoints as migration progresses
  // async importClimateData(file: File): Promise<ImportResult>
  // async getMarketData(startDate?: string, endDate?: string): Promise<MarketData[]>
}

export const apiClient = new APIClient();
