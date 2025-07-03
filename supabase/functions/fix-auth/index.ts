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

    console.log('=== FIX AUTH FOR:', email, '===')

    // Lista todos os utilizadores para debug
    const { data: allUsers } = await supabase.auth.admin.listUsers()
    console.log('Total users in auth:', allUsers.users.length)
    
    const existingUser = allUsers.users.find(u => u.email === email)
    console.log('User exists in auth:', !!existingUser)

    if (existingUser) {
      console.log('Existing user details:', {
        id: existingUser.id,
        email: existingUser.email,
        email_confirmed_at: existingUser.email_confirmed_at,
        created_at: existingUser.created_at
      })

      // Tentar fazer login com o utilizador existente
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (loginError) {
        console.log('Login failed:', loginError.message)
        
        // Se login falhou, deletar e recriar
        console.log('Deleting and recreating user')
        await supabase.auth.admin.deleteUser(existingUser.id)
        
        // Recriar utilizador
        const { data: newAuthData, error: newAuthError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          phone_confirm: true,
          user_metadata: { nome: 'LEONARDO MONTEIRO NUNES LOBO' }
        })

        if (newAuthError) {
          console.error('Failed to recreate user:', newAuthError)
          return new Response(JSON.stringify({ 
            error: newAuthError.message,
            success: false 
          }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        console.log('User recreated:', newAuthData.user?.id)

        // Atualizar tabela cliente com novo ID
        const { error: updateError } = await supabase
          .from('cliente')
          .update({ idcliente: newAuthData.user!.id })
          .eq('email', email)

        if (updateError) {
          console.error('Failed to update cliente:', updateError)
        }

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Utilizador recriado com sucesso',
          user_id: newAuthData.user?.id
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      } else {
        console.log('Login successful')
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Login funciona correctamente',
          user_id: loginData.user?.id
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    } else {
      console.log('User does not exist in auth, creating...')
      
      // Criar utilizador
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: { nome: 'LEONARDO MONTEIRO NUNES LOBO' }
      })

      if (authError) {
        console.error('Failed to create user:', authError)
        return new Response(JSON.stringify({ 
          error: authError.message,
          success: false 
        }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      console.log('User created:', authData.user?.id)

      // Atualizar tabela cliente com novo ID
      const { error: updateError } = await supabase
        .from('cliente')
        .update({ idcliente: authData.user!.id })
        .eq('email', email)

      if (updateError) {
        console.error('Failed to update cliente:', updateError)
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Utilizador criado com sucesso',
        user_id: authData.user?.id
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})