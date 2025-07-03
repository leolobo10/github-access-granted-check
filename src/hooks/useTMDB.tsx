import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

const API_KEY = '38c007f28d5b66f36b9c3cf8d8452a4b';
const API_BASE = 'https://api.themoviedb.org/3';

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
}

export interface Genre {
  id: number;
  name: string;
}

export interface MovieSection {
  slug: string;
  title: string;
  items: Movie[];
}

const basicFetch = async (endpoint: string) => {
  try {
    const req = await fetch(`${API_BASE}${endpoint}`);
    const json = await req.json();
    return json;
  } catch (error) {
    console.error('Error fetching from TMDB:', error);
    return { results: [] };
  }
};

export const useTMDB = () => {
  const [loading, setLoading] = useState(false);

  const getHomeList = async (): Promise<MovieSection[]> => {
    setLoading(true);
    try {
      const sections = await Promise.all([
        {
          slug: 'trending',
          title: 'Recomendados',
          items: await basicFetch(`/trending/all/week?language=pt-PT&api_key=${API_KEY}`)
        },
        {
          slug: 'popular',
          title: 'Popular',
          items: await basicFetch(`/movie/popular?language=pt-PT&api_key=${API_KEY}`)
        },
        {
          slug: 'toprated',
          title: 'Mais Bem Avaliados',
          items: await basicFetch(`/movie/top_rated?language=pt-PT&api_key=${API_KEY}`)
        },
        {
          slug: 'action',
          title: 'Ação',
          items: await basicFetch(`/discover/movie?with_genres=28&language=pt-PT&api_key=${API_KEY}`)
        },
        {
          slug: 'comedy',
          title: 'Comédia',
          items: await basicFetch(`/discover/movie?with_genres=35&language=pt-PT&api_key=${API_KEY}`)
        },
        {
          slug: 'horror',
          title: 'Terror',
          items: await basicFetch(`/discover/movie?with_genres=27&language=pt-PT&api_key=${API_KEY}`)
        },
        {
          slug: 'romance',
          title: 'Romance',
          items: await basicFetch(`/discover/movie?with_genres=10749&language=pt-PT&api_key=${API_KEY}`)
        },
        {
          slug: 'documentary',
          title: 'Documentário',
          items: await basicFetch(`/discover/movie?with_genres=99&language=pt-PT&api_key=${API_KEY}`)
        },
      ]);

      return sections.map(section => ({
        ...section,
        items: section.items.results || []
      }));
    } catch (error) {
      console.error('Error loading home list:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar filmes",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getMovieInfo = async (movieId: number, type: 'movie' | 'tv'): Promise<Movie | null> => {
    try {
      let info: any = {};

      if (type === 'movie') {
        info = await basicFetch(`/movie/${movieId}?language=pt-PT&api_key=${API_KEY}`);
        
        if (!info.overview) {
          let infoEn = await basicFetch(`/movie/${movieId}?language=en-US&api_key=${API_KEY}`);
          info.overview = infoEn.overview || "Descrição não disponível.";
        }
      } else {
        info = await basicFetch(`/tv/${movieId}?language=pt-PT&api_key=${API_KEY}`);
        
        if (!info.overview) {
          let infoEn = await basicFetch(`/tv/${movieId}?language=en-US&api_key=${API_KEY}`);
          info.overview = infoEn.overview || "Descrição não disponível.";
        }
      }

      return info as Movie;
    } catch (error) {
      console.error('Error fetching movie info:', error);
      return null;
    }
  };

  const getMovieTrailer = async (movieId: number, type: 'movie' | 'tv'): Promise<string | null> => {
    try {
      const endpoint = type === 'movie' 
        ? `/movie/${movieId}/videos?api_key=${API_KEY}&language=pt-PT`
        : `/tv/${movieId}/videos?api_key=${API_KEY}&language=pt-PT`;
      
      const response = await basicFetch(endpoint);
      const trailers = response.results?.filter((video: any) => 
        video.type === 'Trailer' && video.site === 'YouTube'
      );

      if (trailers && trailers.length > 0) {
        return `https://www.youtube.com/embed/${trailers[0].key}`;
      }

      // Try English if no Portuguese trailer
      const endpointEn = type === 'movie' 
        ? `/movie/${movieId}/videos?api_key=${API_KEY}&language=en-US`
        : `/tv/${movieId}/videos?api_key=${API_KEY}&language=en-US`;
      
      const responseEn = await basicFetch(endpointEn);
      const trailersEn = responseEn.results?.filter((video: any) => 
        video.type === 'Trailer' && video.site === 'YouTube'
      );

      if (trailersEn && trailersEn.length > 0) {
        return `https://www.youtube.com/embed/${trailersEn[0].key}`;
      }

      return null;
    } catch (error) {
      console.error('Error fetching trailer:', error);
      return null;
    }
  };

  const searchMovies = async (query: string): Promise<Movie[]> => {
    if (!query.trim()) return [];
    
    try {
      setLoading(true);
      const response = await basicFetch(`/search/multi?api_key=${API_KEY}&language=pt-PT&query=${encodeURIComponent(query)}`);
      return response.results || [];
    } catch (error) {
      console.error('Error searching movies:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getMoviesByGenre = async (genreId: number, type: 'movie' | 'tv' = 'movie'): Promise<Movie[]> => {
    try {
      setLoading(true);
      const endpoint = type === 'movie' 
        ? `/discover/movie?with_genres=${genreId}&language=pt-PT&api_key=${API_KEY}`
        : `/discover/tv?with_genres=${genreId}&language=pt-PT&api_key=${API_KEY}`;
      
      const response = await basicFetch(endpoint);
      return response.results || [];
    } catch (error) {
      console.error('Error fetching movies by genre:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getGenres = async (type: 'movie' | 'tv' = 'movie'): Promise<Genre[]> => {
    try {
      const endpoint = `/genre/${type}/list?api_key=${API_KEY}&language=pt-PT`;
      const response = await basicFetch(endpoint);
      return response.genres || [];
    } catch (error) {
      console.error('Error fetching genres:', error);
      return [];
    }
  };

  return {
    loading,
    getHomeList,
    getMovieInfo,
    getMovieTrailer,
    searchMovies,
    getMoviesByGenre,
    getGenres,
  };
};