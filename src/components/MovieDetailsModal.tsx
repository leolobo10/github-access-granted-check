import { useEffect, useState } from 'react';
import { X, Plus, Check, Star, Calendar, Clock } from 'lucide-react';
import { Movie, useMovies } from '@/hooks/useMovies';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface MovieDetailsModalProps {
  movie: Movie;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MovieDetailsModal = ({ movie, open, onOpenChange }: MovieDetailsModalProps) => {
  const [movieDetails, setMovieDetails] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(false);
  const { 
    getMovieDetails, 
    addMovieToList, 
    isMovieInList, 
    TMDB_IMAGE_BASE_URL 
  } = useMovies();

  const inList = isMovieInList(movie.title);

  useEffect(() => {
    if (open && movie.id) {
      fetchMovieDetails();
    }
  }, [open, movie.id]);

  const fetchMovieDetails = async () => {
    setLoading(true);
    try {
      const details = await getMovieDetails(movie.id);
      setMovieDetails(details);
    } catch (error) {
      console.error('Erro ao buscar detalhes do filme:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = () => {
    if (!inList) {
      addMovieToList(movie);
    }
  };

  const backdropUrl = movie.backdrop_path 
    ? `${TMDB_IMAGE_BASE_URL.replace('w500', 'w1280')}${movie.backdrop_path}`
    : '/placeholder.svg';

  const posterUrl = movie.poster_path 
    ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
    : '/placeholder.svg';

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="relative">
          {/* Backdrop Image */}
          <div className="relative h-64 md:h-80 overflow-hidden">
            <img
              src={backdropUrl}
              alt={movie.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Poster */}
              <div className="w-32 md:w-48 flex-shrink-0 mx-auto md:mx-0">
                <img
                  src={posterUrl}
                  alt={movie.title}
                  className="w-full rounded-lg shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.svg';
                  }}
                />
              </div>

              {/* Movie Info */}
              <div className="flex-1 space-y-4">
                <DialogHeader>
                  <DialogTitle className="text-2xl md:text-3xl font-bold">
                    {movie.title}
                  </DialogTitle>
                </DialogHeader>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">
                      {movie.vote_average.toFixed(1)}
                    </span>
                  </div>
                  
                  {movie.release_date && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(movie.release_date).getFullYear()}
                      </span>
                    </div>
                  )}

                  {movieDetails?.runtime && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {formatRuntime(movieDetails.runtime)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <Button
                  onClick={handleAddToList}
                  disabled={inList}
                  className="w-full md:w-auto"
                >
                  {inList ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Na Minha Lista
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar à Lista
                    </>
                  )}
                </Button>

                {/* Overview */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Sinopse</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {movie.overview || 'Sinopse não disponível.'}
                  </p>
                </div>

                {/* Cast */}
                {loading ? (
                  <div className="text-sm text-muted-foreground">
                    A carregar detalhes...
                  </div>
                ) : movieDetails?.cast && movieDetails.cast.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Elenco</h3>
                    <ScrollArea className="h-32">
                      <div className="space-y-2">
                        {movieDetails.cast.map((actor, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="font-medium">{actor.name}</span>
                            <span className="text-muted-foreground">
                              {actor.character}
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
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