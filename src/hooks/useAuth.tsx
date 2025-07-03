import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, userData: SignUpData) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

interface SignUpData {
  nome: string;
  telefone?: string;
  endereco?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Login response:', { data, error });

      if (error) {
        console.error('Login error:', error);
        
        // Se login falhou com credenciais inválidas, tentar corrigir automaticamente
        if (error.message.includes('Invalid login credentials')) {
          console.log('Attempting auto-fix for user:', email);
          
          try {
            // Chamar função de correção
            const { data: fixData, error: fixError } = await supabase.functions.invoke('fix-auth', {
              body: { email, password }
            });

            if (!fixError && fixData?.success) {
              console.log('Auto-fix successful, retrying login...');
              
              // Tentar login novamente após correção
              const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                email,
                password,
              });

              if (!retryError) {
                console.log('Login successful after auto-fix');
                return { error: null };
              }
            }
          } catch (autoFixError) {
            console.error('Auto-fix failed:', autoFixError);
          }
        }
        
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'Email ou senha incorretos' };
        }
        return { error: error.message };
      }

      console.log('Login successful:', data.user?.id);
      return { error: null };
    } catch (error) {
      console.error('Unexpected login error:', error);
      return { error: 'Erro inesperado ao fazer login' };
    }
  };

  const signUp = async (email: string, password: string, userData: SignUpData) => {
    try {
      const { data, error } = await supabase.functions.invoke('auth-user', {
        body: { 
          action: 'signup', 
          email, 
          password, 
          userData 
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        return { error: error.message || 'Erro ao criar conta' };
      }

      if (data?.error) {
        return { error: data.error };
      }

      if (data?.success) {
        // Now sign in the user
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          console.error('Auto sign-in error:', signInError);
          return { error: 'Conta criada, mas erro no login automático. Tente fazer login.' };
        }

        return { error: null };
      }

      return { error: 'Resposta inesperada do servidor' };
    } catch (error) {
      console.error('Erro no signup:', error);
      return { error: 'Erro inesperado ao criar conta' };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer logout",
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};