import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { createMarketAlertNotifications, detectClimateAlerts } from '@/lib/market-alerts';

export interface Notification {
  id: number;
  user_id: string | null;
  title: string;
  body: string;
  created_at: string;
}

// Feature flag: Use FastAPI backend or Supabase direct
const USE_FASTAPI = import.meta.env.VITE_USE_FASTAPI === 'true';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch existing notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      let data: Notification[];

      if (USE_FASTAPI) {
        // NEW: Use FastAPI backend
        data = await apiClient.getNotifications(50);
      } else {
        // LEGACY: Use Supabase direct (fallback)
        const { data: supabaseData, error } = await supabase
          .from('notifications')
          .select('*')
          .or(`user_id.eq.${user.id},user_id.is.null`)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        data = (supabaseData as Notification[]) || [];
      }

      setNotifications(data);
      setUnreadCount(data.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: number) => {
    if (!user) return;

    try {
      if (USE_FASTAPI) {
        // NEW: Use FastAPI backend
        await apiClient.deleteNotification(notificationId);
      } else {
        // LEGACY: Use Supabase direct (fallback)
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', notificationId)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [user]);

  // Create test notification if none exists
  const createTestNotification = useCallback(async () => {
    if (!user) return;

    try {
      // Check if test notification already exists
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', 'Sistema de alertas ativo')
        .limit(1);

      if (existing && existing.length > 0) {
        return; // Test notification already exists
      }

      // Create test notification
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'Sistema de alertas ativo',
          body: 'O AgroData Nexus está monitorando clima e mercado em tempo quase real.',
        });

      if (error) throw error;

      // Refresh notifications
      await fetchNotifications();
    } catch (error) {
      console.error('Error creating test notification:', error);
    }
  }, [user, fetchNotifications]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    fetchNotifications();
    createTestNotification();

    // Verificar alertas de mercado e clima a cada 30 minutos
    const checkAlerts = async () => {
      await createMarketAlertNotifications(user.id);
      await detectClimateAlerts(user.id);
      await fetchNotifications(); // Refresh após criar alertas
    };

    // Executar imediatamente e depois a cada 30 minutos
    checkAlerts();
    const alertInterval = setInterval(checkAlerts, 30 * 60 * 1000);

    // Subscribe to new notifications
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show browser notification if permitted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.body,
              icon: '/favicon.ico',
              tag: String(newNotification.id),
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const deletedId = payload.old.id;
          setNotifications(prev => prev.filter(n => n.id !== deletedId));
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      )
      .subscribe();

    return () => {
      clearInterval(alertInterval);
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications, createTestNotification]);

  // Request browser notification permission
  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    deleteNotification,
    requestPermission,
    refetch: fetchNotifications,
    createTestNotification,
  };
}
