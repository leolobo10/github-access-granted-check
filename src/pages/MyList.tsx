import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMovies, UserMovie } from '@/hooks/useMovies';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function MyList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userMovies, loading, removeMovieFromList, searchMovies } = useMovies();
  const [moviesWithDetails, setMoviesWithDetails] = useState<(UserMovie & { movieData?: any })[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchMovieDetails();
  }, [user, userMovies]);

  const fetchMovieDetails = async () => {
    const moviesWithData = await Promise.all(
      userMovies.map(async (userMovie) => {
        try {
          // Try to get movie details by searching for the title
          const searchResults = await searchMovies(userMovie.nomefilme);
          const movieData = searchResults.find(movie => 
            movie.title.toLowerCase() === userMovie.nomefilme.toLowerCase()
          ) || searchResults[0]; // Get the first result if exact match not found

          return {
            ...userMovie,
            movieData
          };
        } catch (error) {
          console.error('Erro ao buscar detalhes do filme para:', userMovie.nomefilme);
          return userMovie;
        }
      })
    );
    
    setMoviesWithDetails(moviesWithData);
  };

  const handleRemoveMovie = async (movieId: string) => {
    await removeMovieFromList(movieId);
  };

  const handleSearch = () => {
    // Search functionality handled by navbar, redirect to main page
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
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Minha Lista</h1>
          <p className="text-muted-foreground">
            {userMovies.length} {userMovies.length === 1 ? 'filme' : 'filmes'} na sua lista
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        ) : userMovies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {moviesWithDetails.map((userMovie) => (
              <Card key={userMovie.idfilmeadicionado} className="group relative overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-[2/3] overflow-hidden">
                    {userMovie.movieData?.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w500${userMovie.movieData.poster_path}`}
                        alt={userMovie.nomefilme}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground text-center p-4">
                          {userMovie.nomefilme}
                        </span>
                      </div>
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover da lista</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover "{userMovie.nomefilme}" da sua lista?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleRemoveMovie(userMovie.idfilmeadicionado)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold line-clamp-2 mb-2">
                      {userMovie.nomefilme}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Adicionado em {new Date(userMovie.dataadicionado).toLocaleDateString('pt-BR')}
                    </p>
                    {userMovie.movieData && (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-medium">
                          ⭐ {userMovie.movieData.vote_average?.toFixed(1)}
                        </span>
                        {userMovie.movieData.release_date && (
                          <span className="text-sm text-muted-foreground">
                            {new Date(userMovie.movieData.release_date).getFullYear()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-semibold mb-4">Sua lista está vazia</h3>
              <p className="text-muted-foreground mb-6">
                Explore nosso catálogo e adicione filmes que deseja assistir à sua lista pessoal
              </p>
              <Button onClick={() => navigate('/')}>
                Explorar Filmes
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}