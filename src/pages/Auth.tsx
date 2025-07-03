import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nome: '',
    telefone: '',
    endereco: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast({
            title: "Erro no Login",
            description: error,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sucesso",
            description: "Login realizado com sucesso!",
          });
          navigate('/');
        }
      } else {
        if (!formData.nome.trim()) {
          toast({
            title: "Erro",
            description: "O nome é obrigatório",
            variant: "destructive",
          });
          return;
        }

        const { error } = await signUp(formData.email, formData.password, {
          nome: formData.nome,
          telefone: formData.telefone,
          endereco: formData.endereco
        });

        if (error) {
          toast({
            title: "Erro no Cadastro",
            description: error,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sucesso",
            description: "Conta criada com sucesso!",
          });
          navigate('/');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const fixAuth = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fix-auth', {
        body: {
          email: 'monteirolobo2007@gmail.com',
          password: 'leonardo'
        }
      });

      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: data.message || 'Autenticação corrigida',
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: 'Erro ao corrigir autenticação',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            MovieFlow
          </CardTitle>
          <CardDescription>
            {isLogin ? 'Faça login na sua conta' : 'Crie uma nova conta'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
              />
            </div>

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input
                    id="nome"
                    type="text"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone (opcional)</Label>
                  <Input
                    id="telefone"
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço (opcional)</Label>
                  <Input
                    id="endereco"
                    type="text"
                    value={formData.endereco}
                    onChange={(e) => handleInputChange('endereco', e.target.value)}
                  />
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'A processar...' : (isLogin ? 'Entrar' : 'Criar Conta')}
            </Button>
          </form>

          <div className="mt-4 space-y-2">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={fixAuth}
              disabled={loading}
            >
              🔧 Corrigir Login de monteirolobo2007@gmail.com
            </Button>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? 'Não tem conta? Crie uma aqui' : 'Já tem conta? Faça login'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}