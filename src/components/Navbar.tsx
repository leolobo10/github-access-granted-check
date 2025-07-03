import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Film } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavbarProps {
  onSearch: (query: string) => void;
  onCategoryChange: (category: 'all' | 'movies' | 'series') => void;
  currentCategory: 'all' | 'movies' | 'series';
}

export const Navbar = ({ onSearch, onCategoryChange, currentCategory }: NavbarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div 
          className="text-2xl font-bold text-primary cursor-pointer flex items-center space-x-2"
          onClick={() => navigate('/')}
        >
          <Film className="h-8 w-8" />
          <span>MovieFlow</span>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-6">
          <button
            onClick={() => {
              onCategoryChange('all');
              navigate('/');
            }}
            className={`text-sm font-medium transition-colors hover:text-primary ${
              currentCategory === 'all' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Início
          </button>
          <button
            onClick={() => onCategoryChange('movies')}
            className={`text-sm font-medium transition-colors hover:text-primary ${
              currentCategory === 'movies' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Filmes
          </button>
          <button
            onClick={() => onCategoryChange('series')}
            className={`text-sm font-medium transition-colors hover:text-primary ${
              currentCategory === 'series' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Séries
          </button>
          <button
            onClick={() => navigate('/my-list')}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Minha Lista
          </button>
        </div>

        {/* Search and User Menu */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="hidden sm:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar filmes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </form>

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/my-list')}>
                  Minha Lista
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate('/auth')}>
              Entrar
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};