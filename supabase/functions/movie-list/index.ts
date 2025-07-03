import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Token de autorização necessário')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get user from JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Utilizador não autenticado')
    }

    const { action, movieData } = await req.json()

    if (action === 'add') {
      const movieTitle = movieData.title || movieData.name || ''
      if (!movieTitle) {
        throw new Error('Título do filme é obrigatório')
      }

      // Check if movie already exists in user's list
      const { data: existing, error: checkError } = await supabase
        .from('filmesadicionados')
        .select('idfilmeadicionado')
        .eq('idcliente', user.id)
        .eq('nomefilme', movieTitle)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Erro ao verificar filme existente:', checkError)
        throw new Error('Erro ao verificar lista')
      }

      if (existing) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Este filme já está na sua lista' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Add movie to user's list
      const { error: insertError } = await supabase
        .from('filmesadicionados')
        .insert({
          idcliente: user.id,
          nomefilme: movieTitle
        })

      if (insertError) {
        console.error('Erro ao adicionar filme:', insertError)
        throw new Error('Erro ao adicionar filme à lista')
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `"${movieTitle}" foi adicionado à sua lista` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'remove') {
      const { movieId } = movieData

      if (!movieId) {
        throw new Error('ID do filme é obrigatório')
      }

      const { error: deleteError } = await supabase
        .from('filmesadicionados')
        .delete()
        .eq('idfilmeadicionado', movieId)
        .eq('idcliente', user.id)

      if (deleteError) {
        console.error('Erro ao remover filme:', deleteError)
        throw new Error('Erro ao remover filme da lista')
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Filme removido da sua lista' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'list') {
      const { data: userMovies, error: listError } = await supabase
        .from('filmesadicionados')
        .select('*')
        .eq('idcliente', user.id)
        .order('dataadicionado', { ascending: false })

      if (listError) {
        console.error('Erro ao buscar lista:', listError)
        throw new Error('Erro ao carregar lista de filmes')
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          movies: userMovies || [] 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in movie-list function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})