import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

export interface AuditLogEntry {
  action: string;
  target_type: 'user_role' | 'profile' | 'data_import' | 'settings';
  target_id?: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
}

export function useAuditLog() {
  const { user } = useAuth();

  const logAction = async (entry: AuditLogEntry) => {
    if (!user) {
      console.warn('Cannot log action: user not authenticated');
      return;
    }

    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert([{
          user_id: user.id,
          action: entry.action,
          target_type: entry.target_type,
          target_id: entry.target_id,
          old_value: entry.old_value as Json,
          new_value: entry.new_value as Json,
          user_agent: navigator.userAgent,
        }]);

      if (error) {
        console.error('Error logging audit action:', error);
      }
    } catch (err) {
      console.error('Failed to log audit action:', err);
    }
  };

  return { logAction };
}
