import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { AppRole, UserProfile } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: AppRole | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, nome?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (profileError) {
        console.warn('Error fetching profile:', profileError);
        // Don't crash, just set default
        setProfile(null);
      } else if (profileData) {
        setProfile(profileData as UserProfile);
      }

      // Fetch role using the security definer function
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_role', { _user_id: userId });
      
      if (roleError) {
        console.warn('Error fetching role:', roleError);
        // Try to get cached role from localStorage as fallback
        const cachedRole = localStorage.getItem(`user_role_${userId}`) as AppRole | null;
        setRole(cachedRole || 'gestor');
      } else if (roleData) {
        setRole(roleData as AppRole);
        // Cache the role for fallback during outages
        localStorage.setItem(`user_role_${userId}`, roleData);
      } else {
        // Default to gestor if no role found
        setRole('gestor');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Try cached role during network errors
      const cachedRole = localStorage.getItem(`user_role_${userId}`) as AppRole | null;
      setProfile(null);
      setRole(cachedRole || 'gestor');
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer Supabase calls with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, nome?: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          nome: nome || '',
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    navigate('/');
  };

  const refreshProfile = async () => {
    if (!user) return;
    await fetchUserData(user.id);
  };

  const value = {
    user,
    session,
    profile,
    role,
    isLoading,
    isAdmin: role === 'admin',
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
