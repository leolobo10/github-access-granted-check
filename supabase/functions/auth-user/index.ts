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

    const { action, email, password, userData } = await req.json()

    if (action === 'signup') {
      console.log('=== SIGNUP START ===')
      console.log('Email:', email)
      
      // Primeiro, deletar qualquer utilizador existente
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers.users.find(u => u.email === email)
      
      if (existingUser) {
        console.log('Deleting existing user:', existingUser.id)
        await supabase.auth.admin.deleteUser(existingUser.id)
      }

      // Deletar da tabela cliente também
      await supabase.from('cliente').delete().eq('email', email)

      // Criar novo utilizador
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: userData
      })

      if (authError) {
        console.error('Auth error:', authError)
        return new Response(JSON.stringify({ 
          error: authError.message,
          success: false 
        }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      console.log('User created in auth:', authData.user?.id)

      // Inserir na tabela cliente
      const { error: clienteError } = await supabase
        .from('cliente')
        .insert({
          idcliente: authData.user!.id,
          nome: userData.nome,
          email: email,
          senha: 'supabase_auth',
          telefone: userData.telefone || null,
          endereco: userData.endereco || null,
          ativo: true
        })

      if (clienteError) {
        console.error('Cliente error:', clienteError)
        await supabase.auth.admin.deleteUser(authData.user!.id)
        return new Response(JSON.stringify({ 
          error: clienteError.message,
          success: false 
        }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      console.log('=== SIGNUP SUCCESS ===')

      return new Response(JSON.stringify({ 
        success: true, 
        user: authData.user,
        message: 'Conta criada com sucesso!' 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})