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
      console.log('Creating user:', email)
      
      // Check if user already exists in auth
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers.users.find(u => u.email === email)
      
      if (existingUser) {
        console.log('User already exists in auth, deleting first')
        await supabase.auth.admin.deleteUser(existingUser.id)
      }

      // Create auth user with admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: userData
      })

      if (authError) {
        console.error('Auth creation error:', authError)
        return new Response(
          JSON.stringify({ 
            error: `Erro ao criar utilizador: ${authError.message}`,
            success: false 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!authData.user) {
        console.error('No user data returned')
        return new Response(
          JSON.stringify({ 
            error: 'Falha ao criar utilizador',
            success: false 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('User created in auth:', authData.user.id)

      // Delete existing cliente record if exists
      await supabase
        .from('cliente')
        .delete()
        .eq('email', email)

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
        // If cliente creation fails, delete the auth user to avoid orphans
        await supabase.auth.admin.deleteUser(authData.user.id)
        return new Response(
          JSON.stringify({ 
            error: `Erro na base de dados: ${clienteError.message}`,
            success: false 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('User created successfully:', authData.user.id)

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