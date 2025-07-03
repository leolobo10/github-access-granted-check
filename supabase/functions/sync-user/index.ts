import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password } = await req.json()

    console.log('=== SYNC USER:', email, '===')

    // Buscar dados da tabela cliente
    const { data: clienteData, error: clienteError } = await supabase
      .from('cliente')
      .select('*')
      .eq('email', email)
      .single()

    if (clienteError || !clienteData) {
      console.error('User not found in cliente table:', clienteError)
      return new Response(JSON.stringify({ 
        error: 'Utilizador não encontrado na base de dados',
        success: false 
      }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    console.log('Found cliente:', clienteData)

    // Verificar se existe no Supabase Auth
    const { data: allUsers } = await supabase.auth.admin.listUsers()
    const existingAuthUser = allUsers.users.find(u => u.email === email)

    if (existingAuthUser) {
      console.log('User exists in auth:', existingAuthUser.id)
      
      // Verificar se os IDs coincidem
      if (existingAuthUser.id !== clienteData.idcliente) {
        console.log('ID mismatch, updating cliente table')
        // Atualizar tabela cliente com ID correto
        await supabase
          .from('cliente')
          .update({ idcliente: existingAuthUser.id })
          .eq('email', email)
      }
    } else {
      console.log('User does not exist in auth, creating...')
      
      // Criar utilizador no Supabase Auth com o ID existente
      const { data: newAuthData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: {
          nome: clienteData.nome,
          telefone: clienteData.telefone,
          endereco: clienteData.endereco
        }
      })

      if (authError) {
        console.error('Failed to create auth user:', authError)
        return new Response(JSON.stringify({ 
          error: `Erro ao criar utilizador: ${authError.message}`,
          success: false 
        }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      console.log('Auth user created:', newAuthData.user?.id)

      // Atualizar tabela cliente com novo ID
      if (newAuthData.user) {
        await supabase
          .from('cliente')
          .update({ idcliente: newAuthData.user.id })
          .eq('email', email)
      }
    }

    // Testar login
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (loginError) {
      console.error('Login test failed:', loginError)
      return new Response(JSON.stringify({ 
        error: `Login ainda falha: ${loginError.message}`,
        success: false 
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    console.log('=== SYNC SUCCESS ===')

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Utilizador sincronizado com sucesso!',
      user_id: loginData.user?.id
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('Sync error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})