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
    
    // Primeiro vamos testar sem autenticação para ver se a função está funcionando
    const requestBody = await req.json()
    console.log('Request body:', JSON.stringify(requestBody))
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Função está funcionando',
        received: requestBody
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('🔥 Error in movie-list function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})