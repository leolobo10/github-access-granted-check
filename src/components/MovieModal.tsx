import { useState, useEffect } from 'react';
import { X, Plus, Check, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Movie, useTMDB } from '@/hooks/useTMDB';
import { useMovies } from '@/hooks/useMovies';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface MovieModalProps {
  movie: Movie;
  isOpen: boolean;
  onClose: () => void;
}

export const MovieModal = ({ movie, isOpen, onClose }: MovieModalProps) => {
  const { user } = useAuth();
  const { getMovieInfo, getMovieTrailer } = useTMDB();
  const { addMovieToList, isMovieInList } = useMovies();
  const [movieDetails, setMovieDetails] = useState<Movie | null>(null);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && movie) {
      loadMovieData();
    }
  }, [isOpen, movie]);

  const loadMovieData = async () => {
    setLoading(true);
    try {
      const type = movie.media_type || (movie.title ? 'movie' : 'tv');
      
      const [details, trailer] = await Promise.all([
        getMovieInfo(movie.id, type),
        getMovieTrailer(movie.id, type)
      ]);

      setMovieDetails(details || movie);
      setTrailerUrl(trailer);
    } catch (error) {
      console.error('Error loading movie data:', error);
      setMovieDetails(movie);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para adicionar filmes à sua lista",
        variant: "destructive",
      });
      return;
    }

    await addMovieToList(movieDetails || movie);
  };

  const getMovieTitle = (movie: Movie) => movie.title || movie.name || '';

  const getImageUrl = (path: string | null) => {
    if (!path) return '/placeholder.svg';
    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  const getBackdropUrl = (path: string | null) => {
    if (!path) return '/placeholder.svg';
    return `https://image.tmdb.org/t/p/w1280${path}`;
  };

  if (!movie) return null;

  const currentMovie = movieDetails || movie;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0">
        <div className="relative">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 bg-background/80 hover:bg-background/90"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Hero Section */}
          <div className="relative h-96 overflow-hidden">
            <img
              src={getBackdropUrl(currentMovie.backdrop_path)}
              alt={getMovieTitle(currentMovie)}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {getMovieTitle(currentMovie)}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <span className="flex items-center text-yellow-400">
                  ⭐ {currentMovie.vote_average?.toFixed(1)}
                </span>
                <span>
                  {currentMovie.release_date 
                    ? new Date(currentMovie.release_date).getFullYear()
                    : currentMovie.first_air_date 
                    ? new Date(currentMovie.first_air_date).getFullYear()
                    : ''
                  }
                </span>
              </div>

              <div className="flex items-center space-x-4">
                {trailerUrl ? (
                  <Button
                    size="lg"
                    className="bg-white text-black hover:bg-white/90"
                    onClick={() => window.open(trailerUrl, '_blank')}
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Assistir Trailer
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="secondary"
                    disabled
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Trailer não disponível
                  </Button>
                )}

                {user && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleAddToList}
                    className="border-white text-white hover:bg-white hover:text-black"
                  >
                    {isMovieInList(getMovieTitle(currentMovie)) ? (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        Na Lista
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5 mr-2" />
                        Adicionar à Lista
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Movie Poster */}
              <div className="flex justify-center md:justify-start">
                <img
                  src={getImageUrl(currentMovie.poster_path)}
                  alt={getMovieTitle(currentMovie)}
                  className="w-48 h-72 object-cover rounded-lg"
                />
              </div>

              {/* Movie Details */}
              <div className="md:col-span-2">
                <h2 className="text-xl font-bold mb-4">Sinopse</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {currentMovie.overview || "Sinopse não disponível."}
                </p>

                {loading ? (
                  <div className="text-center py-4">
                    <p>Carregando detalhes...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <strong>Avaliação:</strong> ⭐ {currentMovie.vote_average?.toFixed(1)}/10
                    </div>
                    {currentMovie.release_date && (
                      <div>
                        <strong>Data de Lançamento:</strong> {new Date(currentMovie.release_date).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                    {currentMovie.first_air_date && (
                      <div>
                        <strong>Primeira Exibição:</strong> {new Date(currentMovie.first_air_date).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};