import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string, orgName?: string, subdomain?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  userRole: string | null;
  employeeProfile: any | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [employeeProfile, setEmployeeProfile] = useState<any | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Immediately allow the app to render; fetch role/profile in background
          setLoading(false);
          setTimeout(async () => {
            try {
              const [roleResult, profileResult] = await Promise.all([
                supabase.from('user_roles').select('role').eq('user_id', session.user.id).maybeSingle(),
                supabase.from('employees').select('*').eq('auth_user_id', session.user.id).maybeSingle()
              ]);
              setUserRole(roleResult?.data?.role || 'employee');
              setEmployeeProfile(profileResult?.data ?? null);
            } catch (err) {
              console.error('Background fetch auth context failed:', err);
            }
          }, 0);
        } else {
          setUserRole(null);
          setEmployeeProfile(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      if (session) {
        setSession(session);
        setUser(session.user);
        // Allow app to render immediately; fetch role/profile in background
        setLoading(false);
        try {
          const [roleResult, profileResult] = await Promise.all([
            supabase.from('user_roles').select('role').eq('user_id', session.user.id).maybeSingle(),
            supabase.from('employees').select('*').eq('auth_user_id', session.user.id).maybeSingle()
          ]);
          setUserRole(roleResult?.data?.role || 'employee');
          setEmployeeProfile(profileResult?.data ?? null);
        } catch (err) {
          console.error('Initial background fetch failed:', err);
        }
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name?: string, orgName?: string, subdomain?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const meta = {
      name: name || email.split('@')[0],
      org_name: orgName?.trim(),
      subdomain: subdomain?.toLowerCase().trim(),
    };
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: meta,
      }
    });

    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link.",
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setEmployeeProfile(null);
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    userRole,
    employeeProfile,
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