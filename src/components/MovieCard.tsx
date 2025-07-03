import { useState } from 'react';
import { Plus, Check, Eye } from 'lucide-react';
import { Movie, useMovies } from '@/hooks/useMovies';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MovieDetailsModal } from './MovieDetailsModal';

interface MovieCardProps {
  movie: Movie;
}

export const MovieCard = ({ movie }: MovieCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const { addMovieToList, isMovieInList, TMDB_IMAGE_BASE_URL } = useMovies();

  const inList = isMovieInList(movie.title);

  const handleAddToList = () => {
    if (!inList) {
      addMovieToList(movie);
    }
  };

  const posterUrl = movie.poster_path 
    ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
    : '/placeholder.svg';

  return (
    <>
      <Card className="group relative overflow-hidden bg-card hover:bg-card/80 transition-all duration-300 transform hover:scale-105">
        <CardContent className="p-0">
          {/* Movie Poster */}
          <div className="relative aspect-[2/3] overflow-hidden">
            <img
              src={posterUrl}
              alt={movie.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
              }}
            />
            
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-4 left-4 right-4 space-y-2">
                <h3 className="text-white font-semibold text-sm line-clamp-2">
                  {movie.title}
                </h3>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      {movie.vote_average.toFixed(1)}
                    </Badge>
                    {movie.release_date && (
                      <Badge variant="outline" className="text-xs">
                        {new Date(movie.release_date).getFullYear()}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant={inList ? "secondary" : "default"}
                    onClick={handleAddToList}
                    disabled={inList}
                    className="flex-1 text-xs"
                  >
                    {inList ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Na Lista
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar
                      </>
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowDetails(true)}
                    className="text-xs"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <MovieDetailsModal
        movie={movie}
        open={showDetails}
        onOpenChange={setShowDetails}
      />
    </>
  );
};