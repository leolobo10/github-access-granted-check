-- Melhorar a função handle_new_user para melhor sincronização
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserir na tabela cliente automaticamente quando um utilizador é criado no auth
  INSERT INTO public.cliente (idcliente, nome, email, senha, telefone, endereco, ativo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email_change_token_new, NEW.email, 'Utilizador'),
    COALESCE(NEW.email, NEW.email_change_token_new),
    'supabase_auth', -- Password managed by Supabase Auth
    NEW.raw_user_meta_data->>'telefone',
    NEW.raw_user_meta_data->>'endereco',
    true
  )
  ON CONFLICT (idcliente) DO UPDATE SET
    nome = COALESCE(NEW.raw_user_meta_data->>'nome', EXCLUDED.nome),
    email = COALESCE(NEW.email, EXCLUDED.email),
    telefone = COALESCE(NEW.raw_user_meta_data->>'telefone', EXCLUDED.telefone),
    endereco = COALESCE(NEW.raw_user_meta_data->>'endereco', EXCLUDED.endereco),
    updated_at = now();
    
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE LOG 'Error in handle_new_user: %, SQL State: %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;