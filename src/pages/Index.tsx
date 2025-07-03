import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Movie, useMovies } from '@/hooks/useMovies';
import { Navbar } from '@/components/Navbar';
import { MovieCard } from '@/components/MovieCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const { user } = useAuth();
  const { getPopularMovies, searchMovies, TMDB_IMAGE_BASE_URL } = useMovies();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState<'all' | 'movies' | 'series'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);

  useEffect(() => {
    loadInitialContent();
  }, []);

  const loadInitialContent = async () => {
    setLoading(true);
    try {
      const popularMovies = await getPopularMovies();
      setMovies(popularMovies);
      if (popularMovies.length > 0) {
        setFeaturedMovie(popularMovies[0]);
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      loadInitialContent();
      setSearchQuery('');
      return;
    }

    setLoading(true);
    setSearchQuery(query);
    try {
      const searchResults = await searchMovies(query);
      setMovies(searchResults);
      setFeaturedMovie(null);
    } catch (error) {
      console.error('Error searching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: 'all' | 'movies' | 'series') => {
    setCurrentCategory(category);
    if (category === 'all') {
      loadInitialContent();
    }
    // Note: For now, we'll treat 'movies' and 'series' the same since TMDb separates them
    // In a real implementation, you'd make different API calls for TV shows vs movies
  };

  const backdropUrl = featuredMovie?.backdrop_path 
    ? `${TMDB_IMAGE_BASE_URL.replace('w500', 'w1280')}${featuredMovie.backdrop_path}`
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        onSearch={handleSearch}
        onCategoryChange={handleCategoryChange}
        currentCategory={currentCategory}
      />

      {/* Hero Section */}
      {featuredMovie && !searchQuery && (
        <div className="relative h-[70vh] overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: backdropUrl ? `url(${backdropUrl})` : 'none',
              backgroundColor: backdropUrl ? 'transparent' : 'hsl(var(--muted))'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
            <div className="max-w-2xl space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground">
                {featuredMovie.title}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground line-clamp-3">
                {featuredMovie.overview}
              </p>
              <div className="flex space-x-4">
                <Button size="lg" className="text-lg px-8">
                  ▶ Assistir
                </Button>
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Mais Informações
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="container mx-auto px-4 py-8">
        {/* Section Title */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            {searchQuery ? `Resultados para "${searchQuery}"` : 'Filmes Populares'}
          </h2>
          <p className="text-muted-foreground">
            {searchQuery ? `${movies.length} filmes encontrados` : 'Os filmes mais populares do momento'}
          </p>
        </div>

        {/* Movies Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : movies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground mb-4">
              {searchQuery ? 'Nenhum filme encontrado' : 'Erro ao carregar filmes'}
            </p>
            {searchQuery ? (
              <Button onClick={() => handleSearch('')}>
                Ver Filmes Populares
              </Button>
            ) : (
              <Button onClick={loadInitialContent}>
                Tentar Novamente
              </Button>
            )}
          </div>
        )}

        {/* Authentication Prompt for Non-Logged Users */}
        {!user && (
          <div className="mt-16 text-center py-12 bg-card rounded-lg">
            <h3 className="text-2xl font-bold mb-4">Crie a sua lista personalizada</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Faça login para adicionar filmes à sua lista e ter uma experiência personalizada
            </p>
            <Button size="lg" onClick={() => window.location.href = '/auth'}>
              Criar Conta Grátis
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
