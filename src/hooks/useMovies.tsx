import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

// TMDb API configuration
const TMDB_API_KEY = 'be15ad0ba29bb61c8a3ec89bbc5b6ebe'; // TMDb API key configured
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
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
  const { user } = useAuth();
  const [userMovies, setUserMovies] = useState<UserMovie[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's movie list
  const fetchUserMovies = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('filmesadicionados')
        .select('*')
        .eq('idcliente', user.id)
        .order('dataadicionado', { ascending: false });

      if (error) throw error;
      setUserMovies(data || []);
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
    if (user) {
      fetchUserMovies();
    }
  }, [user]);

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
    if (!user) {
      toast({
        title: "Erro",
        description: "Precisa estar logado para adicionar filmes",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Check if movie already exists in user's list
      const { data: existing } = await supabase
        .from('filmesadicionados')
        .select('idfilmeadicionado')
        .eq('idcliente', user.id)
        .eq('nomefilme', movie.title)
        .single();

      if (existing) {
        toast({
          title: "Já na lista",
          description: "Este filme já está na sua lista",
          variant: "destructive",
        });
        return false;
      }

      // Add movie to user's list
      const { error } = await supabase
        .from('filmesadicionados')
        .insert({
          idcliente: user.id,
          nomefilme: movie.title
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `"${movie.title}" foi adicionado à sua lista`,
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
      const { error } = await supabase
        .from('filmesadicionados')
        .delete()
        .eq('idfilmeadicionado', movieId)
        .eq('idcliente', user.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Filme removido da sua lista",
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