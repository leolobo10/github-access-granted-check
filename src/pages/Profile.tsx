import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Key, Eye, EyeOff, Trash2 } from 'lucide-react';

interface UserProfile {
  nome: string;
  email: string;
  telefone: string | null;
  endereco: string | null;
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    nome: '',
    email: '',
    telefone: '',
    endereco: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cliente')
        .select('nome, email, telefone, endereco')
        .eq('idcliente', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          nome: data.nome || '',
          email: data.email || '',
          telefone: data.telefone || '',
          endereco: data.endereco || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar perfil",
        variant: "destructive",
      });
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('cliente')
        .update({
          nome: profile.nome,
          telefone: profile.telefone || null,
          endereco: profile.endereco || null
        })
        .eq('idcliente', user.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Reset password visibility states
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso!",
      });
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      let errorMessage = "Erro ao alterar senha";
      
      if (error.message?.includes('New password should be different')) {
        errorMessage = "A nova senha deve ser diferente da atual";
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = "A senha deve ter pelo menos 6 caracteres";
      } else if (error.message?.includes('weak password')) {
        errorMessage = "A senha é muito fraca. Use uma senha mais forte.";
      } else if (error.message?.includes('Auth session missing')) {
        errorMessage = "Sessão expirada. Faça login novamente.";
      } else if (error.message?.includes('Invalid refresh token')) {
        errorMessage = "Sessão inválida. Faça login novamente.";
      } else if (error.message?.includes('JWT expired')) {
        errorMessage = "Sessão expirada. Faça login novamente.";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setDeleteLoading(true);
    try {
      // Chamar a Edge Function para apagar completamente a conta
      const { data, error } = await supabase.functions.invoke('delete-user', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        console.error('Erro ao apagar conta:', error);
        throw new Error(error.message || 'Erro ao apagar conta');
      }

      toast({
        title: "Conta apagada com sucesso",
        description: "Os seus dados foram eliminados permanentemente.",
      });

      // Fazer logout e redirecionar
      await signOut();
      navigate('/auth');
    } catch (error: any) {
      console.error('Erro ao apagar conta:', error);
      let errorMessage = "Erro ao apagar conta. Tente novamente.";
      
      if (error.message?.includes('delete')) {
        errorMessage = "Erro ao eliminar dados. Tente novamente.";
      } else if (error.message?.includes('Network')) {
        errorMessage = "Erro de rede. Verifique a sua conexão.";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSearch = () => {
    navigate('/');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        onSearch={handleSearch}
        onCategoryChange={() => navigate('/')}
        currentCategory="all"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Perfil do Usuário */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Perfil do Usuário</CardTitle>
              <CardDescription>
                Gerencie suas informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    O email não pode ser alterado
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input
                    id="nome"
                    type="text"
                    value={profile.nome}
                    onChange={(e) => setProfile(prev => ({ ...prev, nome: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    type="tel"
                    value={profile.telefone}
                    onChange={(e) => setProfile(prev => ({ ...prev, telefone: formatPhoneNumber(e.target.value) }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    type="text"
                    value={profile.endereco}
                    onChange={(e) => setProfile(prev => ({ ...prev, endereco: e.target.value }))}
                    placeholder="(opcional)"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'A atualizar...' : 'Atualizar Perfil'}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/my-list')}
                    className="flex-1"
                  >
                    Minha Lista
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Alteração de Senha */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Key className="h-5 w-5" />
                Alterar Senha
              </CardTitle>
              <CardDescription>
                Altere sua senha de acesso à conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Digite a nova senha"
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">
                        {showNewPassword ? "Ocultar senha" : "Mostrar senha"}
                      </span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirme a nova senha"
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">
                        {showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                      </span>
                    </Button>
                  </div>
                </div>

                <Button type="submit" disabled={passwordLoading} className="w-full">
                  {passwordLoading ? 'A alterar senha...' : 'Alterar Senha'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Sair da Conta */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">Sair da conta</h3>
                  <p className="text-sm text-muted-foreground">
                    Fazer logout da sua conta
                  </p>
                </div>
                <Button variant="destructive" onClick={handleSignOut}>
                  Sair
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Apagar Conta */}
          <Card className="border-destructive/50">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-destructive flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Apagar conta
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente removidos.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={deleteLoading}>
                      {deleteLoading ? 'A apagar...' : 'Apagar Conta'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isto irá apagar permanentemente a sua conta
                        e remover todos os seus dados dos nossos servidores, incluindo:
                        <br /><br />
                        • Informações do perfil
                        <br />
                        • Lista de filmes guardados
                        <br />
                        • Histórico de atividade
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Sim, apagar conta
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}