import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Movie, useTMDB, MovieSection } from '@/hooks/useTMDB';
import { MovieFlowHeader } from '@/components/MovieFlowHeader';
import { HeroSection } from '@/components/HeroSection';
import { MovieRow } from '@/components/MovieRow';
import { MovieCard } from '@/components/MovieCard';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user } = useAuth();
  const { getHomeList, searchMovies, getMoviesByGenre, loading } = useTMDB();
  const [movieSections, setMovieSections] = useState<MovieSection[]>([]);
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadInitialContent();
  }, []);

  const loadInitialContent = async () => {
    try {
      const sections = await getHomeList();
      setMovieSections(sections);
      
      // Set featured movie from trending section
      const trendingSection = sections.find(s => s.slug === 'trending');
      if (trendingSection && trendingSection.items.length > 0) {
        setFeaturedMovie(trendingSection.items[0]);
      }
    } catch (error) {
      console.error('Error loading content:', error);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchQuery('');
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setSearchQuery(query);
    setIsSearching(true);
    
    try {
      const results = await searchMovies(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching movies:', error);
      setSearchResults([]);
    }
  };

  const handleGenreSelect = async (genreId: number, type: 'movie' | 'tv', genreName: string) => {
    try {
      const movies = await getMoviesByGenre(genreId, type);
      setSearchResults(movies);
      setSearchQuery(`${type === 'movie' ? 'filmes' : 'séries'} de ${genreName.toLowerCase()}`);
      setIsSearching(true);
    } catch (error) {
      console.error('Error loading genre movies:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MovieFlowHeader 
        onSearch={handleSearch}
        onGenreSelect={handleGenreSelect}
      />

      {/* Main Content */}
      <main className="pt-20">
        {/* Hero Section - only show when not searching */}
        {!isSearching && featuredMovie && (
          <HeroSection featuredMovie={featuredMovie} />
        )}

        {/* Content Section */}
        <div className={`${!isSearching && featuredMovie ? 'py-8' : 'pt-8 pb-8'}`}>
          {isSearching ? (
            /* Search Results */
            <div className="container mx-auto px-4">
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  {searchQuery ? `Resultados para "${searchQuery}"` : 'Resultados da pesquisa'}
                </h2>
                <p className="text-muted-foreground">
                  {searchResults.length} {searchResults.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
                </p>
              </div>

              {searchResults.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {searchResults.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-xl text-muted-foreground mb-4">
                    Nenhum resultado encontrado
                  </p>
                  <Button onClick={() => handleSearch('')}>
                    Ver Filmes Populares
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Movie Sections */
            <div className="container mx-auto px-4">
              {movieSections.map((section) => (
                <MovieRow
                  key={section.slug}
                  title={section.title}
                  movies={section.items}
                />
              ))}
            </div>
          )}

          {/* Authentication Prompt for Non-Logged Users */}
          {!user && !isSearching && (
            <div className="container mx-auto px-4 mt-16">
              <div className="text-center py-12 bg-card rounded-lg">
                <h3 className="text-2xl font-bold mb-4">Crie a sua lista personalizada</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Faça login para adicionar filmes à sua lista e ter uma experiência personalizada
                </p>
                <Button size="lg" onClick={() => window.location.href = '/auth'}>
                  Criar Conta Grátis
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
