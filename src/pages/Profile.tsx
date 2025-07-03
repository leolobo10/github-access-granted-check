import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

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
  const [profile, setProfile] = useState<UserProfile>({
    nome: '',
    email: '',
    telefone: '',
    endereco: ''
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
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
        <div className="max-w-2xl mx-auto">
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
                    onChange={(e) => setProfile(prev => ({ ...prev, telefone: e.target.value }))}
                    placeholder="(opcional)"
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

              <div className="mt-8 pt-6 border-t">
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}