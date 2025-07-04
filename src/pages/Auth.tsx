import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  const formatPhoneNumber = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 9 dígitos
    const limitedNumbers = numbers.slice(0, 9);
    
    // Formata: 123 456 789
    if (limitedNumbers.length <= 3) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 6) {
      return `${limitedNumbers.slice(0, 3)} ${limitedNumbers.slice(3)}`;
    } else {
      return `${limitedNumbers.slice(0, 3)} ${limitedNumbers.slice(3, 6)} ${limitedNumbers.slice(6)}`;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'telefone') {
      const formattedPhone = formatPhoneNumber(value);
      setFormData(prev => ({ ...prev, [field]: formattedPhone }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Ocultar senha" : "Mostrar senha"}
                  </span>
                </Button>
              </div>
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