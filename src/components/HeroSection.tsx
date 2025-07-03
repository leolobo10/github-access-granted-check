import { useState, useEffect } from 'react';
import { Play, Plus, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Movie, useTMDB } from '@/hooks/useTMDB';
import { useMovies } from '@/hooks/useMovies';
import { useAuth } from '@/hooks/useAuth';
import { MovieModal } from './MovieModal';

interface HeroSectionProps {
  featuredMovie?: Movie;
}

export const HeroSection = ({ featuredMovie }: HeroSectionProps) => {
  const { user } = useAuth();
  const { getMovieTrailer } = useTMDB();
  const { addMovieToList, isMovieInList } = useMovies();
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (featuredMovie) {
      loadTrailer();
    }
  }, [featuredMovie]);

  const loadTrailer = async () => {
    if (!featuredMovie) return;
    
    const type = featuredMovie.media_type || (featuredMovie.title ? 'movie' : 'tv');
    const trailer = await getMovieTrailer(featuredMovie.id, type);
    setTrailerUrl(trailer);
  };

  const handleAddToList = async () => {
    if (!featuredMovie) return;
    await addMovieToList(featuredMovie);
  };

  const getMovieTitle = (movie: Movie) => movie.title || movie.name || '';

  const getBackdropUrl = (path: string | null) => {
    if (!path) return '/placeholder.svg';
    return `https://image.tmdb.org/t/p/w1280${path}`;
  };

  if (!featuredMovie) return null;

  return (
    <>
      <div className="relative h-screen flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={getBackdropUrl(featuredMovie.backdrop_path)}
            alt={getMovieTitle(featuredMovie)}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {getMovieTitle(featuredMovie)}
            </h1>
            
            <p className="text-lg md:text-xl text-foreground/90 mb-6 line-clamp-3">
              {featuredMovie.overview || "Sinopse não disponível."}
            </p>

            <div className="flex items-center space-x-4 mb-8">
              <span className="flex items-center text-yellow-400">
                ⭐ {featuredMovie.vote_average?.toFixed(1)}
              </span>
              <span>
                {featuredMovie.release_date 
                  ? new Date(featuredMovie.release_date).getFullYear()
                  : featuredMovie.first_air_date 
                  ? new Date(featuredMovie.first_air_date).getFullYear()
                  : ''
                }
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              {trailerUrl ? (
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-white/90 text-lg px-8"
                  onClick={() => window.open(trailerUrl, '_blank')}
                >
                  <Play className="h-6 w-6 mr-2" />
                  Assistir Trailer
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="secondary"
                  disabled
                  className="text-lg px-8"
                >
                  <Play className="h-6 w-6 mr-2" />
                  Trailer não disponível
                </Button>
              )}

              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowModal(true)}
                className="border-white text-white hover:bg-white hover:text-black text-lg px-8"
              >
                <Info className="h-6 w-6 mr-2" />
                Mais Informações
              </Button>

              {user && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleAddToList}
                  className="border-white text-white hover:bg-white hover:text-black text-lg px-8"
                >
                  {isMovieInList(getMovieTitle(featuredMovie)) ? (
                    <>
                      <Check className="h-6 w-6 mr-2" />
                      Na Lista
                    </>
                  ) : (
                    <>
                      <Plus className="h-6 w-6 mr-2" />
                      Adicionar à Lista
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Movie Modal */}
      {showModal && (
        <MovieModal
          movie={featuredMovie}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};