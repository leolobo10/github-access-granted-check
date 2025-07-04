import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

// TMDb API configuration
const TMDB_API_KEY = '38c007f28d5b66f36b9c3cf8d8452a4b'; // TMDb API key configured
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export interface Movie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  genre_ids: number[];
  media_type?: 'movie' | 'tv';
  runtime?: number;
  cast?: Array<{ name: string; character: string }>;
}

export interface UserMovie {
  idfilmeadicionado: string;
  idcliente: string;
  nomefilme: string;
  dataadicionado: string;
  movieData?: Movie;
}

export const useMovies = () => {
  const { user, session } = useAuth();
  const [userMovies, setUserMovies] = useState<UserMovie[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's movie list
  const fetchUserMovies = async () => {
    console.log('🎬 fetchUserMovies called');
    console.log('🎬 User and session status:', { 
      hasUser: !!user, 
      hasSession: !!session,
      userEmail: user?.email 
    });
    
    if (!user || !session) {
      console.log('🎬 No user or session, skipping fetch');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('movie-list', {
        body: { action: 'list' },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      console.log('🎬 fetchUserMovies response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Erro ao carregar lista');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setUserMovies(data?.movies || []);
    } catch (error) {
      console.error('Error fetching user movies:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar sua lista de filmes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && session) {
      fetchUserMovies();
    }
  }, [user, session]);

  // Search movies from TMDb
  const searchMovies = async (query: string): Promise<Movie[]> => {
    if (!query.trim()) return [];

    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}`
      );
      
      if (!response.ok) throw new Error('Failed to search movies');
      
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error searching movies:', error);
      toast({
        title: "Erro",
        description: "Erro ao pesquisar filmes. Verifique se a API key do TMDb está configurada.",
        variant: "destructive",
      });
      return [];
    }
  };

  // Get popular movies
  const getPopularMovies = async (): Promise<Movie[]> => {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`
      );
      
      if (!response.ok) throw new Error('Failed to fetch popular movies');
      
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      return [];
    }
  };

  // Get movie details
  const getMovieDetails = async (movieId: number): Promise<Movie | null> => {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=credits`
      );
      
      if (!response.ok) throw new Error('Failed to fetch movie details');
      
      const data = await response.json();
      return {
        ...data,
        cast: data.credits?.cast?.slice(0, 10) || []
      };
    } catch (error) {
      console.error('Error fetching movie details:', error);
      return null;
    }
  };

  // Add movie to user's list
  const addMovieToList = async (movie: Movie): Promise<boolean> => {
    console.log('🎬 addMovieToList called');
    console.log('🎬 User status:', { 
      hasUser: !!user, 
      userEmail: user?.email,
      hasSession: !!session,
      hasAccessToken: !!session?.access_token 
    });
    
    if (!user || !session) {
      console.log('🎬 No user or session, redirecting to auth');
      toast({
        title: "Erro",
        description: "Precisa estar logado para adicionar filmes. Por favor, faça login novamente.",
        variant: "destructive",
      });
      return false;
    }

    const movieTitle = movie.title || movie.name || '';
    if (!movieTitle) {
      toast({
        title: "Erro",
        description: "Título do filme não encontrado",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log('🎬 Calling movie-list function with:', { 
        action: 'add', 
        movieData: { ...movie, title: movieTitle } 
      });
      
      console.log('🎬 Session details:', {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        userEmail: user?.email
      });

      const { data, error } = await supabase.functions.invoke('movie-list', {
        body: { 
          action: 'add', 
          movieData: { ...movie, title: movieTitle } 
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      console.log('🎬 Function response:', { data, error });
      console.log('🎬 Full response data:', JSON.stringify(data, null, 2));

      if (error) {
        console.error('Edge function error:', error);
        
        // Tentar obter mais detalhes do erro
        let errorMessage = error.message || 'Erro ao adicionar filme';
        if (error.context?.body) {
          try {
            const errorBody = JSON.parse(error.context.body);
            errorMessage = errorBody.error || errorMessage;
            console.log('Error details:', errorBody);
          } catch (e) {
            console.log('Could not parse error body:', error.context.body);
          }
        }
        
        toast({
          title: "Erro Detalhado",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      }

      if (data?.error) {
        console.log('Function returned error:', data.error);
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive",
        });
        return false;
      }

      if (data?.success === false) {
        toast({
          title: "Aviso",
          description: data.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Sucesso",
        description: data.message || `"${movieTitle}" foi adicionado à sua lista`,
      });

      // Refresh user's movie list
      fetchUserMovies();
      return true;
    } catch (error) {
      console.error('Error adding movie to list:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar filme à lista",
        variant: "destructive",
      });
      return false;
    }
  };

  // Remove movie from user's list
  const removeMovieFromList = async (movieId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.functions.invoke('movie-list', {
        body: { 
          action: 'remove', 
          movieData: { movieId } 
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Erro ao remover filme');
      }

      if (data?.error) {
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Sucesso",
        description: data.message || "Filme removido da sua lista",
      });

      // Refresh user's movie list
      fetchUserMovies();
      return true;
    } catch (error) {
      console.error('Error removing movie from list:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover filme da lista",
        variant: "destructive",
      });
      return false;
    }
  };

  // Check if movie is in user's list
  const isMovieInList = (movieTitle: string): boolean => {
    return userMovies.some(userMovie => userMovie.nomefilme === movieTitle);
  };

  return {
    userMovies,
    loading,
    searchMovies,
    getPopularMovies,
    getMovieDetails,
    addMovieToList,
    removeMovieFromList,
    isMovieInList,
    fetchUserMovies,
    TMDB_IMAGE_BASE_URL
  };
};