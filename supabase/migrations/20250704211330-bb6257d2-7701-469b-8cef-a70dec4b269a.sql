-- Criar política para permitir que utilizadores apaguem os seus próprios dados da tabela cliente
CREATE POLICY "Enable delete for users to delete own data" 
ON public.cliente 
FOR DELETE 
TO authenticated 
USING (auth.uid() = idcliente);