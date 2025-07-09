import { useState, useEffect } from 'react';
import { Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useTMDB, Genre } from '@/hooks/useTMDB';
import { useNavigate } from 'react-router-dom';

interface MovieFlowHeaderProps {
  onSearch: (query: string) => void;
  onGenreSelect: (genreId: number, type: 'movie' | 'tv', genreName: string) => void;
}

export const MovieFlowHeader = ({ onSearch, onGenreSelect }: MovieFlowHeaderProps) => {
  const { user } = useAuth();
  const { getGenres } = useTMDB();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [movieGenres, setMovieGenres] = useState<Genre[]>([]);
  const [tvGenres, setTvGenres] = useState<Genre[]>([]);
  const [showMovieGenres, setShowMovieGenres] = useState(false);
  const [showTvGenres, setShowTvGenres] = useState(false);

  useEffect(() => {
    const loadGenres = async () => {
      const [movieGenreList, tvGenreList] = await Promise.all([
        getGenres('movie'),
        getGenres('tv')
      ]);
      setMovieGenres(movieGenreList);
      setTvGenres(tvGenreList);
    };

    loadGenres();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleHomeClick = () => {
    navigate('/');
    setSearchQuery('');
    onSearch('');
  };

  return (
    <header className="fixed top-0 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <button 
              onClick={handleHomeClick}
              className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors"
            >
              MovieFlow
            </button>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <button 
                onClick={handleHomeClick}
                className="text-foreground/80 hover:text-foreground transition-colors"
              >
                Início
              </button>

              {/* Movies Dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setShowMovieGenres(true)}
                onMouseLeave={() => setShowMovieGenres(false)}
              >
                <button className="text-foreground/80 hover:text-foreground transition-colors">
                  Filmes
                </button>
                
                {showMovieGenres && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg py-2 max-h-80 overflow-y-auto">
                    {movieGenres.map((genre) => (
                      <button
                        key={genre.id}
                        onClick={() => {
                          onGenreSelect(genre.id, 'movie', genre.name);
                          setShowMovieGenres(false);
                        }}
                        className="block w-full px-4 py-2 text-left text-card-foreground hover:bg-accent transition-colors"
                      >
                        {genre.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* TV Shows Dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setShowTvGenres(true)}
                onMouseLeave={() => setShowTvGenres(false)}
              >
                <button className="text-foreground/80 hover:text-foreground transition-colors">
                  Séries
                </button>
                
                {showTvGenres && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg py-2 max-h-80 overflow-y-auto">
                    {tvGenres.map((genre) => (
                      <button
                        key={genre.id}
                        onClick={() => {
                          onGenreSelect(genre.id, 'tv', genre.name);
                          setShowTvGenres(false);
                        }}
                        className="block w-full px-4 py-2 text-left text-card-foreground hover:bg-accent transition-colors"
                      >
                        {genre.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {user && (
                <button 
                  onClick={() => navigate('/my-list')}
                  className="text-foreground/80 hover:text-foreground transition-colors"
                >
                  Minha Lista
                </button>
              )}
            </nav>
          </div>

          {/* Search and User */}
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="hidden sm:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/profile')}
                className="hover:bg-accent"
              >
                <User className="h-5 w-5" />
              </Button>
            ) : (
              <Button 
                onClick={() => navigate('/auth')}
                className="bg-primary hover:bg-primary/90"
              >
                Entrar
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        <div className="sm:hidden mt-4">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Pesquisar filmes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </form>
        </div>
      </div>
    </header>
  );
};