import { useState, useEffect } from 'react';
import { X, Plus, Check, Play, ThumbsUp, ThumbsDown, MessageCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Movie, useTMDB } from '@/hooks/useTMDB';
import { useMovies } from '@/hooks/useMovies';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MovieModalProps {
  movie: Movie;
  isOpen: boolean;
  onClose: () => void;
}

interface Rating {
  id: string;
  idcliente: string;
  idfilme: string;
  nomefilme: string;
  tipo_avaliacao: 'like' | 'dislike';
  comentario: string | null;
  created_at: string;
  nome_cliente?: string;
}

export const MovieModal = ({ movie, isOpen, onClose }: MovieModalProps) => {
  const { user } = useAuth();
  const { getMovieInfo, getMovieTrailer } = useTMDB();
  const { addMovieToList, isMovieInList } = useMovies();
  const [movieDetails, setMovieDetails] = useState<Movie | null>(null);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [userRating, setUserRating] = useState<'like' | 'dislike' | null>(null);
  const [newComment, setNewComment] = useState('');
  const [loadingRatings, setLoadingRatings] = useState(false);

  useEffect(() => {
    if (isOpen && movie) {
      loadMovieData();
      loadRatings();
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
      console.error('Erro ao carregar dados do filme:', error);
      setMovieDetails(movie);
    } finally {
      setLoading(false);
    }
  };

  const loadRatings = async () => {
    setLoadingRatings(true);
    try {
      const movieTitle = getMovieTitle(movie);
      const { data: ratingsData, error } = await supabase
        .from('avaliacoes')
        .select('*')
        .eq('nomefilme', movieTitle)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar avaliações:', error);
        return;
      }

      // Get user names for each rating
      const ratingsWithNames = [];
      for (const rating of ratingsData || []) {
        const { data: clienteData } = await supabase
          .from('cliente')
          .select('nome')
          .eq('idcliente', rating.idcliente)
          .single();

        ratingsWithNames.push({
          ...rating,
          tipo_avaliacao: rating.tipo_avaliacao as 'like' | 'dislike' | null,
          nome_cliente: clienteData?.nome || 'Usuário'
        });
      }

      setRatings(ratingsWithNames);

      // Check user's current rating
      if (user) {
        const userCurrentRating = ratingsWithNames.find(r => r.idcliente === user.id);
        setUserRating(userCurrentRating?.tipo_avaliacao || null);
      }
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    } finally {
      setLoadingRatings(false);
    }
  };

  const handleRating = async (type: 'like' | 'dislike') => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para avaliar filmes",
        variant: "destructive",
      });
      return;
    }

    try {
      const movieTitle = getMovieTitle(movieDetails || movie);
      
      // Check if user already has a rating
      const existingRating = ratings.find(r => r.idcliente === user.id);
      
      if (existingRating) {
        if (existingRating.tipo_avaliacao === type) {
          // Remove rating if clicking the same type
          const { error } = await supabase
            .from('avaliacoes')
            .delete()
            .eq('id', existingRating.id);

          if (error) throw error;
          
          setUserRating(null);
          toast({
            title: "Avaliação removida",
            description: "Sua avaliação foi removida",
          });
        } else {
          // Update rating type
          const { error } = await supabase
            .from('avaliacoes')
            .update({ tipo_avaliacao: type })
            .eq('id', existingRating.id);

          if (error) throw error;
          
          setUserRating(type);
          toast({
            title: "Avaliação atualizada",
            description: `Você ${type === 'like' ? 'curtiu' : 'não curtiu'} este filme`,
          });
        }
      } else {
        // Create new rating
        const { error } = await supabase
          .from('avaliacoes')
          .insert({
            idcliente: user.id,
            idfilme: String(movie.id),
            nomefilme: movieTitle,
            tipo_avaliacao: type
          });

        if (error) throw error;
        
        setUserRating(type);
        toast({
          title: "Avaliação registrada",
          description: `Você ${type === 'like' ? 'curtiu' : 'não curtiu'} este filme`,
        });
      }

      // Reload ratings
      await loadRatings();
    } catch (error) {
      console.error('Erro ao avaliar filme:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar avaliação",
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para comentar",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "Comentário vazio",
        description: "Digite um comentário",
        variant: "destructive",
      });
      return;
    }

    try {
      const movieTitle = getMovieTitle(movieDetails || movie);
      
      const { error } = await supabase
        .from('avaliacoes')
        .insert({
          idcliente: user.id,
          idfilme: String(movie.id),
          nomefilme: movieTitle,
          comentario: newComment.trim()
        });

      if (error) throw error;
      
      setNewComment('');
      toast({
        title: "Comentário adicionado",
        description: "Seu comentário foi publicado",
      });

      // Reload ratings
      await loadRatings();
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar comentário",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('avaliacoes')
        .delete()
        .eq('id', commentId)
        .eq('idcliente', user.id);

      if (error) throw error;
      
      toast({
        title: "Comentário removido",
        description: "Seu comentário foi removido",
      });

      // Reload ratings
      await loadRatings();
    } catch (error) {
      console.error('Erro ao remover comentário:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover comentário",
        variant: "destructive",
      });
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
                {user && trailerUrl ? (
                  <Button
                    size="lg"
                    className="bg-white text-black hover:bg-white/90"
                    onClick={() => setShowTrailer(!showTrailer)}
                  >
                    <Play className="h-5 w-5 mr-2" />
                    {showTrailer ? 'Fechar Trailer' : 'Assistir Trailer'}
                  </Button>
                ) : user ? (
                  <Button
                    size="lg"
                    variant="secondary"
                    disabled
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Trailer não disponível
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => window.location.href = '/auth'}
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Faça Login para Assistir
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

          {/* Trailer Section */}
          {showTrailer && trailerUrl && (
            <div className="px-6 pb-6">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 right-0 z-10 bg-background/80 hover:bg-background/90"
                  onClick={() => setShowTrailer(false)}
                >
                  <X className="h-6 w-6" />
                </Button>
                <div className="relative w-full h-0 pb-[56.25%]">
                  <iframe
                    src={trailerUrl}
                    title="Trailer do Filme"
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    frameBorder="0"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              </div>
            </div>
          )}

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

            {/* Rating and Comments Section */}
            <div className="mt-8 border-t pt-6">
              {/* Rating Buttons */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Avalie este filme</h3>
                <div className="flex items-center gap-4">
                  <Button
                    variant={userRating === 'like' ? 'default' : 'outline'}
                    onClick={() => handleRating('like')}
                    className="flex items-center gap-2"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Gostei
                    <span className="text-sm">
                      ({ratings.filter(r => r.tipo_avaliacao === 'like').length})
                    </span>
                  </Button>
                  <Button
                    variant={userRating === 'dislike' ? 'destructive' : 'outline'}
                    onClick={() => handleRating('dislike')}
                    className="flex items-center gap-2"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    Não Gostei
                    <span className="text-sm">
                      ({ratings.filter(r => r.tipo_avaliacao === 'dislike').length})
                    </span>
                  </Button>
                </div>
              </div>

              {/* Add Comment Section */}
              {user && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">
                    <MessageCircle className="inline h-5 w-5 mr-2" />
                    Deixe seu comentário
                  </h3>
                  <div className="space-y-3">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="O que você achou deste filme?"
                      rows={3}
                      className="resize-none"
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="w-full sm:w-auto"
                    >
                      Publicar Comentário
                    </Button>
                  </div>
                </div>
              )}

              {/* Comments List */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Comentários ({ratings.filter(r => r.comentario).length})
                </h3>
                
                {loadingRatings ? (
                  <div className="text-center py-4">
                    <p>Carregando comentários...</p>
                  </div>
                ) : ratings.filter(r => r.comentario).length > 0 ? (
                  <div className="space-y-4">
                    {ratings
                      .filter(r => r.comentario)
                      .map((rating) => (
                        <div key={rating.id} className="bg-muted/30 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-primary">
                                  {rating.nome_cliente}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(rating.created_at).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              <p className="text-foreground leading-relaxed">
                                {rating.comentario}
                              </p>
                            </div>
                            {user && user.id === rating.idcliente && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteComment(rating.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum comentário ainda.</p>
                    {!user && (
                      <p className="text-sm mt-2">
                        <Button variant="link" onClick={() => window.location.href = '/auth'}>
                          Faça login
                        </Button>
                        para deixar o primeiro comentário!
                      </p>
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