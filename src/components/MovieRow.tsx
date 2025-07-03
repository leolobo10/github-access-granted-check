import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Check, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Movie } from '@/hooks/useTMDB';
import { useMovies } from '@/hooks/useMovies';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { MovieModal } from './MovieModal';

interface MovieRowProps {
  title: string;
  movies: Movie[];
}

export const MovieRow = ({ title, movies }: MovieRowProps) => {
  const { user } = useAuth();
  const { addMovieToList, isMovieInList } = useMovies();
  const [scrollPosition, setScrollPosition] = useState(0);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById(`row-${title}`);
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      const newPosition = direction === 'left' 
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;
      
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  const handleAddToList = async (movie: Movie, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para adicionar filmes à sua lista",
        variant: "destructive",
      });
      return;
    }

    await addMovieToList(movie);
  };

  const getMovieTitle = (movie: Movie) => movie.title || movie.name || '';

  const getImageUrl = (path: string | null) => {
    if (!path) return '/placeholder.svg';
    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xl md:text-2xl font-bold mb-4 px-4">{title}</h2>
      
      <div className="relative group">
        {/* Left Arrow */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-background/80 hover:bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        {/* Right Arrow */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-background/80 hover:bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>

        {/* Movies Container */}
        <div
          id={`row-${title}`}
          className="flex space-x-4 overflow-x-auto scrollbar-hide px-4 pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="flex-shrink-0 w-48 cursor-pointer group/item"
              onClick={() => setSelectedMovie(movie)}
            >
              <div className="relative">
                <img
                  src={getImageUrl(movie.poster_path)}
                  alt={getMovieTitle(movie)}
                  className="w-full h-72 object-cover rounded-lg transition-transform duration-300 group-hover/item:scale-105"
                  loading="lazy"
                />
                
                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                  <div className="flex space-x-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="bg-white/20 hover:bg-white/30"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMovie(movie);
                      }}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    
                    {user && (
                      <Button
                        size="icon"
                        variant="secondary"
                        className="bg-white/20 hover:bg-white/30"
                        onClick={(e) => handleAddToList(movie, e)}
                      >
                        {isMovieInList(getMovieTitle(movie)) ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              <h3 className="mt-2 text-sm font-medium line-clamp-2">
                {getMovieTitle(movie)}
              </h3>
              
              <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                <span>⭐ {movie.vote_average?.toFixed(1)}</span>
                <span>
                  {movie.release_date 
                    ? new Date(movie.release_date).getFullYear()
                    : movie.first_air_date 
                    ? new Date(movie.first_air_date).getFullYear()
                    : ''
                  }
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Movie Modal */}
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          isOpen={!!selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </div>
  );
};