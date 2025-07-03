-- Fix RLS policies for cliente table to allow signup
DROP POLICY IF EXISTS "Clientes podem inserir seus próprios dados" ON public.cliente;
DROP POLICY IF EXISTS "Clientes podem ver seus próprios dados" ON public.cliente;
DROP POLICY IF EXISTS "Clientes podem atualizar seus próprios dados" ON public.cliente;

-- Create new policies that work with signup
CREATE POLICY "Enable insert for authenticated users only" 
ON public.cliente 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = idcliente);

CREATE POLICY "Enable select for users to view own data" 
ON public.cliente 
FOR SELECT 
TO authenticated 
USING (auth.uid() = idcliente);

CREATE POLICY "Enable update for users to update own data" 
ON public.cliente 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = idcliente);