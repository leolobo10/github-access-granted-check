import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🚀 movie-list function called')
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request handled')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Processing request...')
    
    // Usar service role key para evitar problemas de JWT
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const requestBody = await req.json()
    console.log('Request body:', JSON.stringify(requestBody))
    
    const { action, movieData, userId } = requestBody

    // Verificar se o userId foi fornecido
    if (!userId) {
      return new Response(
        JSON.stringify({ 
          error: 'ID do utilizador é obrigatório',
          success: false 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'add') {
      console.log('Processing add action...')
      const movieTitle = movieData.title || movieData.name || ''
      console.log('Movie title:', movieTitle)
      
      if (!movieTitle) {
        return new Response(
          JSON.stringify({ 
            error: 'Título do filme é obrigatório',
            success: false 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if movie already exists in user's list
      console.log('Checking if movie exists in list...')
      const { data: existing, error: checkError } = await supabase
        .from('filmesadicionados')
        .select('idfilmeadicionado')
        .eq('idcliente', userId)
        .eq('nomefilme', movieTitle)
        .maybeSingle()

      if (checkError) {
        console.error('Erro ao verificar filme existente:', checkError)
        return new Response(
          JSON.stringify({ 
            error: 'Erro ao verificar lista: ' + checkError.message,
            success: false 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (existing) {
        console.log('Movie already exists in list')
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Este filme já está na sua lista' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Add movie to user's list
      console.log('Adding movie to list...')
      const { error: insertError } = await supabase
        .from('filmesadicionados')
        .insert({
          idcliente: userId,
          nomefilme: movieTitle
        })

      if (insertError) {
        console.error('Erro ao adicionar filme:', insertError)
        return new Response(
          JSON.stringify({ 
            error: 'Erro ao adicionar filme à lista: ' + insertError.message,
            success: false 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Movie added successfully')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `"${movieTitle}" foi adicionado à sua lista` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'remove') {
      console.log('Processing remove action...')
      const { movieId } = movieData

      if (!movieId) {
        return new Response(
          JSON.stringify({ 
            error: 'ID do filme é obrigatório',
            success: false 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error: deleteError } = await supabase
        .from('filmesadicionados')
        .delete()
        .eq('idfilmeadicionado', movieId)
        .eq('idcliente', userId)

      if (deleteError) {
        console.error('Erro ao remover filme:', deleteError)
        return new Response(
          JSON.stringify({ 
            error: 'Erro ao remover filme da lista: ' + deleteError.message,
            success: false 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
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
      console.log('Processing list action...')
      const { data: userMovies, error: listError } = await supabase
        .from('filmesadicionados')
        .select('*')
        .eq('idcliente', userId)
        .order('dataadicionado', { ascending: false })

      if (listError) {
        console.error('Erro ao buscar lista:', listError)
        return new Response(
          JSON.stringify({ 
            error: 'Erro ao carregar lista de filmes: ' + listError.message,
            success: false 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
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
      JSON.stringify({ 
        error: 'Ação inválida',
        success: false 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('🔥 Unexpected error in movie-list function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro inesperado: ' + error.message,
        success: false,
        debug: 'unexpectedError',
        stack: error.stack
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})