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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, email, password, userData } = await req.json()

    if (action === 'signup') {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email for testing
        user_metadata: userData
      })

      if (authError) {
        // Handle specific auth errors with appropriate status codes
        if (authError.message.includes('A user with this email address has already been registered')) {
          return new Response(
            JSON.stringify({ 
              error: 'Este email já está registado. Tente fazer login.',
              success: false 
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        throw new Error(`Auth error: ${authError.message}`)
      }

      if (!authData.user) {
        throw new Error('Falha ao criar utilizador')
      }

      // Insert into cliente table with service role (bypasses RLS)
      const { error: clienteError } = await supabase
        .from('cliente')
        .insert({
          idcliente: authData.user.id,
          nome: userData.nome,
          email: email,
          senha: 'supabase_auth',
          telefone: userData.telefone || null,
          endereco: userData.endereco || null,
          ativo: true
        })

      if (clienteError) {
        console.error('Erro ao inserir cliente:', clienteError)
        throw new Error(`Database error: ${clienteError.message}`)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: authData.user,
          message: 'Conta criada com sucesso!' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'signin') {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        throw new Error(`Login error: ${authError.message}`)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: authData.user,
          session: authData.session,
          message: 'Login realizado com sucesso!' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in auth-user function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})