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
    console.log('=== AUTH-USER START ===')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const requestBody = await req.json()
    console.log('Request body:', requestBody)
    
    const { action, email, password, userData } = requestBody

    if (!action || !email || !password) {
      console.error('Missing required fields:', { action, email: !!email, password: !!password })
      return new Response(JSON.stringify({ 
        error: 'Campos obrigatórios em falta',
        success: false 
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'signup') {
      console.log('Processing signup for:', email)
      
      try {
        // Verificar se utilizador já existe
        const { data: existingUsers } = await supabase.auth.admin.listUsers()
        const existingUser = existingUsers.users.find(u => u.email === email)
        
        if (existingUser) {
          console.log('User exists, deleting:', existingUser.id)
          await supabase.auth.admin.deleteUser(existingUser.id)
        }

        // Deletar da tabela cliente também
        await supabase.from('cliente').delete().eq('email', email)
        console.log('Cleaned up existing cliente record')

        // Criar novo utilizador
        console.log('Creating new user with metadata:', userData)
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          phone_confirm: true,
          user_metadata: userData || {}
        })

        if (authError) {
          console.error('Auth creation error:', authError)
          return new Response(JSON.stringify({ 
            error: `Erro na criação: ${authError.message}`,
            success: false 
          }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (!authData.user) {
          console.error('No user returned from auth creation')
          return new Response(JSON.stringify({ 
            error: 'Falha na criação do utilizador',
            success: false 
          }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        console.log('Auth user created:', authData.user.id)

        // Inserir na tabela cliente
        const clienteData = {
          idcliente: authData.user.id,
          nome: userData?.nome || 'Utilizador',
          email: email,
          senha: 'supabase_auth',
          telefone: userData?.telefone || null,
          endereco: userData?.endereco || null,
          ativo: true
        }
        
        console.log('Inserting cliente data:', clienteData)
        
        const { error: clienteError } = await supabase
          .from('cliente')
          .insert(clienteData)

        if (clienteError) {
          console.error('Cliente insertion error:', clienteError)
          // Limpar utilizador auth se cliente falhou
          await supabase.auth.admin.deleteUser(authData.user.id)
          return new Response(JSON.stringify({ 
            error: `Erro na base de dados: ${clienteError.message}`,
            success: false 
          }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        console.log('=== SIGNUP SUCCESS ===')

        return new Response(JSON.stringify({ 
          success: true, 
          user: authData.user,
          message: 'Conta criada com sucesso!' 
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      } catch (signupError) {
        console.error('Signup process error:', signupError)
        return new Response(JSON.stringify({ 
          error: `Erro no processo: ${signupError.message}`,
          success: false 
        }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    console.log('Invalid action:', action)
    return new Response(JSON.stringify({ 
      error: 'Ação inválida',
      success: false 
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('=== FUNCTION ERROR ===', error)
    return new Response(JSON.stringify({ 
      error: `Erro interno: ${error.message}`,
      success: false 
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})