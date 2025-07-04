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
    
    // Verificar se existe header de autorização
    const authHeader = req.headers.get('Authorization')
    console.log('Auth header present:', !!authHeader)
    
    if (!authHeader) {
      console.error('Missing authorization header')
      return new Response(
        JSON.stringify({ 
          error: 'Token de autorização necessário',
          success: false,
          debug: 'noAuthHeader'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Testar criação do cliente Supabase
    let supabase;
    try {
      supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      )
      console.log('Supabase client created')
    } catch (e) {
      console.error('Error creating supabase client:', e)
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao criar cliente Supabase: ' + e.message,
          success: false,
          debug: 'supabaseClientError'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar autenticação
    let user;
    try {
      console.log('Getting user from auth...')
      const { data: authData, error: userError } = await supabase.auth.getUser()
      
      console.log('Full auth response:', JSON.stringify({
        data: authData,
        error: userError
      }, null, 2))
      
      if (userError) {
        console.error('User error details:', userError)
        return new Response(
          JSON.stringify({ 
            error: 'Erro específico: ' + JSON.stringify(userError),
            success: false,
            debug: 'userError',
            fullError: userError
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      if (!authData?.user) {
        console.error('No user in auth data')
        return new Response(
          JSON.stringify({ 
            error: 'Nenhum utilizador encontrado nos dados de autenticação',
            success: false,
            debug: 'noUserInData',
            authData: authData
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      user = authData.user;
      console.log('User authenticated successfully:', user.id)
    } catch (e) {
      console.error('Exception during auth:', e)
      return new Response(
        JSON.stringify({ 
          error: 'Excepção durante autenticação: ' + e.message,
          success: false,
          debug: 'authException',
          stack: e.stack
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Processar body da requisição
    let requestBody;
    try {
      requestBody = await req.json()
      console.log('Request body:', JSON.stringify(requestBody))
    } catch (e) {
      console.error('Error parsing request body:', e)
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao processar corpo da requisição: ' + e.message,
          success: false,
          debug: 'bodyParseError'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, movieData } = requestBody

    // Se chegou até aqui, tudo está funcionando
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Autenticação e setup funcionando',
        debug: {
          userId: user.id,
          action: action,
          movieTitle: movieData?.title || movieData?.name
        }
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