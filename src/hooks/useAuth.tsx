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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log('Erro de login:', error.message);
        if (error.message.includes('Invalid login credentials')) {
          console.log('Verificando se email existe:', email);
          
          // Verificar se o email existe na tabela cliente
          const { data: clienteData, error: checkError } = await supabase
            .from('cliente')
            .select('email')
            .eq('email', email)
            .maybeSingle();
          
          console.log('Resultado verificação:', { clienteData, checkError });
          
          if (checkError) {
            console.error('Erro ao verificar email:', checkError);
            return { error: 'Email ou senha incorretos' };
          }
          
          if (clienteData) {
            console.log('Email existe - senha incorreta');
            return { error: 'Senha incorreta. Tente novamente.' };
          } else {
            console.log('Email não existe - conta não existe');
            return { error: 'Esta conta não existe. Crie uma conta.' };
          }
        }
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'Erro inesperado ao fazer login' };
    }
  };

  // SIGNUP USANDO APENAS SUPABASE.AUTH.SIGNUP - SEM EDGE FUNCTIONS
  const signUp = async (email: string, password: string, userData: SignUpData) => {
    try {
      console.log('🟢 NOVO SIGNUP - DIRECTO SUPABASE AUTH');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome: userData.nome,
            telefone: userData.telefone || '',
            endereco: userData.endereco || ''
          }
        }
      });

      console.log('Resposta do signup:', { data, error });

      if (error) {
        console.error('Erro no signup:', error);
        
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          return { error: 'Este email já está atribuído a uma conta. Utilize outro email.' };
        }
        if (error.message.includes('weak password')) {
          return { error: 'A senha deve ter pelo menos 6 caracteres.' };
        }
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'Email ou senha incorretos' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { error: 'Confirme o seu email antes de fazer login' };
        }
        if (error.message.includes('Too many requests')) {
          return { error: 'Muitas tentativas. Tente novamente mais tarde.' };
        }
        if (error.message.includes('Password should be at least')) {
          return { error: 'A senha deve ter pelo menos 6 caracteres' };
        }
        if (error.message.includes('Unable to validate email address')) {
          return { error: 'Email inválido' };
        }
        if (error.message.includes('Signup requires a valid password')) {
          return { error: 'Digite uma senha válida' };
        }
        
        return { error: 'Erro inesperado. Tente novamente.' };
      }

      if (data.user) {
        console.log('✅ Utilizador criado com sucesso:', data.user.id);
        return { error: null };
      }

      return { error: 'Falha na criação do utilizador' };
    } catch (error: any) {
      console.error('Excepção no signup:', error);
      return { error: error.message || 'Erro inesperado' };
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
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};